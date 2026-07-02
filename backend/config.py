import os

# Root directory of the application
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Folders config
INPUT_DIR = os.path.join(ROOT_DIR, "input")
OUTPUT_DIR = os.path.join(ROOT_DIR, "output")
MODELS_DIR = os.path.join(ROOT_DIR, "models")

# Print target pixel resolutions at 300 DPI
PRINT_SIZES = {
    "A4": {
        "portrait": (2480, 3508),
        "landscape": (3508, 2480),
    },
    "A5": {
        "portrait": (1748, 2480),
        "landscape": (2480, 1748),
    },
    "A6": {
        "portrait": (1240, 1748),
        "landscape": (1748, 1240),
    },
}

# Model paths
REALESRGAN_MODEL_NAME = "RealESRGAN_x4plus.pth"
GFPGAN_MODEL_NAME = "GFPGANv1.4.pth"

REALESRGAN_PATH = os.path.join(MODELS_DIR, REALESRGAN_MODEL_NAME)
GFPGAN_PATH = os.path.join(MODELS_DIR, GFPGAN_MODEL_NAME)

# Fallback models download URLs
REALESRGAN_DOWNLOAD_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
GFPGAN_DOWNLOAD_URL = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth"
