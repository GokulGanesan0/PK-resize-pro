import os
import urllib.request
from backend.logger import logger

def is_image_file(filename):
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(filename.lower())[1]
    return ext in valid_extensions

def download_file(url, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    logger.info(f"Downloading {url} to {dest_path}...")
    
    def report_progress(block_num, block_size, total_size):
        read_so_far = block_num * block_size
        if total_size > 0:
            percent = min(100, (read_so_far * 100) // total_size)
            if block_num % 100 == 0:  # Log every 100 blocks to avoid flooding
                logger.info(f"Download progress: {percent}% ({read_so_far}/{total_size} bytes)")
        else:
            if block_num % 100 == 0:
                logger.info(f"Download progress: {read_so_far} bytes read")

    try:
        urllib.request.urlretrieve(url, dest_path, reporthook=report_progress)
        logger.info(f"Successfully downloaded to {dest_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to download {url}: {str(e)}")
        return False

def ensure_model_weights(model_path, download_url, allow_download=None):
    if os.path.exists(model_path):
        return True
    
    logger.warning(f"Model file {os.path.basename(model_path)} is missing.")

    if allow_download is None:
        allow_download = os.environ.get("POSTER_RESIZE_ALLOW_MODEL_DOWNLOAD", "").lower() in {
            "1",
            "true",
            "yes",
            "y",
        }

    if not allow_download:
        logger.warning(
            "Automatic model download is disabled for offline-safe operation. "
            "Place the model in the models folder or set POSTER_RESIZE_ALLOW_MODEL_DOWNLOAD=1."
        )
        return False

    try:
        success = download_file(download_url, model_path)
        return success
    except Exception as e:
        logger.error(f"Could not automatically download model: {str(e)}")
        return False

def get_input_files(input_arg):
    """
    Resolves the input argument into a list of file paths.
    Supports a directory path, a single file, or a comma-separated list of files.
    """
    files = []

    if "," in input_arg:
        paths = [p.strip() for p in input_arg.split(",")]
        for path in paths:
            if os.path.isfile(path) and is_image_file(path):
                files.append(os.path.abspath(path))
        return files

    if os.path.isdir(input_arg):
        for entry in os.listdir(input_arg):
            full_path = os.path.join(input_arg, entry)
            if os.path.isfile(full_path) and is_image_file(full_path):
                files.append(os.path.abspath(full_path))
        return sorted(files)

    if os.path.isfile(input_arg) and is_image_file(input_arg):
        files.append(os.path.abspath(input_arg))

    return files
