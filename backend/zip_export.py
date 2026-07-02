import os
import zipfile
from backend.logger import logger

def create_zip_archive(file_paths, zip_out_path):
    """
    Compresses a list of files into a single ZIP archive.
    """
    if not file_paths:
        logger.warning("No files to zip.")
        return False
        
    try:
        os.makedirs(os.path.dirname(zip_out_path), exist_ok=True)
        
        # Write files to ZIP
        with zipfile.ZipFile(zip_out_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in file_paths:
                if os.path.exists(file_path):
                    # Store file under its basename (no absolute folder structure inside ZIP)
                    arcname = os.path.basename(file_path)
                    zip_file.write(file_path, arcname=arcname)
                    logger.info(f"Added {arcname} to ZIP archive.")
                else:
                    logger.warning(f"File {file_path} not found, skipping zip entry.")
                    
        logger.info(f"Successfully created ZIP archive at: {zip_out_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to create ZIP archive: {str(e)}")
        return False
