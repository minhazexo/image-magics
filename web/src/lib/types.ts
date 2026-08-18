export type ImageFormat = "jpeg" | "png" | "webp" | "avif" | "gif" | "bmp" | "tiff";

export type OutputFormat = Exclude<ImageFormat, "gif" | "tiff">;

export type ResizeMode = "pixels" | "percent";

export type FitMode = "fill" | "contain" | "cover";

export interface ResizeOptions {
  width?: number;
  height?: number;
  percent?: number;
  mode?: ResizeMode;
  fit?: FitMode;
  lockAspectRatio?: boolean;
  sharpen?: boolean;
}

export interface CompressionOptions {
  quality: number; // 0-100
  format: OutputFormat;
  progressive?: boolean;
  chromaSubsampling?: boolean;
  preserveTransparency?: boolean;
}

export interface OptimizeOptions extends CompressionOptions {
  resizing?: ResizeOptions | null;
  stripMetadata?: boolean;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface WatermarkPosition {
  horizontal: "left" | "center" | "right";
  vertical: "top" | "center" | "bottom";
}

export interface TextWatermarkOptions {
  kind: "text";
  text: string;
  position: WatermarkPosition;
  opacity: number; // 0-1
  size: number; // px relative to image
  rotation: number; // degrees
  color: string;
  font: string;
  margin: number; // px relative to image
  tiled?: boolean;
  scale: number; // 0-1 fraction of image width
}

export interface ImageWatermarkOptions {
  kind: "image";
  dataUrl: string;
  position: WatermarkPosition;
  opacity: number;
  rotation: number;
  margin: number;
  tiled?: boolean;
  scale: number; // 0-1 fraction of image width
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

export interface FilterAdjustments {
  brightness: number; // -1..1
  contrast: number; // -1..1
  saturation: number; // -1..1
  blur: number; // 0..20 px
  sharpen: number; // 0..1
  grayscale: boolean;
  exposure: number; // -1..1
  opacity: number; // 0..1
}

export const DEFAULT_FILTERS: FilterAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sharpen: 0,
  grayscale: false,
  exposure: 0,
  opacity: 1,
};

export type ProcessingOperation =
  | { type: "optimize"; options: OptimizeOptions }
  | { type: "resize"; options: ResizeOptions }
  | { type: "crop"; options: CropOptions }
  | { type: "convert"; options: CompressionOptions }
  | { type: "rotate"; angle: number }
  | { type: "flip"; direction: "horizontal" | "vertical" }
  | { type: "watermark"; options: WatermarkOptions }
  | { type: "removeMetadata" }
  | { type: "removeColor"; options: RemoveColorOptions }
  | { type: "removeBackground"; options: RemoveBackgroundOptions }
  | { type: "applyFilters"; options: FilterAdjustments };

export interface RemoveColorOptions {
  color: { r: number; g: number; b: number };
  tolerance: number; // 0-100
  edgeSmoothing: number; // 0-100
}

export interface RemoveBackgroundOptions {
  tolerance?: number;
  // Border-based matting strategy settings
  method?: "borders" | "color";
  color?: { r: number; g: number; b: number };
}

export type BackgroundReplacement =
  | { type: "transparent" }
  | { type: "white" }
  | { type: "black" }
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string }
  | { type: "image"; dataUrl: string };

export interface ImageMetadataInfo {
  width: number;
  height: number;
  format: ImageFormat | "unknown";
  fileSize: number;
  hasAlpha: boolean;
  hasExif: boolean;
}

export interface ProcessingResult {
  blob: Blob;
  url: string;
  format: OutputFormat | "png";
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  originalSize: number;
  savedBytes: number;
  savingsPercent: number;
  fileName: string;
  durationMs: number;
}

export interface QueueItemMeta {
  id: string;
  file: File;
  thumbUrl: string;
  originalSize: number;
  status: "waiting" | "processing" | "completed" | "failed";
  progress: number;
  result?: ProcessingResult;
  error?: string;
}

export interface UploadedImage {
  id: string;
  file: File;
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
  lastModified: number;
  format: string;
  valid: boolean;
  error?: string;
}

export interface FormatOption {
  value: OutputFormat;
  label: string;
  extension: string;
  mime: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: "jpeg", label: "JPG", extension: "jpg", mime: "image/jpeg" },
  { value: "png", label: "PNG", extension: "png", mime: "image/png" },
  { value: "webp", label: "WEBP", extension: "webp", mime: "image/webp" },
  { value: "avif", label: "AVIF", extension: "avif", mime: "image/avif" },
];

export const SUPPORTED_INPUT_FORMATS = ["jpeg", "png", "webp", "gif", "bmp", "avif"] as const;

export interface SavedPreference {
  format?: OutputFormat;
  quality?: number;
  theme?: "light" | "dark" | "system";
}