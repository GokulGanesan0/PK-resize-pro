# Poster Resize Pro

Poster Resize Pro is an offline-first poster image processor for preparing print-ready PNG files. It supports single-image and batch workflows, preserves each input as its own output, and packages final images into a ZIP archive.

## What It Does

- Accepts JPG, JPEG, PNG, and WEBP images.
- Removes white or near-white borders.
- Fits each image to A4, A5, or A6 in portrait, landscape, or auto orientation.
- Exports exact 300 DPI PNG sizes:
  - A4 portrait: `2480 x 3508`
  - A4 landscape: `3508 x 2480`
  - A5 portrait: `1748 x 2480`
  - A5 landscape: `2480 x 1748`
  - A6 portrait: `1240 x 1748`
  - A6 landscape: `1748 x 1240`
- Uses smart fit logic: safe crop when ratios are close, blurred background extension when ratios are far apart.
- Applies optional enhancement, optional Real-ESRGAN upscale, and optional low-strength GFPGAN face restoration.
- Saves outputs as `Image_01.png`, `Image_02.png`, and so on.
- Creates `PosterResizePro_Output.zip`.

## Project Structure

```text
backend/              Python image-processing pipeline and optional API
frontend/             React + Tauri desktop UI
input/                Sample/input image folder
output/               Generated PNG and ZIP outputs
scripts/              Test and platform build scripts
.github/workflows/    Release build workflow
```

## Backend CLI

```bash
python backend/main.py --input ./input --output ./output --size A5 --orientation portrait --upscale false --enhance true --face-restore false --scale-mode smart --zip true
```

The final stdout line is JSON for frontend integration:

```json
{
  "success": true,
  "processed": 1,
  "failed": 0,
  "outputs": ["Image_01.png"],
  "zip": "PosterResizePro_Output.zip"
}
```

## Local API

```bash
npm run backend:api
```

Endpoints:

- `POST /process`
- `GET /status`
- `POST /open-output`

## Tests

```bash
npm run generate:test-image
npm run test:pipeline
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Platform Builds

Run from the repository root:

```bash
npm run build:windows
npm run build:macos
npm run build:android
```

Expected release outputs:

```text
dist/windows/PosterResizePro-Windows.exe
dist/macos/PosterResizePro-macOS.dmg
dist/android/PosterResizePro-Android.apk
```

Desktop builds bundle the Python backend as a Tauri sidecar. Android uses the Tauri mobile build path and should keep heavyweight AI features disabled by default unless the target device and model size are acceptable.

## Model Files

Optional AI models belong in `models/`:

```text
models/RealESRGAN_x4plus.pth
models/GFPGANv1.4.pth
```

Automatic model download is disabled by default so packaged builds remain offline-safe. Set `POSTER_RESIZE_ALLOW_MODEL_DOWNLOAD=1` only when first-run downloads are desired.

The optional Real-ESRGAN/GFPGAN Python package stack is installed only on Python versions below 3.13 because one upstream dependency is not reliable on Python 3.13 yet. Core resize, enhancement, API, PNG, and ZIP export still work on Python 3.13.

## Build Notes

- Windows output is staged by `scripts/build-windows.ps1`.
- macOS output is staged by `scripts/build-macos.sh`.
- Android output is staged by `scripts/build-android.sh`.
- GitHub Actions builds all release artifacts on version tags such as `v1.0.0`.
