import cv2
import numpy as np
from backend.logger import logger

def remove_white_borders(cv_img, threshold=240, max_crop_pct=0.25):
    """
    Scans the image from the outer edges inward to detect and remove white borders.
    This method is highly robust as it stops scanning the moment non-white content
    or the subject is encountered, preventing accidental inner cropping.
    """
    if cv_img is None:
        return None
        
    h, w, c = cv_img.shape
    
    # Convert to grayscale to simplify analysis
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Mask of white/near-white pixels (value is 1 if >= threshold, else 0)
    is_white = (gray >= threshold).astype(np.uint8)
    
    # Limit maximum crop to avoid cropping the entire image in case of solid backgrounds
    max_h_crop = int(h * max_crop_pct)
    max_w_crop = int(w * max_crop_pct)
    
    # 1. Top border
    top = 0
    for y in range(max_h_crop):
        if np.mean(is_white[y, :]) >= 0.98:
            top = y + 1
        else:
            break
            
    # 2. Bottom border
    bottom = h
    for y in range(h - 1, h - 1 - max_h_crop, -1):
        if np.mean(is_white[y, :]) >= 0.98:
            bottom = y
        else:
            break
            
    # 3. Left border
    left = 0
    for x in range(max_w_crop):
        if np.mean(is_white[:, x]) >= 0.98:
            left = x + 1
        else:
            break
            
    # 4. Right border
    right = w
    for x in range(w - 1, w - 1 - max_w_crop, -1):
        if np.mean(is_white[:, x]) >= 0.98:
            right = x
        else:
            break
            
    # Safety checks
    if left >= right or top >= bottom or (right - left) < 50 or (bottom - top) < 50:
        logger.info("White border removal bypassed (safety limits hit or no borders detected).")
        return cv_img
        
    # Apply crop
    if left > 0 or right < w or top > 0 or bottom < h:
        cropped = cv_img[top:bottom, left:right]
        logger.info(f"Removed white borders: top={top}px, bottom={h - bottom}px, left={left}px, right={w - right}px. Original size: {w}x{h}, New size: {cropped.shape[1]}x{cropped.shape[0]}.")
        return cropped
        
    return cv_img
