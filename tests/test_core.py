"""Tests for core ImageMagics functionality."""

import cv2
import numpy as np
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from image_magics import Image


def test_image_loading():
    """Test that images can be loaded."""
    # Create a test image
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    # Load and verify
    img = Image.load(test_path)
    assert img.np_image.shape == (100, 100, 3), f"Expected (100, 100, 3), got {img.np_image.shape}"
    print("✓ Image loading test passed")
    
    # Cleanup
    os.remove(test_img)


def test_grayscale():
    """Test grayscale conversion."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    img = Image.load(test_path)
    img.grayscale()
    assert img.np_image.shape == (100, 100), f"Expected (100, 100), got {img.np_image.shape}"
    # Grayscale images should have 2D shape after squeeze
    assert len(img.np_image.shape) == 2, f"Expected 2D array, got {img.np_image.shape}"
    print("✓ Grayscale test passed")
    
    # Cleanup
    os.remove(test_img)


def test_contrast_enhancement():
    """Test contrast enhancement."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    img = Image.load(test_path)
    img.enhance_contrast(1.5)
    assert img.path is not None or img.np_image is not None, "Image should have data"
    print("✓ Contrast enhancement test passed")
    
    # Cleanup
    os.remove(test_img)


def test_resize():
    """Test image resize."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    img = Image.load(test_path)
    img.resize((50, 50))
    assert img.np_image.shape == (50, 50, 3), f"Expected (50, 50, 3), got {img.np_image.shape}"
    print("✓ Resize test passed")
    
    # Cleanup
    os.remove(test_img)


def test_rotate():
    """Test image rotation."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    img = Image.load(test_path)
    img.rotate(45)
    assert img.np_image is not None, "Image should have data after rotation"
    print("✓ Rotate test passed")
    
    # Cleanup
    os.remove(test_img)


def test_flip():
    """Test image flip."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    cv2.imwrite(test_img, test_img)
    
    img = Image.load(test_path)
    img.flip('horizontal')
    assert img.np_image is not None, "Image should have data after flip"
    print("✓ Flip test passed")
    
    # Cleanup
    os.remove(test_img)


def test_save():
    """Test image saving and loading."""
    test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    test_path = "test_temp.png"
    output_path = "test_output.png"
    
    img = Image.load(test_path) if False else None
    # Alternative way
    img_obj = Image(np_image=test_img)
    img_obj.save(output_path)
    
    # Load the saved image
    loaded = cv2.imread(output_path)
    assert loaded is not None, "Saved image should be loadable"
    assert loaded.shape == test_img.shape, "Saved image dimensions should match"
    print("✓ Save test passed")
    
    # Cleanup
    os.remove(output_path)


if __name__ == "__main__":
    test_image_loading()
    test_grayscale()
    test_contrast_enhancement()
    test_resize()
    test_rotate()
    test_flip()
    test_save()
    print("\n✅ All core tests passed!")
