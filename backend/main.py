import argparse
import json
import os
import sys

import cv2

# Ensure backend modules can be imported when main.py is run directly.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import INPUT_DIR, OUTPUT_DIR
from backend.logger import setup_logger, logger
from backend.utils import is_image_file
from backend.border_remove import remove_white_borders
from backend.enhance import enhance_image
from backend.upscale import upscale_image
from backend.face_restore import restore_faces
from backend.resize_export import resize_and_fit, save_png_with_300dpi
from backend.zip_export import create_zip_archive


def parse_args():
    def str2bool(v):
        if isinstance(v, bool):
            return v
        if v.lower() in ("yes", "true", "t", "y", "1"):
            return True
        if v.lower() in ("no", "false", "f", "n", "0"):
            return False
        raise argparse.ArgumentTypeError("Boolean value expected.")

    parser = argparse.ArgumentParser(description="Poster Resize Pro - Image Processing Pipeline")
    parser.add_argument("--input", type=str, default=INPUT_DIR, help="Path to input file, directory, or comma-separated list of files")
    parser.add_argument("--output", type=str, default=OUTPUT_DIR, help="Path to output folder")
    parser.add_argument("--size", type=str, default="A4", choices=["A4", "A5", "A6"], help="Target paper size")
    parser.add_argument("--orientation", type=str, default="portrait", choices=["portrait", "landscape", "auto"], help="Target orientation")
    parser.add_argument("--upscale", type=str2bool, default=True, help="Toggle Real-ESRGAN 4x upscale")
    parser.add_argument("--enhance", type=str2bool, default=True, help="Toggle unsharp/denoise/contrast enhancement")
    parser.add_argument("--face-restore", type=str2bool, default=False, help="Toggle GFPGAN face restoration")
    parser.add_argument(
        "--scale-mode",
        type=str,
        default="smart",
        choices=["crop", "pad", "smart"],
        help="Image fitting mode: crop, pad, or smart",
    )
    parser.add_argument(
        "--extend-bg",
        type=str2bool,
        default=None,
        help="Toggle blurred background extension; deprecated, use --scale-mode instead",
    )
    parser.add_argument("--zip", type=str2bool, default=True, help="Toggle bundling outputs into a ZIP file")
    parser.add_argument("--server", action="store_true", help="Launch the local FastAPI REST API server")

    return parser.parse_args()


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


def process_images(
    input_source=INPUT_DIR,
    output_dir=OUTPUT_DIR,
    size_key="A4",
    orientation="portrait",
    upscale=True,
    enhance=True,
    face_restore=False,
    scale_mode="smart",
    extend_bg=None,
    zip_outputs=True,
):
    """
    Runs the full image-processing pipeline and returns a frontend/API-friendly
    JSON-serializable result dictionary.
    """
    os.makedirs(output_dir, exist_ok=True)
    setup_logger(output_dir)

    logger.info("==============================================")
    logger.info("       POSTER RESIZE PRO PIPELINE START       ")
    logger.info("==============================================")
    logger.info(
        "Arguments: "
        f"input={input_source}, output={output_dir}, size={size_key}, "
        f"orientation={orientation}, upscale={upscale}, enhance={enhance}, "
        f"face_restore={face_restore}, scale_mode={scale_mode}, zip={zip_outputs}"
    )

    input_files = get_input_files(str(input_source))
    if not input_files:
        logger.error(f"No valid image files found at source: {input_source}")
        return {
            "success": False,
            "error": f"No valid image files found at source: {input_source}",
            "processed": 0,
            "failed": 0,
            "outputs": [],
            "output_files": [],
            "zip": None,
            "output_zip": None,
            "output_dir": os.path.abspath(output_dir),
            "failed_items": [],
        }

    logger.info(f"Found {len(input_files)} images to process.")

    processed_count = 0
    failed_count = 0
    output_files = []
    failed_items = []

    for idx, file_path in enumerate(input_files, start=1):
        filename = os.path.basename(file_path)
        logger.info(f"--- Processing [{idx}/{len(input_files)}]: {filename} ---")

        try:
            img = cv2.imread(file_path)
            if img is None:
                raise ValueError(f"Failed to read image or file is corrupt: {file_path}")

            img = remove_white_borders(img)

            if upscale:
                img = upscale_image(img, use_ai=True)

            if face_restore:
                img = restore_faces(img, use_ai=True)

            if enhance:
                img = enhance_image(img)

            img = resize_and_fit(
                img,
                size_key=size_key,
                orientation=orientation,
                scale_mode=scale_mode,
                extend_bg=extend_bg,
            )

            out_filename = f"Image_{processed_count + 1:02d}.png"
            out_path = os.path.abspath(os.path.join(output_dir, out_filename))

            save_success = save_png_with_300dpi(img, out_path)
            if not save_success:
                raise IOError(f"Failed to save output file: {out_filename}")

            logger.info(f"Successfully processed and exported: {out_filename}")
            output_files.append(out_path)
            processed_count += 1

        except Exception as e:
            error_message = str(e)
            logger.error(f"Failed processing {filename}: {error_message}")
            failed_count += 1
            failed_items.append({"input": file_path, "error": error_message})

    zip_path = None
    if zip_outputs and output_files:
        logger.info("Packaging output files into ZIP...")
        zip_path = os.path.abspath(os.path.join(output_dir, "PosterResizePro_Output.zip"))
        zip_success = create_zip_archive(output_files, zip_path)
        if not zip_success:
            logger.warning("Failed to bundle files into ZIP archive.")
            zip_path = None

    logger.info("==============================================")
    logger.info("      POSTER RESIZE PRO PIPELINE FINISHED     ")
    logger.info(f"Processed: {processed_count}, Failed: {failed_count}")
    logger.info("==============================================")

    return {
        "success": processed_count > 0,
        "processed": processed_count,
        "failed": failed_count,
        "outputs": [os.path.basename(path) for path in output_files],
        "output_files": output_files,
        "zip": os.path.basename(zip_path) if zip_path else None,
        "output_zip": zip_path,
        "output_dir": os.path.abspath(output_dir),
        "failed_items": failed_items,
    }


def main():
    args = parse_args()
    
    if args.server:
        import uvicorn
        logger.info("Starting local FastAPI REST API server...")
        # Run using string definition so reload can work if needed, or run app object directly
        # Since uvicorn.run needs to load api:app, we make sure it finds it
        from backend.api import app
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
        return
        
    result = process_images(
        input_source=args.input,
        output_dir=args.output,
        size_key=args.size,
        orientation=args.orientation,
        upscale=args.upscale,
        enhance=args.enhance,
        face_restore=args.face_restore,
        scale_mode=args.scale_mode,
        extend_bg=args.extend_bg,
        zip_outputs=args.zip,
    )

    print(json.dumps(result))


if __name__ == "__main__":
    main()
