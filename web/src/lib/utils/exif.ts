export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Reads the EXIF orientation tag (0x0112) from a JPEG file; null when absent. */
export function readExifOrientation(file: File): Promise<ExifOrientation | null> {
  return new Promise((resolve) => {
    if (file.type !== "image/jpeg") {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(parseExifOrientation(new Uint8Array(reader.result as ArrayBuffer)));
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

export function parseExifOrientation(bytes: Uint8Array): ExifOrientation | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const len = bytes.length;
  let offset = 2;
  while (offset + 4 <= len) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    // Skip standalone / non-segment markers.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && segLen >= 14) {
      // APP1: "Exif\0\0"
      if (bytes[offset + 4] === 0x45 && bytes[offset + 5] === 0x78 && bytes[offset + 6] === 0x69 && bytes[offset + 7] === 0x66 && bytes[offset + 8] === 0 && bytes[offset + 9] === 0) {
        return parseTiffOrientation(bytes, offset + 10, offset + 2 + segLen);
      }
    }
    offset += 2 + segLen;
  }
  return null;
}

function parseTiffOrientation(bytes: Uint8Array, start: number, end: number): ExifOrientation | null {
  if (start + 8 > end) return null;
  const little = bytes[start] === 0x49 && bytes[start + 1] === 0x49;
  const big = bytes[start] === 0x4d && bytes[start + 1] === 0x4d;
  if (!little && !big) return null;

  const u16 = (o: number) => {
    const a = bytes[o];
    const b = bytes[o + 1];
    return little ? a | (b << 8) : (a << 8) | b;
  };
  const u32 = (o: number) => (little ? u16(o) | (u16(o + 2) << 16) : (u16(o) << 16) | u16(o + 2));

  if (u16(start + 2) !== 0x2a) return null;
  const ifd0 = start + u32(start + 4);
  if (ifd0 + 2 > end) return null;

  const count = u16(ifd0);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > end) return null;
    const tag = u16(entry);
    if (tag !== 0x0112) continue;
    const type = u16(entry + 2);
    if (type !== 3) return null; // SHORT
    const value = u16(entry + 8);
    return value >= 1 && value <= 8 ? (value as ExifOrientation) : null;
  }
  return null;
}

/**
 * Draws an image onto a canvas honoring its EXIF orientation, and resizes the
 * canvas to the oriented dimensions. Returns the oriented size.
 */
export function drawWithExifOrientation(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  orientation: ExifOrientation | null
): { width: number; height: number } {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const rotated = orientation === 5 || orientation === 6 || orientation === 7 || orientation === 8;
  canvas.width = rotated ? h : w;
  canvas.height = rotated ? w : h;
  ctx.save();
  switch (orientation ?? 1) {
    case 1:
    default:
      ctx.drawImage(img, 0, 0);
      break;
    case 2:
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      break;
    case 3:
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, 0, 0);
      break;
    case 4:
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0);
      break;
    case 5:
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
    case 6:
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
    case 7:
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
    case 8:
      ctx.translate(0, canvas.height);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, 0, 0);
      break;
  }
  ctx.restore();
  return { width: canvas.width, height: canvas.height };
}