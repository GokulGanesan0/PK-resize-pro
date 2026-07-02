import os
import cv2
from backend.logger import logger
from backend.config import GFPGAN_PATH, GFPGAN_DOWNLOAD_URL
from backend.utils import ensure_model_weights

def restore_faces(cv_img, use_ai=True, strength=0.35):
    """
    Applies GFPGAN face restoration to the image.
    To avoid altering facial features, expressions, skin tone, or identity:
    1. GFPGAN is run to obtain a restored image.
    2. The restored image is blended with the original image using a low strength
       (e.g., 35% restored, 65% original).
    3. If GFPGAN is not installed, or if weight files are missing, it returns
       the original image unchanged.
    """
    if cv_img is None:
        return None
        
    if not use_ai:
        logger.info("Face restoration disabled.")
        return cv_img
        
    try:
        import torch
        from gfpgan import GFPGANer
        
        # Ensure weights are present
        if not ensure_model_weights(GFPGAN_PATH, GFPGAN_DOWNLOAD_URL):
            raise ImportError("GFPGAN weight file is missing and could not be downloaded.")
            
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"GFPGAN face restoration initialized on device: {device}")
        
        # GFPGANv1.4 uses the 'clean' architecture with channel multiplier 2
        face_enhancer = GFPGANer(
            model_path=GFPGAN_PATH,
            upscale=1,  # Keep original scale, scaling is done in upscale.py
            arch='clean',
            channel_multiplier=2,
            bg_upsampler=None,
            device=device
        )
        
        logger.info("Running GFPGAN face restoration...")
        # paste_back=True restores faces and overlays them back onto the original image
        _, _, restored_img = face_enhancer.enhance(
            cv_img,
            has_aligned=False,
            only_center_face=False,
            paste_back=True
        )
        
        # Blend the restored faces back into the original image at a low strength
        # to preserve skin texture, expression, and absolute identity
        blended_img = cv2.addWeighted(restored_img, strength, cv_img, 1.0 - strength, 0)
        
        logger.info(f"Successfully applied GFPGAN face restoration (strength: {strength}).")
        return blended_img
        
    except Exception as e:
        logger.warning(f"GFPGAN face restoration failed/unavailable: {str(e)}. Proceeding without face restoration.")
        return cv_img
