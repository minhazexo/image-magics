#!/usr/bin/env python3
"""
Demonstration of ImageMagics library capabilities.

This script shows how to use the core image processing functionality
implemented in the ImageMagics package.
"""

import numpy as np
import cv2
import sys
import os
from PIL import Image

# Add the src directory to the path so we can import image_magics
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from image_magics import Image, Filters, Transforms


def create_test_image():
    """Create a sample test image with text and shapes."""
    # Create a blank canvas
    img = np.zeros((300, 400, 3), dtype=np.uint8)

    # Fill with white background
    img[:] = 255

    # Add some colored shapes and text
    cv2.rectangle(img, (50, 50), (150, 150), (255, 0, 0), 2)
    cv2.circle(img, (250, 100), 50, (0, 255, 0), 2)
    cv2.line(img, (50, 200), (350, 200), (0, 0, 255), 3)

    # Add text
    cv2.putText(img, "ImageMagics Demo", (50, 260),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (128, 128, 128), 2)

    return img


def test_core_image_operations():
    """Test basic image operations from the Image class."""
    print("Testing core Image operations...")

    # Create and save a test image
    test_img_path = "test_demo.png"
    test_image = create_test_image()
    cv2.imwrite(test_img_path, test_image)

    # Load using ImageMagics
    img = Image.load(test_img_path)
    print(f"[OK] Image loaded successfully from {test_img_path}")

    # Test grayscale conversion
    grayscale_img = img.grayscale()
    grayscale_path = "test_grayscale.png"
    img.save(grayscale_path)
    print("[OK] Grayscale conversion completed")

    # Test contrast enhancement
    enhanced_img = img.enhance_contrast(1.5)
    enhanced_path = "test_enhanced.png"
    img.save(enhanced_path)
    print("[OK] Contrast enhancement completed")

    # Test resize
    resized_img = img.resize((200, 200))
    resized_path = "test_resized.png"
    img.save(resized_path)
    print("[OK] Resize operation completed")

    # Test rotation
    rotated_img = img.rotate(45)
    rotated_path = "test_rotated.png"
    img.save(rotated_path)
    print("[OK] Rotation completed")

    # Test flip
    flipped_img = img.flip('horizontal')
    flipped_path = "test_flipped.png"
    img.save(flipped_path)
    print("[OK] Flip operation completed")

    # Clean up test files
    for path in [
        test_img_path, grayscale_path, enhanced_path,
        resized_path, rotated_path, flipped_path
    ]:
        if os.path.exists(path):
            os.remove(path)

    print("[DONE] All core Image operations completed successfully!\n")


def test_channel_operations():
    """Test operations that involve channel manipulation."""
    print("Testing channel operations...")

    # Create test image
    test_img_path = "channel_test.png"
    test_image = create_test_image()
    cv2.imwrite(test_img_path, test_image)

    # Load and test Yuri operations
    from image_magics.core import Image

    img = Image.load(test_img_path)
    orig_shape = img.np_image.shape
    print(f"[OK] Original image shape: {orig_shape}")

    # Test brightness adjustment
    bright_img = Image.load(test_img_path)
    bright_img.adjust_brightness(30)
    print("[OK] Brightness adjustment completed")

    # Test saturation adjustment
    sat_img = Image.load(test_img_path)
    sat_img.adjust_saturation(25)
    print("[OK] Saturation adjustment completed")

    # Clean up
    if os.path.exists(test_img_path):
        os.remove(test_img_path)

    print("[DONE] Channel operations completed!\n")


def test_filters_and_transforms():
    """Test filter and transform operations."""
    print("Testing filters and transforms...")

    # Create test image
    test_img_path = "filter_test.png"
    test_image = create_test_image()
    cv2.imwrite(test_img_path, test_image)

    # Load using OpenCV format for filter operations
    img_cv = cv2.imread(test_img_path)

    # Test Gaussian blur
    blurred = Filters.gaussian_blur(img_cv, (5, 5))
    print("[OK] Gaussian blur completed")

    # Test edge detection
    edges = Filters.edge_detection(img_cv)
    print("[OK] Edge detection completed")

    # Test flip transform
    flipped_transform = Transforms.flip(img_cv, 'vertical')
    print("[OK] Transform flip completed")

    # Test resize transform
    resized_transform = Transforms.resize(img_cv, width=200)
    print("[OK] Transform resize completed")

    # Clean up
    os.remove(test_img_path)
    print("[DONE] Filter and transform operations completed!\n")


def demonstrate_api_usage():
    """Demonstrate how the main Image class is used in practice."""
    print("Demonstrating API usage patterns...")

    # Example 1: Basic workflow
    print("Example 1: Basic workflow")
    img_path = "demo_example.png"

    # Create a simple test image
    test_img = np.random.randint(0, 255, (150, 200, 3), dtype=np.uint8)
    test_img[50:100, 50:100] = [0, 0, 255]  # Add a blue square
    test_img[120:140, 100:120] = [0, 255, 0]  # Add a green rectangle

    cv2.imwrite(test_img_path, test_img)

    # Use ImageMagics API
    img = Image.load(test_img_path)
    print(f"[OK] Loaded image with shape {img.np_image.shape}")

    # Process the image
    processed = (img
                 .grayscale()
                 .enhance_contrast(1.2)
                 .resize((100, 100))
                 .rotate(90))

    print("[OK] Applied multiple processing operations")

    # Save result
    output_path = "api_demo_result.png"
    img.save(output_path)
    print(f"[OK] Saved processed image to {output_path}")

    # Clean up
    os.remove(test_img_path)
    os.remove(output_path)

    print("[DONE] API usage demonstration completed!\n")


def show_usage_examples():
    """Show various usage examples for different modules."""
    print("=== ImageMagics Usage Examples ===\n")

    print("1. Basic Image Operations:")
    print("   from image_magics import Image")
    print("   img = Image.load('input.jpg')")
    print("   img.grayscale().enhance_contrast(1.3).save('output.jpg')")
    print()

    print("2. Advanced Filters:")
    print("   from image_magics.filters import Filters")
    print("   blurred = Filters.gaussian_blur(image_array)")
    print("   edges = Filters.edge_detection(image_array)")
    print()

    print("3. Geometric Transforms:")
    print("   from image_magics.transforms import Transforms")
    print("   resized = Transforms.resize(image, width=500)")
    print("   flipped = Transforms.flip(image, direction='horizontal')")
    print()

    print("4. AI-Powered Enhancements:")
    print("   from image_magics.ai_enhancement import StyleTransfer")
    print("   enhancer = StyleTransfer()")
    print("   result = enhancer.transfer(content_img, style_img)")
    print()

    print("5. Process Chain:")
    print("   img = (Image.load('input.jpg')")
    print("        .resize((800, 600))")
    print("        .enhance_contrast(1.1))")
    print("        .save('processed.jpg')")
    print()


if __name__ == "__main__":
    print(" ImageMagics Library Demonstration")
    print("=" * 50)
    print()

    # Run all demonstrations
    test_core_image_operations()
    test_channel_operations()
    test_filters_and_transforms()
    demonstrate_api_usage()
    show_usage_examples()

    print(" All demonstrations completed!")
    print("\nFor more information, see the README and documentation.")