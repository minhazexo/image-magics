from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="image-magics",
    version="0.1.0",
    author="Image Magics Team",
    author_email="contact@imagemagics.example",
    description="A toolset for advanced image processing and manipulation",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/example/image-magics",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Multimedia :: Graphics :: Graphics Conversion",
        "Topic :: Scientific/Engineering :: Image Processing",
    ],
    python_requires=">=3.8",
    install_requires=[
        "numpy>=1.20.0",
        "Pillow>=8.0.0",
    ],
    extras_require={
        "opencv": ["opencv-python>=4.5.0"],
        "torch": ["torch>=1.9.0", "torchvision>=0.10.0"],
        "dev": ["pytest>=6.0.0", "black", "flake8"],
    },
)