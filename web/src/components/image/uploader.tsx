"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from "react";
import { UploadCloud, ImagePlus, X, CheckCircle2 } from "lucide-react";
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
  /** Compact dropzone without extra padding */
  compact?: boolean;
}

export function ImageDropzone({ multiple = true, maxFiles = 100, onFiles, busy, className, children, compact }: ImageDropzoneProps) {
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
        "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-all duration-200",
        compact ? "px-4 py-6" : "min-h-[180px] px-6 py-8",
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/70 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/30",
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
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        {dragging ? (
          <ImagePlus className={cn(compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
        ) : (
          <UploadCloud className={cn(compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
        )}
      </span>
      <div className="text-center">
        <p className={cn("font-medium text-foreground", compact ? "text-[13px]" : "text-sm")}>
          {dragging ? "Drop your images here" : "Drag & drop images, or "}
          {!dragging && (
            <span className="text-primary">browse</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>JPG</span>
        <span className="opacity-30">·</span>
        <span>PNG</span>
        <span className="opacity-30">·</span>
        <span>WebP</span>
        <span className="opacity-30">·</span>
        <span>Max {MAX_FILE_SIZE_MB} MB</span>
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
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Validating {pendingCount} file{pendingCount === 1 ? "" : "s"}…
        </div>
      )}
    </div>
  );
}
