"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/process/client";

interface DownloadButtonProps {
  blob?: Blob | null;
  fileName?: string;
  disabled?: boolean;
  label?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
  onDownload?: () => void;
}

export function DownloadButton({ blob, fileName = "image.png", disabled, label = "Download", size = "default", className, onDownload }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = () => {
    if (!blob) return;
    setDownloading(true);
    window.setTimeout(() => {
      downloadBlob(blob, fileName);
      setDownloading(false);
      onDownload?.();
    }, 50);
  };

  return (
    <Button
      size={size}
      onClick={handleClick}
      disabled={disabled || !blob}
      className={className}
      icon={<Download className="h-4 w-4" aria-hidden />}
    >
      {label}
    </Button>
  );
}