"""Core image processing functionality for Image Magics."""

import os
from typing import Optional
from PIL import Image as PILImage
import numpy as np


class Image:
    """Main Image class for loading, processing, and saving images."""

    def __init__(self, path: Optional[str] = None, np_image=None):
        """
        Initialize an Image object.

        Args:
            path: Path to the image file
            np_image: Optional NumPy array representing the image
        """
        if path:
            self.path = path
            self.pil_image = PILImage.open(path)
            self.np_image = np.array(self.pil_image)
        elif np_image is not None:
            self.path = None
            self.np_image = np_image
            self.pil_image = PILImage.fromarray(np_image)
        else:
            raise ValueError("Either path or np_image must be provided")

    @staticmethod
    def load(path: str) -> 'Image':
        """Load an image from the specified path."""
        return Image(path=path)

    def save(self, output_path: Optional[str] = None) -> 'Image':
        """Save the image to a file."""
        if output_path:
            self.pil_image.save(output_path)
            self.path = output_path
        return self

    def grayscale(self) -> 'Image':
        """Convert the image to grayscale."""
        self.pil_image = self.pil_image.convert('L')
        self.np_image = np.array(self.pil_image)
        return self

    def enhance_contrast(self, factor: float) -> 'Image':
        """Enhance the image contrast by the specified factor."""
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(self.pil_image)
        self.pil_image = enhancer.enhance(factor)
        return self

    def resize(self, size: tuple) -> 'Image':
        """Resize the image to the specified size."""
        self.pil_image = self.pil_image.resize(size, PILImage.Resampling.LANCZOS)
        return self

    def rotate(self, angle: float) -> 'Image':
        """Rotate the image by the specified angle."""
        self.pil_image = self.pil_image.rotate(angle, expand=True)
        return self

    def flip(self, direction: str = 'horizontal') -> 'Image':
        """Flip the image horizontally or vertically."""
        if direction == 'horizontal':
            self.pil_image = self.pil_image.transpose(PILImage.FLIP_LEFT_RIGHT)
        elif direction == 'vertical':
            self.pil_image = self.pil_image.transpose(PILImage.FLIP_TOP_BOTTOM)
        else:
            raise ValueError("direction must be 'horizontal' or 'vertical'")
        return self