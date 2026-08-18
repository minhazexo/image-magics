# Transparent Image Tool — Practical Implementation Guide

## Goal

Fix `/transparent-image` so it creates **real transparency**, not a white/gray/checkerboard background.

The final image must contain a real **alpha channel**:

- `0` = fully transparent
- `255` = fully opaque
- values between = semi-transparent edges

Use **PNG** as the default output because JPEG does not support transparency.

---

## 1. Recommended Architecture

```text
Frontend
  ↓
Upload image
  ↓
POST /api/transparent-image
  ↓
Backend
  ↓
AI background removal / mask generation
  ↓
Mask refinement
  ↓
Alpha channel
  ↓
PNG
  ↓
Return/download result
```

Do not rely on CSS `opacity` or a checkerboard background.

The checkerboard should only be used for the preview.

---

## 2. Best Practical AI Solution

Use `rembg` for automatic background removal.

Official project:

https://github.com/danielgatis/rembg

Recommended flow:

```text
Input image
   ↓
rembg
   ↓
Foreground mask
   ↓
Alpha matting (for difficult edges)
   ↓
RGBA image
   ↓
PNG
```

This works much better than simply making white pixels transparent.

---

## 3. Important Difference

### Wrong

```text
JPG
 ↓
add alpha channel
 ↓
PNG
```

This does NOT remove the background.

### Correct

```text
JPG
 ↓
detect foreground
 ↓
create mask
 ↓
mask → alpha
 ↓
RGBA
 ↓
PNG
```

---

## 4. Output Requirements

Every successful result must:

```text
format = PNG
hasAlpha = true
alpha channel exists
transparent pixels exist when background was removed
```

Before download, verify the output.

If every pixel has:

```text
alpha = 255
```

then the image is completely opaque and the transparency operation failed.

---

## 5. Backend API

Create:

```text
POST /api/transparent-image
```

Use:

```text
multipart/form-data
```

Fields:

```text
image
mode
alphaMatting
edgeRefinement
feather
trimTransparent
outputFormat
```

Example:

```text
mode=auto
alphaMatting=true
edgeRefinement=true
feather=1
trimTransparent=false
outputFormat=png
```

Response:

```json
{
  "success": true,
  "format": "png",
  "hasAlpha": true,
  "url": "/api/download/abc123"
}
```

---

## 6. Node.js / Sharp

If the project uses Node.js, use `sharp` for image processing/encoding.

https://sharp.pixelplumbing.com/

Example:

```js
const output = await sharp(input)
  .ensureAlpha()
  .png()
  .toBuffer();
```

**Important:** `ensureAlpha()` only creates an alpha channel. It does NOT remove the background.

You must first generate a mask using AI or another method.

---

## 7. Alpha Mask

The AI should generate a mask:

```text
Black  → background
White  → foreground
Gray   → semi-transparent edge
```

Then:

```text
Original RGB
      +
Alpha mask
      ↓
Final RGBA
```

Keep the original RGB colors of the foreground.

---

## 8. Alpha Matting

Enable alpha matting for:

- hair
- fur
- leaves
- glass
- thin objects
- difficult edges

It helps reduce ugly edges and halos.

Recommended default:

```text
Alpha Matting: ON / Auto
Edge Refinement: ON
Feather: 1–2px
```

Do not heavily blur the entire image.

---

## 9. Prevent White Halos

A common problem:

```text
white background
      ↓
remove background
      ↓
white outline remains around object
```

Use:

```text
AI mask
 ↓
mask refinement
 ↓
alpha matting
 ↓
edge cleanup
```

Do not simply make white pixels transparent because this can destroy:

- white products
- white clothing
- highlights
- paper
- logos
- teeth

---

## 10. Transparent Preview

Use a CSS checkerboard only for preview.

```text
Checkerboard = UI background
Alpha = actual image transparency
```

Never export the checkerboard as part of the image.

The user should be able to preview against:

```text
Checkerboard
White
Black
Custom color
```

This makes halos easy to detect.

---

## 11. Add 3 Modes

### Auto

AI removes the background.

```text
Upload → AI → Transparent PNG
```

### Color

Make a selected color transparent.

Controls:

```text
Color picker
Tolerance
Feather
```

Do NOT use exact RGB matching only.

Bad:

```js
if (r === 255 && g === 255 && b === 255)
```

Use a color-distance/tolerance calculation instead.

### Manual

Allow the user to edit the mask:

```text
Erase
Restore
Brush size
Undo
Redo
Zoom
```

The brush should edit the **alpha mask**, not paint the image.

---

## 12. Recommended UI

```text
Make Image Transparent

[ Upload Image ]

Mode:
[ Auto ] [ Color ] [ Manual ]

Options:
Alpha Matting     [ON]
Edge Refinement   [ON]
Feather           [2px]
Trim Borders      [OFF]

[ Before / After Preview ]

Background:
[ Checkerboard ] [ White ] [ Black ]

[ Download PNG ]
```

Keep advanced options inside an "Advanced" section.

The default experience should be:

```text
Upload → Process → Download
```

---

## 13. Preserve Existing PNG Transparency

If the uploaded image already has transparency:

```text
PNG + alpha
   ↓
preserve existing alpha
```

Do not destroy it.

---

## 14. EXIF Orientation

Before processing phone photos:

```text
Read EXIF
 ↓
Apply orientation
 ↓
Process
 ↓
Export
```

Otherwise some phone images can appear rotated.

---

## 15. Large Image Safety

Set limits:

```env
MAX_IMAGE_SIZE_MB=25
MAX_IMAGE_PIXELS=40000000
```

Also validate:

- actual MIME type
- file size
- dimensions
- image decoding
- processing timeout

Never trust the uploaded filename alone.

---

## 16. Batch Support

Your existing `/batch` tool can reuse the same API.

```text
50 images
 ↓
process individually
 ↓
transparent PNGs
 ↓
ZIP
```

Show:

```text
Processed: 35/50
Failed: 1
Remaining: 14
```

Do not load all large images into memory at once.

---

## 17. Quality Test

Test at least:

```text
✓ Product on white background
✓ Product on dark background
✓ Person with hair
✓ Dog/cat fur
✓ White clothing
✓ Glass
✓ Jewelry
✓ Logo
✓ PNG with existing transparency
✓ Complex background
✓ Multiple objects
✓ Very large image
```

Especially verify that white objects are not removed from white backgrounds.

---

## 18. Definition of Done

The tool is working correctly when:

- [ ] JPG can become a genuinely transparent PNG
- [ ] Background is actually removed
- [ ] PNG has a real alpha channel
- [ ] Checkerboard is preview-only
- [ ] Foreground colors remain unchanged
- [ ] Semi-transparent edges work
- [ ] Hair/fur edges are reasonably clean
- [ ] White halos are minimized
- [ ] Existing PNG alpha is preserved
- [ ] White objects are not accidentally removed
- [ ] EXIF orientation is handled
- [ ] Large images are safely limited
- [ ] Output is verified before download
- [ ] Result works on both white and dark backgrounds

---

## 19. Recommended Defaults

```text
Mode: Auto
AI Background Removal: ON
Alpha Matting: Auto
Edge Refinement: ON
Feather: 1–2px
Output: PNG
Trim Transparent Borders: OFF
Preserve Original Dimensions: ON
```

The most important rule:

```text
Transparency ≠ white background
Transparency ≠ checkerboard
Transparency ≠ CSS opacity

Transparency = real per-pixel alpha
```

### References

- rembg: https://github.com/danielgatis/rembg
- rembg usage: https://github.com/danielgatis/rembg/blob/main/USAGE.md
- Sharp: https://sharp.pixelplumbing.com/
- MDN Canvas compositing: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
