import cv2
from backend.logger import logger
from backend.config import PRINT_SIZES

def resolve_target_dimensions(size_key="A4", orientation="portrait", custom_w=None, custom_h=None, orig_w=1, orig_h=1):
    """
    Resolves the target pixel width and height.
    Supports preset keys (A4, A5, A6) or custom width and height.
    """
    if size_key == "custom" and custom_w is not None and custom_h is not None:
        return custom_w, custom_h
        
    preset = PRINT_SIZES.get(size_key, PRINT_SIZES["A4"])
    
    # Auto orientation: match the original image's aspect ratio flow
    if orientation == "auto":
        is_orig_portrait = orig_h >= orig_w
        resolved_orientation = "portrait" if is_orig_portrait else "landscape"
    else:
        resolved_orientation = orientation
        
    dimensions = preset.get(resolved_orientation, preset["portrait"])
    return dimensions[0], dimensions[1]

def resize_and_fit(cv_img, size_key="A4", orientation="portrait", scale_mode="smart", custom_w=None, custom_h=None):
    """
    Resizes and fits the image into the target dimensions.
    - scale_mode:
      - "crop": Perform center crop.
      - "pad": Perform blurred padding.
      - "smart": Performs center crop if aspect ratios are close (diff <= 15%),
                 otherwise falls back to blurred padding outpaint.
    """
    orig_h, orig_w = cv_img.shape[:2]
    target_w, target_h = resolve_target_dimensions(
        size_key, orientation, custom_w, custom_h, orig_w, orig_h
    )
    
    logger.info(f"Target dimensions: {size_key} {orientation} ({target_w}x{target_h}px)")
    
    orig_ratio = orig_w / orig_h
    target_ratio = target_w / target_h
    
    should_crop = True
    if scale_mode == "crop":
        should_crop = True
    elif scale_mode == "pad":
        should_crop = False
    else:  # "smart"
        ratio_diff = abs(orig_ratio - target_ratio) / target_ratio
        should_crop = ratio_diff <= 0.15
        
    if should_crop:
        from backend.crop import center_crop
        logger.info(f"Scale Mode: {scale_mode}. Performing crop to match aspect ratio.")
        final_img = center_crop(cv_img, target_w, target_h)
    else:
        from backend.outpaint import fit_on_blurred_background
        logger.info(f"Scale Mode: {scale_mode}. Performing blurred background padding.")
        final_img, _, _ = fit_on_blurred_background(cv_img, target_w, target_h)
        
    return final_img
