import os
import cv2
from backend.utils import get_input_files
from backend.logger import logger
from backend.border_remove import remove_white_borders
from backend.enhance import enhance_image
from backend.resize import resize_and_fit
from backend.dpi_export import save_image_with_300dpi
from backend.zip_export import create_zip_archive
from backend.ai_api import apply_ai_upscale, apply_ai_face_restore

def run_batch_pipeline(
    input_source,
    output_dir,
    size_key="A4",
    orientation="portrait",
    scale_mode="smart",
    upscale=True,
    enhance=True,
    face_restore=False,
    zip_outputs=True,
    progress_callback=None
):
    """
    Runs the image-processing pipeline over a list or folder of images,
    saves outputs sequentially, and optionally creates a ZIP bundle.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    input_files = get_input_files(input_source)
    if not input_files:
        raise ValueError(f"No valid image files found at: {input_source}")
        
    total_files = len(input_files)
    logger.info(f"Batch process started: {total_files} file(s) found.")
    
    processed_count = 0
    failed_count = 0
    output_files = []
    failed_items = []
    
    for idx, file_path in enumerate(input_files, start=1):
        filename = os.path.basename(file_path)
        logger.info(f"--- Processing Batch Item {idx}/{total_files}: {filename} ---")
        
        try:
            # 1. Load image
            img = cv2.imread(file_path)
            if img is None:
                raise IOError(f"Failed to read image: {filename}")
                
            # 2. Crop/Trim border margins
            img = remove_white_borders(img)
            
            # 3. Apply AI Upscale if enabled
            if upscale:
                img = apply_ai_upscale(img)
                
            # 4. Apply Face Restoration if enabled
            if face_restore:
                img = apply_ai_face_restore(img)
                
            # 5. Apply enhancements (denoise, contrast, sharpen)
            if enhance:
                img = enhance_image(img)
                
            # 6. Fit and resize
            img = resize_and_fit(
                img,
                size_key=size_key,
                orientation=orientation,
                scale_mode=scale_mode
            )
            
            # 7. Save print-ready output at 300 DPI
            out_filename = f"Image_{idx:02d}.png"
            out_path = os.path.join(output_dir, out_filename)
            
            if save_image_with_300dpi(img, out_path, "PNG"):
                processed_count += 1
                output_files.append(out_path)
            else:
                raise IOError("Failed to save image metadata headers.")
                
        except Exception as e:
            failed_count += 1
            failed_items.append({"file": filename, "error": str(e)})
            logger.error(f"Failed to process {filename}: {str(e)}")
            
        # Report progress
        if progress_callback:
            progress_callback(int((idx / total_files) * 100), filename)
            
    # 8. Create ZIP archive
    zip_path = None
    if zip_outputs and output_files:
        logger.info("Assembling release ZIP archive...")
        zip_path = os.path.join(output_dir, "PosterResizePro_Output.zip")
        if not create_zip_archive(output_files, zip_path):
            logger.error("ZIP packaging failed.")
            zip_path = None
            
    return {
        "success": processed_count > 0,
        "processed": processed_count,
        "failed": failed_count,
        "outputs": [os.path.basename(p) for p in output_files],
        "output_files": output_files,
        "zip": os.path.basename(zip_path) if zip_path else None,
        "output_zip": zip_path,
        "output_dir": os.path.abspath(output_dir),
        "failed_items": failed_items
    }
