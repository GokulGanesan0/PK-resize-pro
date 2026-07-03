import os
import cv2
from PIL import Image
from backend.logger import logger

def save_image_with_300dpi(cv_img, output_path, file_format="PNG"):
    """
    Converts a BGR OpenCV image to RGB PIL format and exports it
    incorporating a print-ready 300 DPI metadata header.
    """
    try:
        # Normalize file format to uppercase
        file_format = file_format.upper()
        if file_format not in ["PNG", "JPEG", "JPG"]:
            file_format = "PNG"
            
        # Ensure correct folder path exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Convert BGR CV2 image to RGB PIL image
        rgb_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb_img)
        
        # Save image with 300 DPI metadata
        pil_format = "JPEG" if file_format in ["JPEG", "JPG"] else "PNG"
        pil_img.save(output_path, format=pil_format, dpi=(300, 300))
        
        logger.info(f"Saved print-ready {pil_format} image with 300 DPI to {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to export image with DPI header: {str(e)}")
        return False
