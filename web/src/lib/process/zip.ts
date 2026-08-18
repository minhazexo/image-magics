import JSZip from "jszip";

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/**
 * Build a ZIP archive entirely in the browser and trigger a download.
 */
export async function downloadZip(entries: ZipEntry[], zipName = "imagetools-images.zip"): Promise<void> {
  if (!entries.length) return;
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const entry of entries) {
    let name = entry.name;
    let counter = 1;
    while (usedNames.has(name.toLowerCase())) {
      const dot = entry.name.lastIndexOf(".");
      const base = dot > 0 ? entry.name.slice(0, dot) : entry.name;
      const ext = dot > 0 ? entry.name.slice(dot) : "";
      name = `${base}-${counter}${ext}`;
      counter++;
    }
    usedNames.add(name.toLowerCase());
    zip.file(name, entry.blob);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "STORE",
    mimeType: "application/zip",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function humanizeZipName(base = "imagetools"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base}-${stamp}.zip`;
}