import os
import cv2
from backend.logger import logger
from backend.config import REALESRGAN_PATH, REALESRGAN_DOWNLOAD_URL
from backend.utils import ensure_model_weights

def upscale_image(cv_img, use_ai=True):
    """
    Upscales the image 4x.
    If use_ai is True, attempts to use Real-ESRGAN.
    Otherwise, or if Real-ESRGAN fails/is not installed, falls back to
    high-quality OpenCV Lanczos4 interpolation.
    """
    if cv_img is None:
        return None
        
    h, w, c = cv_img.shape
    target_w, target_h = w * 4, h * 4
    
    if not use_ai:
        logger.info(f"AI Upscale disabled. Using Lanczos4 interpolation to scale 4x to {target_w}x{target_h}px.")
        return cv2.resize(cv_img, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
        
    # AI Upscale implementation
    try:
        # Check imports inside the function so it doesn't crash on startup if packages are missing
        import torch
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        
        # Ensure weights are present
        if not ensure_model_weights(REALESRGAN_PATH, REALESRGAN_DOWNLOAD_URL):
            raise ImportError("Real-ESRGAN weight file is missing and could not be downloaded.")
            
        # Select device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Real-ESRGAN initialized. Using device: {device}")
        
        # Set up model architecture
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        
        # Use half precision on CUDA to save memory and speed up inference
        use_half = (device.type == 'cuda')
        
        # Initialize upscaler
        upscaler = RealESRGANer(
            scale=4,
            model_path=REALESRGAN_PATH,
            model=model,
            tile=400,  # Tile size for low memory consumption
            tile_pad=10,
            pre_pad=0,
            half=use_half,
            device=device
        )
        
        logger.info("Running Real-ESRGAN 4x upscale...")
        # outscale=4 matches model scale
        output, _ = upscaler.enhance(cv_img, outscale=4)
        logger.info(f"Successfully upscaled image with Real-ESRGAN: {w}x{h} -> {output.shape[1]}x{output.shape[0]}px.")
        return output
        
    except Exception as e:
        logger.warning(f"Real-ESRGAN upscaling failed: {str(e)}. Falling back to high-quality Lanczos4 interpolation.")
        # Lanczos4 interpolation is one of the highest quality non-AI upscaling methods
        return cv2.resize(cv_img, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
