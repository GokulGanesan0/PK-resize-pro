# Poster Resize Pro Backend

Modular Python image-processing pipeline for print-ready poster export.

## Features

- White or near-white border trimming with OpenCV.
- Smart fit modes: `crop`, `pad`, and `smart`.
- Offline blurred-background extension for full-bleed output without empty margins.
- Optional Real-ESRGAN 4x upscale with Lanczos fallback.
- Optional low-strength GFPGAN face restoration.
- Contrast, denoise, and sharpening enhancement.
- Exact A4/A5/A6 PNG export with 300 DPI metadata.
- Sequential output names: `Image_01.png`, `Image_02.png`, ...
- ZIP export as `PosterResizePro_Output.zip`.
- CLI and optional local FastAPI integration.

## CLI Usage

```bash
python backend/main.py --input ./input --output ./output --size A5 --orientation portrait --upscale true --enhance true --face-restore false --scale-mode smart --zip true
```

Arguments:

- `--input`: input folder, single image file, or comma-separated image paths.
- `--output`: output folder.
- `--size`: `A4`, `A5`, or `A6`.
- `--orientation`: `portrait`, `landscape`, or `auto`.
- `--upscale`: enable Real-ESRGAN 4x upscale when available.
- `--enhance`: enable denoise, contrast, and sharpening.
- `--face-restore`: enable low-strength GFPGAN restoration.
- `--scale-mode`: `smart`, `crop`, or `pad`.
- `--zip`: create a ZIP archive.

The final stdout line is JSON:

```json
{
  "success": true,
  "processed": 3,
  "failed": 0,
  "outputs": ["Image_01.png", "Image_02.png", "Image_03.png"],
  "output_zip": "D:/Apps/Portatable/output/PosterResizePro_Output.zip"
}
```

## Local API

Install API dependencies and run:

```bash
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8765
```

Endpoints:

- `POST /process`
- `GET /status`
- `POST /open-output`

Example request:

```json
{
  "input": "./input",
  "output": "./output",
  "size": "A4",
  "orientation": "portrait",
  "upscale": false,
  "enhance": true,
  "face_restore": false,
  "scale_mode": "smart",
  "zip": true
}
```

## Models

Place model weights in `models/`:

- `RealESRGAN_x4plus.pth`
- `GFPGANv1.4.pth`

For offline-safe builds, the backend does not download models automatically. To allow first-run downloads, set:

```bash
POSTER_RESIZE_ALLOW_MODEL_DOWNLOAD=1
```

If a model is missing, the pipeline logs a clear warning and continues with safe fallback behavior.

The optional AI Python packages are guarded with `python_version < "3.13"` in `requirements.txt` because one upstream dependency is not reliable on Python 3.13 yet. The core pipeline and API still install and run on Python 3.13.

## Build

```bash
python -m PyInstaller --onefile backend/main.py --name PosterResizeBackend
```

For Tauri desktop builds, use the root project scripts:

```bash
npm run build:windows
npm run build:macos
npm run build:android
```

## Test

```bash
python scripts/generate_test_image.py
python scripts/test_pipeline.py
```
