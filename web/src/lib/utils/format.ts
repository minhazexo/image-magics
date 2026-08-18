export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const maxDecimals = i === 0 ? 0 : decimals;
  return `${value.toFixed(maxDecimals)} ${sizes[i]}`;
}

export function calculateSavings(originalSize: number, newSize: number): number {
  if (originalSize <= 0) return 0;
  const savings = ((originalSize - newSize) / originalSize) * 100;
  return Math.max(0, Math.min(100, savings));
}

export function formatSavings(originalSize: number, newSize: number): string {
  return `${calculateSavings(originalSize, newSize).toFixed(1)}%`;
}

export function estimateQualityLabel(quality: number): string {
  if (quality >= 95) return "Lossless-ish";
  if (quality >= 82) return "High quality";
  if (quality >= 70) return "Balanced";
  if (quality >= 50) return "Good";
  return "Maximum compression";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}