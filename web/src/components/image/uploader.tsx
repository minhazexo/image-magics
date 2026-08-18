"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from "react";
import { UploadCloud, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UploadedImage } from "@/lib/types";
import { decodeAndValidateImage, MAX_FILE_SIZE_MB, validateFileSize, validateFileType } from "@/lib/utils/validate";
import { inferFormatFromName } from "@/lib/utils/filename";
import { useToast } from "@/components/ui/toast";

interface ImageDropzoneProps {
  multiple?: boolean;
  maxFiles?: number;
  onFiles: (files: File[]) => void;
  busy?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ImageDropzone({ multiple = true, maxFiles = 100, onFiles, busy, className, children }: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name));
      if (!files.length) return;
      onFiles(files.slice(0, maxFiles));
    },
    [onFiles, maxFiles]
  );

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (busy) return;
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:border-primary/50",
        busy && "pointer-events-none opacity-60",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label="Upload images"
      aria-busy={busy || undefined}
      onClick={() => inputRef.current?.click()}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={onInputChange}
        aria-hidden
        tabIndex={-1}
      />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {dragging ? <ImagePlus className="h-6 w-6" aria-hidden /> : <UploadCloud className="h-6 w-6" aria-hidden />}
      </span>
      <div>
        <p className="text-base font-semibold text-foreground">
          {dragging ? "Drop your images here" : "Drop your images here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">or</p>
        <p className="mt-1 text-sm font-medium text-primary">Browse files</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>JPG</span><span>·</span><span>PNG</span><span>·</span><span>WEBP</span><span>·</span>
        <span>GIF</span><span>·</span><span>BMP</span><span>·</span><span>AVIF</span>
        <span className="ml-2">Up to {MAX_FILE_SIZE_MB} MB</span>
      </div>
      {children}
    </div>
  );
}

export interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  dropzoneLabel?: ReactNode;
}

let uploadIdCounter = 0;

/**
 * Universal image uploader with drag & drop, file picker, clipboard paste,
 * validation, duplicate detection and error handling.
 */
export function ImageUploader({ images, onChange, multiple = true, maxFiles = 100, className, dropzoneLabel }: ImageUploaderProps) {
  const toast = useToast();
  const [pendingCount, setPendingCount] = useState(0);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const existing = new Set(images.map((i) => `${i.name}|${i.size}|${i.lastModified}`));
      const incoming: UploadedImage[] = [];
      let dupes = 0;
      let errors = 0;

      setPendingCount(files.length);

      await Promise.all(
        files.map(async (file) => {
          const key = `${file.name}|${file.size}|${file.lastModified}`;
          if (existing.has(key)) {
            dupes++;
            return;
          }

          const typeCheck = validateFileType(file);
          if (!typeCheck.ok) {
            errors++;
            incoming.push({
              id: `upload-${++uploadIdCounter}`,
              file,
              name: file.name,
              url: "",
              width: 0,
              height: 0,
              size: file.size,
              lastModified: file.lastModified,
              format: inferFormatFromName(file.name),
              valid: false,
              error: typeCheck.error,
            });
            return;
          }

          const sizeCheck = validateFileSize(file);
          if (!sizeCheck.ok) {
            errors++;
            incoming.push({
              id: `upload-${++uploadIdCounter}`,
              file,
              name: file.name,
              url: "",
              width: 0,
              height: 0,
              size: file.size,
              lastModified: file.lastModified,
              format: inferFormatFromName(file.name),
              valid: false,
              error: sizeCheck.error,
            });
            return;
          }

          const decoded = await decodeAndValidateImage(file);
          if ("error" in decoded) {
            errors++;
            incoming.push({
              id: `upload-${++uploadIdCounter}`,
              file,
              name: file.name,
              url: "",
              width: 0,
              height: 0,
              size: file.size,
              lastModified: file.lastModified,
              format: inferFormatFromName(file.name),
              valid: false,
              error: decoded.error,
            });
            return;
          }

          const url = URL.createObjectURL(file);
          incoming.push({
            id: `upload-${++uploadIdCounter}`,
            file,
            name: file.name,
            url,
            width: decoded.width,
            height: decoded.height,
            size: file.size,
            lastModified: file.lastModified,
            format: inferFormatFromName(file.name),
            valid: true,
          });
        })
      );

      setPendingCount(0);
      if (incoming.length) onChange([...images, ...incoming]);

      if (dupes) toast.info(`${dupes} duplicate file${dupes === 1 ? " was" : "s were"} skipped.`);
      if (errors) toast.error("Some files could not be added", "They may be unsupported or too large.");
    },
    [images, onChange, toast]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  return (
    <div className={className}>
      <ImageDropzone
        multiple={multiple}
        maxFiles={maxFiles}
        onFiles={handleFiles}
        busy={pendingCount > 0}
      >
        {dropzoneLabel}
      </ImageDropzone>
      {pendingCount > 0 && (
        <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          Validating {pendingCount} file{pendingCount === 1 ? "" : "s"}…
        </p>
      )}
    </div>
  );
}