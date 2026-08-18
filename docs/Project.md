# Build a Professional All-in-One Image Optimizer & Image Tools Website

You are a senior full-stack engineer, UI/UX designer, performance engineer, and image-processing specialist.

Build a production-quality web application called **ImageTools** — an all-in-one image optimization, compression, resizing, conversion, background-removal, and image-editing platform.

The application should feel like a polished commercial product, not a basic developer demo.

The primary goal is:

> Users should be able to upload an image, optimize/edit it, preview the result, compare before/after quality and file size, and download the processed image quickly.

---

# 1. CORE PRODUCT VISION

Create a website containing multiple professional image utilities under one unified interface.

The main tools should include:

1. Image Optimizer
2. Image Compressor
3. Image Resizer
4. Image Cropper
5. Image Converter
6. Background Remover / Transparent Image Maker
7. JPG → PNG
8. PNG → JPG
9. WEBP Converter
10. AVIF Converter
11. Image Quality Adjuster
12. Image Metadata Remover
13. Image Rotator
14. Image Flipper
15. Image Watermark Tool
16. Batch Image Processor
17. Image Preview / Before & After Comparison

Design the architecture so additional image tools can easily be added later.

---

# 2. IMPORTANT PRIVACY REQUIREMENT

The application should be **local-first whenever technically possible**.

For normal image processing:

* Process images inside the user's browser.
* Do not upload images to a server unnecessarily.
* Do not permanently store user images.
* Do not create accounts just to use basic tools.
* Do not send private images to third-party services unless a feature explicitly requires it.
* Clearly tell users when processing happens locally.
* Automatically release browser memory after processing.

For example:

> "Your images are processed locally in your browser. Your files are not uploaded to our servers."

This should be visible somewhere appropriate in the UI.

For background removal, if a local/browser model can provide acceptable results, prefer that approach.

If an external AI/background-removal API is required, isolate it behind a provider abstraction so it can be replaced later.

---

# 3. TECH STACK

Use a modern production-ready stack.

Preferred:

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui
* Web Workers for heavy image processing
* Canvas API / OffscreenCanvas
* browser-image-compression or equivalent where appropriate
* WebCodecs where useful
* WASM-based image processing where beneficial
* Sharp on the server only when server-side processing is actually required
* Zustand or another lightweight state manager
* Zod for validation

Use the latest stable versions available in the existing environment.

Before installing dependencies:

1. Inspect the existing project.
2. Understand the current architecture.
3. Reuse useful existing components.
4. Do not unnecessarily rewrite working code.
5. Keep the project maintainable.

---

# 4. RESPONSIVE DESIGN

The website must work perfectly on:

* Desktop
* Laptop
* Tablet
* Mobile

Desktop should provide the best workflow, but mobile must remain fully usable.

Do not simply shrink the desktop interface.

Create proper responsive layouts.

---

# 5. VISUAL DESIGN

The design should feel similar to a modern SaaS productivity tool.

Style direction:

* Clean
* Minimal
* Premium
* Modern
* Fast
* Professional
* Excellent typography
* Subtle animations
* Strong visual hierarchy
* Spacious layouts
* Rounded cards
* Clear buttons
* Drag-and-drop interfaces

Avoid:

* Excessive gradients
* Overly colorful UI
* Clutter
* Huge unnecessary illustrations
* Excessive animations
* Fake statistics
* Generic template appearance

Use a consistent design system.

Support:

* Light mode
* Dark mode
* System theme

---

# 6. MAIN WEBSITE STRUCTURE

Create:

/
/optimizer
/compressor
/resizer
/cropper
/converter
/background-remover
/transparent-image
/watermark
/metadata-remover
/batch
/tools

Also create:

/about
/privacy
/terms
/contact

Each tool should have a dedicated SEO-friendly page.

---

# 7. HOMEPAGE

The homepage should immediately communicate what the application does.

Hero section:

Title:

"Powerful Image Tools. Simple. Fast. Private."

Subtitle explaining:

Optimize, compress, resize, convert, crop and remove backgrounds from images directly in your browser.

Primary CTA:

"Upload Image"

Secondary CTA:

"Explore Tools"

Add a large drag-and-drop upload area.

Example:

---

```
 Drop your images here

 or

 [ Browse Files ]

 JPG • PNG • WEBP • AVIF
 Up to X MB
```

---

Below the hero:

"Everything You Need for Image Optimization"

Show tool cards.

Each card should contain:

* Icon
* Tool name
* Short description
* "Open Tool"

Example:

Image Compressor
Reduce image file size while preserving visual quality.

Image Resizer
Resize images to exact dimensions.

Background Remover
Create transparent PNG images automatically.

Image Converter
Convert between JPG, PNG, WEBP and AVIF.

---

# 8. UNIVERSAL IMAGE UPLOADER

Create a reusable ImageUploader component.

It should support:

* Drag & drop
* File picker
* Multiple files
* Clipboard paste where supported
* Mobile file picker
* File type validation
* File size validation
* Upload progress UI
* Duplicate detection
* Error handling

Accepted formats:

* JPG/JPEG
* PNG
* WEBP
* GIF
* BMP
* TIFF where supported
* AVIF where supported

Show uploaded files as cards.

Each card should display:

* Thumbnail
* File name
* Original dimensions
* Original file size
* Format
* Remove button

---

# 9. IMAGE OPTIMIZER

This should be the flagship feature.

Users should be able to upload one or multiple images.

Provide controls:

### Format

* Auto
* JPG
* PNG
* WEBP
* AVIF

### Quality

Slider:

0–100

Presets:

* Maximum compression
* Balanced
* High quality
* Lossless where applicable

### Resize

Optional:

* Width
* Height
* Percentage
* Lock aspect ratio

### Advanced

Allow:

* Strip metadata
* Progressive JPEG
* WebP quality
* AVIF quality
* Chroma subsampling where supported
* Sharpen after resize
* Preserve transparency

Do not expose complicated controls by default.

Put advanced controls inside:

"Advanced Settings"

---

# 10. BEFORE / AFTER COMPARISON

This is extremely important.

After processing, show:

LEFT:

Original image

RIGHT:

Optimized image

Provide a draggable comparison slider.

Also display:

Original:
2.8 MB
1920 × 1080
JPEG

Optimized:
742 KB
1600 × 900
WEBP

Savings:
73.5%

Show:

* Original size
* New size
* Saved size
* Percentage reduction
* Original dimensions
* New dimensions
* Output format

Use a visual savings indicator.

Example:

"73% smaller"

---

# 11. IMAGE COMPRESSOR

Create a dedicated compression tool.

Workflow:

1. Upload
2. Choose compression level
3. Preview
4. Compare
5. Download

Compression modes:

### Maximum

Smallest possible file.

### Balanced

Recommended setting.

### Quality

Prioritize visual quality.

Allow users to manually control quality.

Show estimated output size when possible.

---

# 12. IMAGE RESIZER

Create a professional image resizing interface.

Controls:

Width
Height

Units:

* Pixels
* Percentage

Aspect ratio:

[✓] Lock aspect ratio

Preset sizes:

* Instagram Post
* Instagram Story
* Facebook Post
* Facebook Cover
* YouTube Thumbnail
* YouTube Banner
* X/Twitter Post
* LinkedIn Post
* Custom

Also provide:

"Resize by percentage"

Example:

25%
50%
75%
100%
150%
200%

Allow batch resizing.

---

# 13. IMAGE CROPPER

Create a crop editor.

Features:

* Free crop
* Fixed aspect ratio
* 1:1
* 4:3
* 16:9
* 3:2
* 9:16
* Custom

Controls:

* Zoom
* Rotate
* Flip
* Reset

Use a smooth interactive crop UI.

---

# 14. BACKGROUND REMOVER

Create a dedicated AI-powered background removal tool.

Workflow:

1. Upload image.
2. Analyze image.
3. Remove background.
4. Display transparent result.
5. Allow editing.
6. Download.

Output:

PNG with transparency.

Provide background options:

* Transparent
* White
* Black
* Custom color
* Gradient
* Custom image background

Also provide a simple background editor.

---

# 15. TRANSPARENT IMAGE MAKER

Create a dedicated tool for creating transparent images.

Users should be able to:

* Remove background
* Remove a selected color
* Make white background transparent
* Make a custom color transparent
* Adjust tolerance
* Adjust edge smoothing

Example:

Color:

#FFFFFF

Tolerance:

0–100

Edge smoothing:

0–100

Preview transparency using a checkerboard background.

---

# 16. COLOR-TO-TRANSPARENT

Implement a color picker.

User chooses:

"Make this color transparent"

Allow:

* Eyedropper
* Color picker
* Tolerance slider
* Edge softness

Show real-time preview.

---

# 17. IMAGE CONVERTER

Create a universal converter.

Supported output:

* JPG
* PNG
* WEBP
* AVIF

If technically feasible:

* GIF
* BMP
* TIFF

Provide format-specific options.

For JPG:

Quality

For PNG:

Compression

For WEBP:

Quality

For AVIF:

Quality

Always warn users when converting transparent PNG → JPG:

"JPG does not support transparency. Transparent areas will use the selected background color."

---

# 18. BATCH PROCESSING

This is a major feature.

Users should be able to upload:

10
20
50
100+

images depending on browser/device limitations.

Batch controls should apply globally.

Example:

Resize all to:
1200px

Format:
WEBP

Quality:
82

Then process all images.

Display:

Processing 14 / 50

Each item:

✓ Completed
Processing
Waiting
Failed

Provide:

"Download All"

For multiple files, generate a ZIP archive in the browser.

Do not upload the files to a server just to create the ZIP.

---

# 19. WATERMARK TOOL

Allow users to add:

* Text watermark
* Image/logo watermark

Controls:

* Position
* Opacity
* Size
* Rotation
* Color
* Font
* Margin

Positions:

* Top left
* Top center
* Top right
* Center
* Bottom left
* Bottom center
* Bottom right

Support tiled watermark mode if feasible.

---

# 20. METADATA REMOVER

Create a privacy-focused metadata cleaner.

Remove:

* EXIF
* GPS location
* Camera information
* Software information
* Creation metadata where possible

Show:

"Metadata detected"

and:

"Metadata removed"

Important:

Do not claim complete metadata removal unless the implementation actually guarantees it for that format.

---

# 21. ROTATE & FLIP

Provide:

Rotate:

90° left
90° right
180°

Flip:

Horizontal
Vertical

Allow these operations inside the main editor as well.

---

# 22. IMAGE EDITOR

Create a lightweight image editor rather than attempting to compete with Photoshop.

Tools:

* Crop
* Resize
* Rotate
* Flip
* Brightness
* Contrast
* Saturation
* Blur
* Sharpen
* Grayscale
* Exposure
* Opacity

Use non-destructive state where possible.

Provide:

Undo
Redo
Reset

---

# 23. DOWNLOAD SYSTEM

After processing:

Show:

[ Download ]

[ Download All ]

For individual images:

Download the exact output format.

For batch:

Create a ZIP file.

Filename example:

original-image-optimized.webp

Do not overwrite the original file.

Allow filename editing before download.

---

# 24. PROCESSING ARCHITECTURE

Do not perform heavy processing directly on the main UI thread.

Use:

Web Workers

and where appropriate:

OffscreenCanvas

The UI must remain responsive during processing.

Architecture example:

UI
↓
Image Processing Manager
↓
Worker
↓
Image Processor
↓
Output Blob
↓
Preview
↓
Download

Create reusable processing functions.

For example:

processImage()
resizeImage()
compressImage()
convertImage()
removeMetadata()
cropImage()
rotateImage()
removeBackground()

---

# 25. MEMORY MANAGEMENT

Image processing can consume significant memory.

Implement proper cleanup.

After processing:

* Revoke object URLs
* Release canvas references
* Clear worker resources where appropriate
* Avoid unnecessary image copies
* Avoid loading full-resolution images repeatedly
* Use thumbnails for previews where possible

For very large images, protect the browser from crashes.

If an image exceeds a safe dimension or file size:

show:

"This image is very large and may require significant memory."

Offer an optimized workflow.

---

# 26. ERROR HANDLING

Every operation must have meaningful error states.

Examples:

Unsupported format

"Sorry, this image format is not supported by your browser."

Too large

"This image is too large to process safely in your browser."

Processing failed

"We couldn't process this image. Please try another file."

Never expose raw JavaScript errors to users.

---

# 27. PROGRESS UI

For long-running operations show progress.

Example:

Preparing image
██████░░░░ 60%

Or:

Processing 37 / 100

Do not fake progress.

Progress should reflect actual processing stages whenever possible.

---

# 28. MOBILE EXPERIENCE

On mobile:

* Upload button should be prominent.
* Drag/drop should not be required.
* Controls should become bottom sheets or stacked panels.
* Before/after comparison should remain usable.
* Download buttons should be easy to tap.
* Avoid tiny sliders.
* Use touch-friendly controls.

---

# 29. ACCESSIBILITY

Implement proper:

* Semantic HTML
* Keyboard navigation
* Focus states
* ARIA labels
* Screen-reader descriptions
* Accessible contrast
* Reduced-motion support

All interactive elements must be keyboard accessible.

---

# 30. SEO

Each tool page needs:

Unique:

* title
* meta description
* canonical URL
* Open Graph metadata
* Twitter/X metadata

Example:

"Free Image Compressor — Compress JPG, PNG & WebP Online"

Create useful content below each tool explaining:

* What the tool does
* How to use it
* Supported formats
* Privacy
* Frequently asked questions

Do not create keyword-stuffed content.

---

# 31. TOOL DISCOVERY

Create a Tools page.

Display all tools in categories:

### Optimize

* Image Compressor
* Image Optimizer
* Image Resizer

### Edit

* Crop Image
* Rotate Image
* Flip Image
* Watermark

### Convert

* JPG Converter
* PNG Converter
* WEBP Converter
* AVIF Converter

### Background

* Background Remover
* Transparent Image Maker
* Color to Transparent

### Privacy

* Metadata Remover

### Batch

* Batch Image Processor

---

# 32. NAVIGATION

Header:

Logo

Tools

Image Optimizer

Compressor

Resizer

Converter

Background Remover

Batch Tools

Theme Toggle

Use a responsive mobile navigation menu.

Keep the header clean.

---

# 33. TOOL PAGE LAYOUT

Every tool should follow a consistent layout.

Example:

---

Breadcrumb
Image Compressor

Compress your images without losing noticeable quality.

[ Upload Images ]

---

After upload:

---

Original Preview
Processed Preview

Controls
Quality ━━━━━━━ 82

Format: WEBP

## [ Optimize Image ]

Result:

73% smaller

[ Download ]

---

Below:

How it works
Features
Supported formats
FAQ
---

---

# 34. DRAG AND DROP EXPERIENCE

When the user drags an image over the application:

Change the upload zone visually.

Show:

"Drop your image here"

After dropping:

Immediately display the file.

Do not require an unnecessary confirmation step.

---

# 35. IMAGE QUALITY PREVIEW

Quality settings should provide visual feedback.

When changing compression quality:

Update preview when practical.

Do not process a huge image on every slider movement.

Use a debounced preview.

For very large images:

Use a downscaled preview while adjusting settings.

Perform final processing at full resolution when downloading.

---

# 36. SECURITY

Validate:

* File extension
* MIME type
* Actual image decoding
* File size
* Image dimensions

Do not trust file names.

Prevent malicious files from being processed blindly.

If server-side processing exists:

* Validate uploads
* Limit payload size
* Sanitize filenames
* Never execute uploaded files
* Never store files longer than necessary
* Add rate limiting

---

# 37. NO UNNECESSARY AUTHENTICATION

Basic image processing should work without login.

Users should be able to:

Upload → Process → Download

without creating an account.

If authentication is added later, keep it optional.

---

# 38. OPTIONAL USER HISTORY

Do NOT create server-side image history by default.

If a history feature is added:

Use localStorage or IndexedDB for lightweight metadata.

Never store sensitive images remotely without explicit user consent.

---

# 39. PERFORMANCE

The application should load quickly.

Optimize:

* JavaScript bundles
* Images
* Fonts
* CSS
* Components

Lazy-load heavy image-processing libraries.

Do not load background-removal models until the user actually opens that feature.

Use dynamic imports.

---

# 40. COMPONENT ARCHITECTURE

Create reusable components such as:

components/
image/
ImageUploader
ImagePreview
ImageComparison
ImageCard
ImageGrid
ImageDropzone
ImageEditor
ImageCropper

processing/
ProcessingProgress
ProcessingQueue
ProcessingSettings
QualitySlider
FormatSelector
ResizeControls

download/
DownloadButton
DownloadAllButton
ZipDownloader

layout/
Header
Footer
ToolLayout
ToolCard

ui/
Button
Slider
Dialog
Tabs
Tooltip
Toast

Avoid duplicating image-processing logic across pages.

---

# 41. PROCESSING ENGINE

Create a centralized processing engine.

Example conceptual interface:

ImageProcessor

Methods:

optimize()
compress()
resize()
crop()
convert()
rotate()
flip()
watermark()
removeMetadata()
removeColor()
applyFilters()

Each operation should accept:

Input image
Processing options

and return:

Processed Blob
Metadata
Dimensions
Format
File size

Keep the engine independent from the UI.

---

# 42. TYPESCRIPT TYPES

Create strict types.

For example:

ImageFormat

ProcessingOptions

ResizeOptions

CompressionOptions

CropOptions

WatermarkOptions

ProcessingResult

ImageMetadata

Do not use `any` unless absolutely necessary.

---

# 43. STATE MANAGEMENT

Create centralized state for:

* Uploaded images
* Selected image
* Processing queue
* Processing settings
* Processing results
* Editor history
* Download state

Avoid prop drilling.

Keep state modular.

---

# 44. PERSISTENCE

User preferences can optionally be stored locally.

Examples:

* Dark mode
* Last selected format
* Last quality
* Last resize setting

Do not persist actual images unless explicitly required.

---

# 45. TESTING

Create tests for:

* Image validation
* Resize calculations
* Aspect ratio calculations
* Compression options
* Format conversion
* Filename generation
* Percentage savings
* Batch processing
* Metadata handling

Test edge cases:

* Very small image
* Very large image
* Transparent PNG
* Animated image
* Unsupported format
* Corrupted file
* Extremely wide image
* Extremely tall image

---

# 46. BROWSER COMPATIBILITY

Test modern:

* Chrome
* Edge
* Firefox
* Safari

Gracefully handle browser-specific limitations.

For unsupported browser features:

Show a helpful fallback.

---

# 47. ANALYTICS

Do not track uploaded image contents.

If analytics are added, track only anonymous product events such as:

* Tool opened
* Processing completed
* Download clicked

Do not collect image data.

---

# 48. ADS / MONETIZATION ARCHITECTURE

Do not clutter the initial UI with advertisements.

However, structure the layout so advertising can be added later without redesigning the application.

Potential future monetization:

* Free processing
* Premium batch limits
* Premium background removal
* API
* Developer plan

Do not implement fake payment functionality.

---

# 49. PWA

Make the website installable as a PWA if practical.

Users should be able to install it.

Where possible, allow basic image tools to work offline.

This is especially valuable because much of the processing should happen locally.

---

# 50. OFFLINE PROCESSING

Explore making these features fully offline-capable:

* Resize
* Crop
* Rotate
* Flip
* Compress
* JPG/PNG/WEBP conversion
* Metadata removal
* Basic editing

Background removal may require a model download and therefore should be handled separately.

---

# 51. LANDING PAGE TRUST ELEMENTS

Include a section:

"Your Images Stay Private"

Explain:

* Local processing
* No unnecessary uploads
* No permanent storage
* Fast processing
* Works directly in your browser

Do not make privacy claims that the implementation cannot guarantee.

---

# 52. FAQ

Create useful FAQs such as:

Is this image compressor free?

Are my images uploaded?

Does image compression reduce quality?

What image formats are supported?

Can I compress multiple images?

Can I resize images without losing quality?

Can I make JPG images transparent?

Why does JPG not support transparency?

What is WEBP?

What is AVIF?

How does background removal work?

---

# 53. EMPTY STATES

Design polished empty states.

Example:

"Drop an image here to get started"

with supported formats underneath.

Do not show empty tables or broken layouts.

---

# 54. PROCESSING QUEUE

For batch processing, create a proper queue.

Each image:

Filename
Thumbnail
Status
Progress
Original size
Output size
Savings

Example:

product-01.jpg
✓ Complete
2.4 MB → 680 KB
72% smaller

product-02.jpg
Processing...

product-03.jpg
Waiting

---

# 55. RESULT SCREEN

After processing an image:

Show a professional result card.

Example:

Optimization complete

Original
3.2 MB

Optimized
820 KB

Saved
2.38 MB

Reduction
74.4%

Dimensions
2400 × 1600 → 1600 × 1067

Format
JPG → WEBP

Buttons:

[ Download ]

[ Edit Again ]

[ Process Another ]

---

# 56. FILE NAMING

Implement safe filename generation.

Examples:

photo.jpg

→ photo-optimized.webp

photo.jpg

→ photo-resized-1200x800.jpg

photo.jpg

→ photo-transparent.png

Do not create duplicate extensions.

---

# 57. LARGE IMAGE HANDLING

Images can be extremely large.

Implement safeguards.

For example:

* Maximum file size
* Maximum decoded pixel count
* Memory-aware processing
* Progressive processing where possible

Do not let one image crash the entire page.

---

# 58. ARCHITECTURE QUALITY

Keep code:

* Modular
* Typed
* Testable
* Maintainable
* Documented

Do not put the entire application inside a single component.

Do not create enormous files containing thousands of lines.

Separate:

UI
Business logic
Image processing
Utilities
Types
Workers

---

# 59. DOCUMENTATION

Create:

README.md

Include:

* Project overview
* Tech stack
* Installation
* Development
* Production build
* Architecture
* Image-processing architecture
* Browser limitations
* Privacy model
* Environment variables
* Deployment instructions

Also create:

docs/architecture.md

docs/image-processing.md

docs/privacy.md

---

# 60. DEVELOPMENT PROCESS

Before coding:

1. Inspect the repository.
2. Understand existing files.
3. Identify current framework.
4. Identify existing dependencies.
5. Identify reusable components.
6. Identify conflicts.
7. Create an implementation plan.

Then implement in stages.

Do NOT attempt to generate the entire application blindly in one huge file.

---

# 61. IMPLEMENTATION PHASES

### Phase 1

Build:

* Design system
* Header
* Footer
* Homepage
* Tool cards
* Universal uploader

### Phase 2

Implement:

* Image compression
* Image optimization
* Resize
* Before/after comparison
* Download

### Phase 3

Implement:

* Crop
* Rotate
* Flip
* Format conversion

### Phase 4

Implement:

* Transparent image
* Color-to-transparent
* Background removal

### Phase 5

Implement:

* Watermark
* Metadata removal
* Basic editor

### Phase 6

Implement:

* Batch processing
* ZIP downloads
* Processing queue

### Phase 7

Implement:

* PWA
* Offline functionality
* SEO
* Accessibility
* Performance optimization

### Phase 8

Testing and production hardening.

---

# 62. IMPORTANT UX RULE

Never make the user navigate through unnecessary pages.

For most tools:

Upload → Configure → Process → Compare → Download

should happen on one page.

---

# 63. DO NOT BUILD FAKE FEATURES

This is extremely important.

Do not create buttons that only display:

"Coming soon"

for features that are supposed to be implemented.

If a feature cannot technically be implemented with the selected architecture:

1. Explain why.
2. Choose a technically appropriate implementation.
3. Implement the working alternative.

Every visible button should perform a real action.

---

# 64. FINAL QUALITY CHECK

Before considering the project complete, test:

### Upload

* Single image
* Multiple images
* Drag/drop
* Invalid files

### Optimization

* JPG
* PNG
* WEBP
* Transparent PNG

### Resize

* Locked ratio
* Custom dimensions
* Percentage

### Conversion

* JPG → PNG
* PNG → JPG
* PNG → WEBP
* JPG → WEBP
* WEBP → JPG

### Transparency

* Background removal
* Color removal
* Transparent preview

### Batch

* 10 images
* 50 images
* Different formats

### Download

* Individual
* ZIP

### Responsive

* Desktop
* Tablet
* Mobile

### Performance

* Large images
* Multiple images
* Long processing jobs

---

# 65. FINAL REQUIREMENT

The finished application should feel like a real product that users could confidently use every day.

The most important qualities are:

1. Excellent UX
2. Fast processing
3. Privacy-first architecture
4. High-quality output
5. Professional design
6. Responsive interface
7. Reliable batch processing
8. Clean architecture
9. Strong accessibility
10. Excellent performance

Do not stop after creating the UI.

Actually implement the image-processing functionality.

After implementation:

* Run the application.
* Test every tool.
* Fix TypeScript errors.
* Fix runtime errors.
* Fix console errors.
* Test responsive layouts.
* Test real image files.
* Test large images.
* Verify downloads.
* Verify transparency.
* Verify compression statistics.
* Verify batch ZIP generation.
* Verify that processing does not freeze the UI.

At the end, provide a concise implementation summary including:

* What was built
* Files/components created
* Dependencies added
* Image-processing approach
* Browser limitations
* How to run the project
* What was tested

Do not claim a feature is complete unless it actually works.
