"""Image Magics - Advanced Image Processing Toolkit."""

from .core import Image
from .filters import Filters
from .transforms import Transforms
from .enhancement import Enhancement

try:
    from .ai_enhancement import StyleTransfer, SuperResolution, ObjectDetection, ImageEnhancerAI
    __all__ = [
        'Image', 'Filters', 'Transforms', 'Enhancement',
        'StyleTransfer', 'SuperResolution', 'ObjectDetection', 'ImageEnhancerAI'
    ]
except ImportError:
    # AI enhancements require PyTorch which may not be installed
    __all__ = ['Image', 'Filters', 'Transforms', 'Enhancement']

__version__ = "0.1.0"
__author__ = "Image Magics Team"
