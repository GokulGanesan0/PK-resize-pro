import os
import cv2
from PIL import Image
from backend.logger import logger
from backend.config import PRINT_SIZES
from backend.outpaint import fit_on_blurred_background

def resize_and_fit(cv_img, size_key="A4", orientation="portrait", scale_mode="smart", extend_bg=None):
    """
    Resizes and fits the image to the exact target size.
    - Resolves size_key (A4/A5/A6) and orientation (portrait/landscape) to target pixel size.
    - If orientation is "auto", determines the best fit based on the image's dimensions.
    - scale_mode:
      - "crop": Always center crops the image to the target ratio.
      - "pad": Always pads the image with a blurred background outpaint.
      - "smart": Performs crop if aspect ratio difference is small (<=15%), otherwise pads.
    """
    if cv_img is None:
        return None
        
    orig_h, orig_w, c = cv_img.shape
    orig_ratio = orig_w / orig_h
    
    # 1. Resolve target dimensions
    if size_key not in PRINT_SIZES:
        logger.warning(f"Unknown size key '{size_key}', defaulting to A4.")
        size_key = "A4"
        
    sizes = PRINT_SIZES[size_key]
    
    if orientation == "auto":
        # Match original image orientation
        resolved_orientation = "landscape" if orig_ratio >= 1.0 else "portrait"
    else:
        resolved_orientation = orientation
        
    target_w, target_h = sizes[resolved_orientation]
    target_ratio = target_w / target_h
    
    logger.info(f"Target dimensions: {size_key} {resolved_orientation} ({target_w}x{target_h}px, ratio: {target_ratio:.3f}). Original ratio: {orig_ratio:.3f}.")
    
    # Backward compatibility with extend_bg parameter
    if extend_bg is True:
        scale_mode = "pad"
    elif extend_bg is False and scale_mode == "smart":
        scale_mode = "crop"
        
    # Determine resizing mode (crop vs pad)
    should_crop = False
    if scale_mode == "crop":
        should_crop = True
    elif scale_mode == "pad":
        should_crop = False
    else: # "smart"
        ratio_diff = abs(orig_ratio - target_ratio) / target_ratio
        should_crop = ratio_diff <= 0.15
        
    if should_crop:
        # Perform center crop to match target ratio, then resize
        logger.info(f"Scale Mode: {scale_mode}. Performing center crop.")
        
        if orig_ratio > target_ratio:
            # Original is wider than target: crop width
            new_w = int(orig_h * target_ratio)
            start_x = (orig_w - new_w) // 2
            cropped = cv_img[0:orig_h, start_x:start_x+new_w]
        else:
            # Original is taller than target: crop height
            new_h = int(orig_w / target_ratio)
            start_y = (orig_h - new_h) // 2
            cropped = cv_img[start_y:start_y+new_h, 0:orig_w]
            
        final_img = cv2.resize(cropped, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
        
    else:
        # Create a blurred background and overlay the fitted image in the center
        logger.info(f"Scale Mode: {scale_mode}. Performing blurred background padding.")
        final_img, _, _ = fit_on_blurred_background(cv_img, target_w, target_h)
        
    return final_img

def save_png_with_300dpi(cv_img, output_path):
    """
    Saves a BGR OpenCV image as a PNG file with 300 DPI metadata.
    """
    try:
        # Convert OpenCV BGR to PIL RGB
        rgb_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb_img)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save PNG with DPI metadata
        pil_img.save(output_path, format="PNG", dpi=(300, 300))
        logger.info(f"Saved print-ready PNG with 300 DPI to {output_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to save PNG with DPI: {str(e)}")
        return False
