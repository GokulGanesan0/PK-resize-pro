import argparse
import json
import os
import sys

import cv2

# Ensure backend modules can be imported when main.py is run directly.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import INPUT_DIR, OUTPUT_DIR
from backend.logger import setup_logger, logger
from backend.utils import is_image_file, get_input_files
from backend.batch_process import run_batch_pipeline


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
    Runs the full image-processing pipeline by delegating to batch_process module.
    """
    os.makedirs(output_dir, exist_ok=True)
    setup_logger(output_dir)

    logger.info("==============================================")
    logger.info("       POSTER RESIZE PRO PIPELINE START       ")
    logger.info("==============================================")
    
    # Map deprecated extend_bg to scale_mode if present
    if extend_bg is not None:
        scale_mode = "pad" if extend_bg else "crop"

    result = run_batch_pipeline(
        input_source=input_source,
        output_dir=output_dir,
        size_key=size_key,
        orientation=orientation,
        scale_mode=scale_mode,
        upscale=upscale,
        enhance=enhance,
        face_restore=face_restore,
        zip_outputs=zip_outputs
    )

    logger.info("==============================================")
    logger.info("      POSTER RESIZE PRO PIPELINE FINISHED     ")
    logger.info("==============================================")
    return result


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
