import cv2
from backend.logger import logger

def center_crop(cv_img, target_w, target_h):
    """
    Crops the image from its center to match the target aspect ratio,
    then resizes it using high-quality LANCZOS4 interpolation.
    """
    orig_h, orig_w = cv_img.shape[:2]
    target_ratio = target_w / target_h
    orig_ratio = orig_w / orig_h
    
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
        
    resized = cv2.resize(cropped, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
    return resized

def manual_crop(cv_img, x, y, w, h):
    """
    Performs a bounding-box crop based on explicit pixel coordinates.
    """
    logger.info(f"Manual crop triggered at box: x={x}, y={y}, w={w}, h={h}")
    orig_h, orig_w = cv_img.shape[:2]
    
    # Clip coordinates within image boundaries
    x1 = max(0, min(x, orig_w))
    y1 = max(0, min(y, orig_h))
    x2 = max(0, min(x + w, orig_w))
    y2 = max(0, min(y + h, orig_h))
    
    if (x2 - x1) <= 0 or (y2 - y1) <= 0:
        logger.warning("Invalid manual crop box dimensions. Returning original image.")
        return cv_img
        
    return cv_img[y1:y2, x1:x2]
