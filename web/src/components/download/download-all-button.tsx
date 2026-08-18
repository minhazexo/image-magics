"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadZip, humanizeZipName } from "@/lib/process/zip";
import type { ProcessingResult } from "@/lib/types";

interface DownloadAllButtonProps {
  results: ProcessingResult[];
  disabled?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function DownloadAllButton({ results, disabled, size = "default", className }: DownloadAllButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!results.length || busy) return;
    setBusy(true);
    try {
      await downloadZip(
        results.map((r) => ({ name: r.fileName, blob: r.blob })),
        humanizeZipName()
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant="secondary"
      onClick={handleClick}
      disabled={disabled || !results.length}
      loading={busy}
      className={className}
      icon={<Archive className="h-4 w-4" aria-hidden />}
    >
      Download All ({results.length})
    </Button>
  );
}