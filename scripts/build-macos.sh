#!/bin/bash
# Bash Build Script for Poster Resize Pro (macOS)

# Exit on error
set -e

echo "=============================================="
echo "   Poster Resize Pro - macOS Builder"
echo "=============================================="

# 1. Install dependencies
echo "Step 1: Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install pyinstaller
python3 -m pip install -r requirements.txt

# 2. Package Backend sidecar using PyInstaller
echo "Step 2: Building Python backend executable using PyInstaller..."
python3 -m PyInstaller --onefile --noconsole --name poster-resize-backend --workpath ./build --distpath ./dist_backend backend/main.py

# 3. Setup Tauri sidecar folder and copy binary
echo "Step 3: Copying backend to Tauri binaries folder..."
mkdir -p frontend/src-tauri/binaries

# Detect system architecture for sidecar target triple
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    TARGET_TRIPLE="aarch64-apple-darwin"
else
    TARGET_TRIPLE="x86_64-apple-darwin"
fi

target_binary="frontend/src-tauri/binaries/poster-resize-backend-${TARGET_TRIPLE}"
cp dist_backend/poster-resize-backend "$target_binary"
chmod +x "$target_binary"

echo "Sidecar binary copied to $target_binary"

# 4. Build Frontend UI and Tauri
echo "Step 4: Compiling frontend UI and building Tauri desktop wrapper..."
cd frontend
npm install
npm run build

# Build Tauri APP/DMG (requires Rust)
if command -v cargo &> /dev/null; then
    npm run tauri build
    
    # 5. Move final binary to dist/macos
    echo "Step 5: Staging final DMG in dist/macos/..."
    cd ..
    mkdir -p dist/macos
    
    built_dmg=$(find frontend/src-tauri/target/release/bundle/dmg -name '*.dmg' -type f 2>/dev/null | head -n 1)
    if [ -n "$built_dmg" ]; then
        cp "$built_dmg" dist/macos/PosterResizePro-macOS.dmg
        echo "SUCCESS: Portable macOS DMG built at dist/macos/PosterResizePro-macOS.dmg"
    else
        echo "Warning: DMG installer not found. Checking for application bundle..."
        built_app=$(find frontend/src-tauri/target/release/bundle/osx -maxdepth 1 -name '*.app' -type d 2>/dev/null | head -n 1)
        if [ -n "$built_app" ]; then
            tar -czf dist/macos/PosterResizePro-macOS-App.tar.gz -C "$(dirname "$built_app")" "$(basename "$built_app")"
            echo "SUCCESS: Compressed macOS APP built at dist/macos/PosterResizePro-macOS-App.tar.gz"
        else
            echo "ERROR: Could not locate built macOS app bundles."
        fi
    fi
else
    cd ..
    echo "WARNING: Rust 'cargo' is not installed locally."
    echo "Tauri wrapper compilation bypassed. Source code and backend sidecars are fully prepared."
    echo "You can build the final DMG by running: cd frontend; npm run tauri build"
fi

echo "=============================================="
echo "               macOS Build Step Done"
echo "=============================================="
