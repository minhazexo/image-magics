import {
  ArrowDownWideNarrow,
  Crop,
  ImageDown,
  ImagePlus,
  PaintBucket,
  RefreshCw,
  RotateCw,
  ScanEye,
  SlidersHorizontal,
  SquareDashed,
  Wand2,
  Images,
  Type,
  Scissors,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory = "Optimize" | "Edit" | "Convert" | "Background" | "Privacy" | "Batch";

export interface ToolDefinition {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
}

export const TOOLS: ToolDefinition[] = [
  {
    slug: "optimizer",
    name: "Image Optimizer",
    shortDescription: "Optimize images for the web with full control over format, quality and size.",
    description: "Compress, resize and convert your images in one pass while preserving quality.",
    category: "Optimize",
    icon: ImageDown,
    keywords: ["optimize", "compress", "webp"],
  },
  {
    slug: "compressor",
    name: "Image Compressor",
    shortDescription: "Reduce image file size while preserving visual quality.",
    description: "Compress JPG, PNG and WebP images with instant preview and before/after comparison.",
    category: "Optimize",
    icon: ArrowDownWideNarrow,
    keywords: ["compress", "reduce size", "jpg"],
  },
  {
    slug: "resizer",
    name: "Image Resizer",
    shortDescription: "Resize images to exact dimensions or by percentage.",
    description: "Resize single or multiple images to pixels, percentages or popular social media presets.",
    category: "Optimize",
    icon: Scissors,
    keywords: ["resize", "dimensions", "social media"],
  },
  {
    slug: "cropper",
    name: "Image Cropper",
    shortDescription: "Crop images to any ratio with an interactive editor.",
    description: "Free crop or fixed aspect ratios like 1:1, 16:9 and 4:3 with zoom, rotate and flip.",
    category: "Edit",
    icon: Crop,
    keywords: ["crop", "aspect ratio", "16:9"],
  },
  {
    slug: "rotator",
    name: "Image Rotator",
    shortDescription: "Rotate and flip images in one click.",
    description: "Rotate 90° left, 90° right or 180°, and flip horizontally or vertically.",
    category: "Edit",
    icon: RotateCw,
    keywords: ["rotate", "flip"],
  },
  {
    slug: "editor",
    name: "Image Editor",
    shortDescription: "Lightweight editor with filters, crop, rotate and more.",
    description: "Adjust brightness, contrast, saturation, blur, sharpen and more with undo/redo.",
    category: "Edit",
    icon: SlidersHorizontal,
    keywords: ["editor", "filters", "brightness", "contrast"],
  },
  {
    slug: "watermark",
    name: "Watermark Tool",
    shortDescription: "Add text or logo watermarks to protect your images.",
    description: "Add text or image watermarks with position, opacity, size, rotation and tiling.",
    category: "Edit",
    icon: Type,
    keywords: ["watermark", "logo", "protect"],
  },
  {
    slug: "converter",
    name: "Image Converter",
    shortDescription: "Convert between JPG, PNG and WEBP.",
    description: "Convert images to JPG, PNG and WebP with format-specific quality options.",
    category: "Convert",
    icon: RefreshCw,
    keywords: ["convert", "jpg", "png", "webp"],
  },
  {
    slug: "jpg-to-png",
    name: "JPG to PNG",
    shortDescription: "Convert JPG images to high-quality PNG.",
    description: "Lossless JPG to PNG conversion, perfect for editing and printing.",
    category: "Convert",
    icon: ImagePlus,
    keywords: ["jpg to png", "jpeg", "lossless"],
  },
  {
    slug: "png-to-jpg",
    name: "PNG to JPG",
    shortDescription: "Convert PNG images to JPG with a background color.",
    description: "Convert transparent PNGs to JPG with a configurable background color.",
    category: "Convert",
    icon: ImageDown,
    keywords: ["png to jpg", "background"],
  },
  {
    slug: "webp-converter",
    name: "WEBP Converter",
    shortDescription: "Convert any image to WEBP.",
    description: "Convert to WebP for dramatically smaller file sizes with high quality.",
    category: "Convert",
    icon: Wand2,
    keywords: ["webp", "convert"],
  },

  {
    slug: "transparent-image",
    name: "Transparent Image Maker",
    shortDescription: "Make backgrounds transparent in one click.",
    description: "Remove a color, make white backgrounds transparent, with tolerance and edge smoothing.",
    category: "Background",
    icon: PaintBucket,
    keywords: ["transparent", "remove color", "white background"],
  },
  {
    slug: "color-to-transparent",
    name: "Color to Transparent",
    shortDescription: "Make a specific color transparent.",
    description: "Pick any color with the eyedropper and remove it with fine tolerance control.",
    category: "Background",
    icon: Palette,
    keywords: ["color", "transparent", "eyedropper"],
  },
  {
    slug: "metadata-remover",
    name: "Metadata Remover",
    shortDescription: "Strip EXIF and GPS data from your photos.",
    description: "Remove EXIF, GPS location and camera information from your images for privacy.",
    category: "Privacy",
    icon: ScanEye,
    keywords: ["metadata", "exif", "gps", "privacy"],
  },
  {
    slug: "batch",
    name: "Batch Image Processor",
    shortDescription: "Resize, convert and compress many images at once.",
    description: "Process 10, 50 or 100+ images in parallel and download them as a ZIP archive.",
    category: "Batch",
    icon: Images,
    keywords: ["batch", "bulk", "zip", "multiple"],
  },
];

export function getTool(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const CATEGORY_ORDER: ToolCategory[] = ["Optimize", "Edit", "Convert", "Background", "Privacy", "Batch"];

export const HOMEPAGE_TOOLS = ["compressor", "resizer", "transparent-image", "converter", "optimizer", "batch"];

export function toolIcon(slug: string): LucideIcon {
  return getTool(slug)?.icon ?? SquareDashed;
}

export function categoryIcon(category: ToolCategory): LucideIcon {
  switch (category) {
    case "Optimize":
      return ImageDown;
    case "Edit":
      return SlidersHorizontal;
    case "Convert":
      return RefreshCw;
    case "Background":
      return PaintBucket;
    case "Privacy":
      return ScanEye;
    case "Batch":
      return Images;
  }
}