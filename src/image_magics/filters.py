"""Image filtering operations."""

import cv2
import numpy as np


class Filters:
    """Provides various image filtering operations."""

    @staticmethod
    def gaussian_blur(image, kernel_size=(5, 5)):
        """Apply Gaussian blur to the image."""
        return cv2.GaussianBlur(image, kernel_size, 0)

    @staticmethod
    def edge_detection(image, kernel_size=3):
        """Detect edges using Sobel operator."""
        sobel_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=kernel_size)
        sobel_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=kernel_size)
        return cv2.magnitude(sobel_x, sobel_y)

    @staticmethod
    def median_blur(image, kernel_size=5):
        """Apply median blur to reduce noise."""
        return cv2.medianBlur(image, kernel_size)

    @staticmethod
    def adaptive_threshold(image, max_value=255, block_size=11, method='gaussian'):
        """Apply adaptive thresholding."""
        return cv2.adaptiveThreshold(
            image, max_value,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C if method == 'gaussian' else cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY, block_size, 2)

    @staticmethod
    def bilateral_filter(image, diameter=5, color_sigma=75, space_sigma=75):
        """Apply bilateral filter for edge-preserving smoothing."""
        return cv2.bilateralFilter(image, diameter, color_sigma, space_sigma)

    @staticmethod
    def sharpen(image):
        """Apply unsharp masking to sharpen the image."""
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]) / 12.0
        return cv2.filter2D(image, -1, kernel)
