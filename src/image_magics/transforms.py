"""Geometric image transformations."""

import cv2
import numpy as np


class Transforms:
    """Provides geometric transformation operations."""

    @staticmethod
    def resize(image, width=None, height=None, scale=None):
        """Resize image by width, height, or scale factor."""
        if scale:
            return cv2.resize(image, None, fx=scale, fy=scale)
        elif width and height:
            return cv2.resize(image, (width, height))
        elif width:
            h, w = image.shape[:2]
            return cv2.resize(image, (width, int(h * width / w)))
        elif height:
            h, w = image.shape[:2]
            return cv2.resize(image, (int(w * height / h), height))
        else:
            raise ValueError("At least one of width, height, or scale must be provided")

    @staticmethod
    def rotate(image, angle, center=None, scale=1.0):
        """Rotate image by specified angle around center."""
        h, w = image.shape[:2]
        if center is None:
            center = (w / 2, h / 2)
        matrix = cv2.getRotationMatrix2D(center, angle, scale)
        return cv2.warpAffine(image, matrix, (w, h))

    @staticmethod
    def flip(image, direction='horizontal'):
        """Flip image horizontally or vertically."""
        if direction == 'horizontal':
            return cv2.flip(image, 1)
        elif direction == 'vertical':
            return cv2.flip(image, 0)
        else:
            raise ValueError("direction must be 'horizontal' or 'vertical'")

    @staticmethod
    def crop(image, x1, y1, x2, y2):
        """Crop image to specified region."""
        return image[y1:y2, x1:x2]

    @staticmethod
    def affine_transform(image, src_points, dst_points):
        """Apply affine transformation to image."""
        matrix = cv2.getAffineTransform(np.float32(src_points), np.float32(dst_points))
        h, w = image.shape[:2]
        return cv2.warpAffine(image, matrix, (w, h))

    @staticmethod
    def perspective_transform(image, src_points, dst_points):
        """Apply perspective transformation to image."""
        matrix = cv2.getPerspectiveTransform(np.float32(src_points), np.float32(dst_points))
        h, w = image.shape[:2]
        return cv2.warpPerspective(image, matrix, (w, h))

    @staticmethod
    def translate(image, x, y):
        """Translate image by x and y pixels."""
        h, w = image.shape[:2]
        matrix = np.float32([[1, 0, x], [0, 1, y]])
        return cv2.warpAffine(image, matrix, (w, h))

    @staticmethod
    def scale(image, scale_x, scale_y):
        """Scale image by scale factors."""
        h, w = image.shape[:2]
        matrix = np.float32([[scale_x, 0, 0], [0, scale_y, 0]])
        return cv2.warpAffine(image, matrix, (w, h))
