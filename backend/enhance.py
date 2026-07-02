import cv2
from backend.logger import logger

def enhance_image(cv_img, denoise=True, sharpen=True, contrast=True):
    """
    Applies high-quality image enhancements:
    1. CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space
       to improve contrast and color clarity without shifting hues.
    2. Bilateral filtering for noise/artifact reduction while preserving edge details.
    3. Unsharp masking to enhance sharpness and clarity.
    """
    if cv_img is None:
        return None
        
    processed = cv_img.copy()
    
    # 1. Contrast & Color Clarity using CLAHE on LAB space
    if contrast:
        try:
            lab = cv2.cvtColor(processed, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE to Lightness channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            
            # Merge back
            lab_enhanced = cv2.merge((cl, a, b))
            processed = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
            logger.info("Applied CLAHE contrast and color enhancement.")
        except Exception as e:
            logger.error(f"Error during contrast enhancement: {str(e)}")

    # 2. Denoise using Bilateral Filter (better than standard smoothing for faces)
    if denoise:
        try:
            # d=9 (pixel neighborhood), sigmaColor=50 (filter color range), sigmaSpace=50 (coordinate space)
            processed = cv2.bilateralFilter(processed, d=9, sigmaColor=50, sigmaSpace=50)
            logger.info("Applied bilateral noise reduction (preserved edges).")
        except Exception as e:
            logger.error(f"Error during noise reduction: {str(e)}")

    # 3. Sharpening using Unsharp Masking
    if sharpen:
        try:
            # Generate a blurred version of the image
            blurred = cv2.GaussianBlur(processed, (5, 5), 1.0)
            # Add weighted difference (unsharp mask formula: output = original * alpha + blurred * beta + gamma)
            processed = cv2.addWeighted(processed, 1.5, blurred, -0.5, 0)
            logger.info("Applied unsharp mask sharpening.")
        except Exception as e:
            logger.error(f"Error during sharpening: {str(e)}")
            
    return processed
