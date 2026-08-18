"""Image enhancement operations."""

import cv2
import numpy as np
from typing import Union


class Enhancement:
    """Provides image enhancement operations."""

    @staticmethod
    def adjust_brightness(image, value):
        """Adjust image brightness by specified value."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = cv2.add(v, value)
        v = np.clip(v, 0, 255)
        hsv = cv2.merge([h, s, v])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    @staticmethod
    def adjust_saturation(image, value):
        """Adjust image saturation by specified value."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        s = cv2.add(s, value)
        s = np.clip(s, 0, 255)
        hsv = cv2.merge([h, s, v])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    @staticmethod
    def adjust_hue(image, value):
        """Adjust image hue by specified value."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        h = (h + value) % 180
        hsv = cv2.merge([h, s, v])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    @staticmethod
    def histogram_equalization(image):
        """Apply histogram equalization to enhance contrast."""
        if len(image.shape) == 3:
            yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
            yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
            return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
        else:
            return cv2.equalizeHist(image)

    @staticmethod
    def clahe(image, clip_limit=2.0, tile_grid_size=(8, 8)):
        """Apply Contrast Limited Adaptive Histogram Equalization."""
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            lab_planes = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
            lab_planes[0] = clahe.apply(lab_planes[0])
            lab = cv2.merge(lab_planes)
            return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
            return clahe.apply(image)

    @staticmethod
    def gamma_correction(image, gamma=1.0):
        """Apply gamma correction to adjust brightness."""
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255
                          for i in np.arange(0, 256)]).astype("uint8")
        return cv2.LUT(image, table)

    @staticmethod
    def log_transform(image):
        """Apply logarithmic transformation."""
        c = 255 / np.log(1 + np.max(image))
        return c * np.log(1 + image)

    @staticmethod
    def power_law_transform(image, gamma=1.0):
        """Apply power-law (gamma) transformation."""
        c = np.max(image)
        return c * np.power(image / 255.0, gamma)

    @staticmethod
    def blur_background(image, blur_kernel=(15, 15)):
        """Apply Gaussian blur to background (simulates shallow depth of field)."""
        # Create a simple foreground mask (this is a basic implementation)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
        mask_inv = cv2.bitwise_not(mask)
        
        # Blur the background
        blurred_bg = cv2.GaussianBlur(image, blur_kernel, 0)
        
        # Combine foreground and blurred background
        fg = cv2.bitwise_and(image, image, mask=mask)
        bg = cv2.bitwise_and(blurred_bg, blurred_bg, mask=mask_inv)
        return cv2.add(fg, bg)

    @staticmethod
    def add_noise(image, noise_type='gaussian', mean=0, var=0.01):
        """Add noise to image."""
        row, col, ch = image.shape
        if noise_type == 'gaussian':
            sigma = var ** 0.5
            gauss = np.random.normal(mean, sigma, (row, col, ch))
            noisy = image + gauss
            return np.clip(noisy, 0, 255).astype(np.uint8)
        elif noise_type == 's&p':
            s_vs_p = 0.5
            amount = 0.004
            out = np.copy(image)
            # Salt mode
            num_salt = np.ceil(amount * image.size * s_vs_p)
            coords = [np.random.randint(0, i - 1, int(num_salt))
                      for i in image.shape]
            out[coords] = 255
            # Pepper mode
            num_pepper = np.ceil(amount * image.size * (1. - s_vs_p))
            coords = [np.random.randint(0, i - 1, int(num_pepper))
                      for i in image.shape]
            out[coords] = 0
            return out
        else:
            raise ValueError("noise_type must be 'gaussian' or 's&p'")
