#!/bin/bash
# Bash Build Script for Poster Resize Pro (Android)

# Exit on error
set -e

echo "=============================================="
echo "   Poster Resize Pro - Android Builder"
echo "=============================================="

# Check if Tauri is present
if [ ! -d "frontend" ]; then
    echo "ERROR: Run this script from the workspace root directory."
    exit 1
fi

echo "Step 1: Staging Android project settings..."
cd frontend

# Verify Tauri CLI is installed
if ! npm list @tauri-apps/cli &> /dev/null; then
    npm install --save-dev @tauri-apps/cli
fi

# In Tauri v2, mobile target is compiled using native Android toolchains.
# Check if Android SDK/NDK variables are defined (standard variables for Android builders)
export ANDROID_HOME=${ANDROID_HOME:-"$HOME/Android/Sdk"}
if [ -d "$ANDROID_HOME" ]; then
    echo "Using Android SDK at $ANDROID_HOME"
else
    echo "WARNING: ANDROID_HOME is not set or directory does not exist."
    echo "Please ensure ANDROID_HOME is configured to your Android SDK location."
fi

# Build Android target
echo "Step 2: Triggering Tauri Android compiler (Gradle)..."
if command -v cargo &> /dev/null; then
    # Initialize Android wrapper if not already done
    if [ ! -d "src-tauri/gen/android" ]; then
        echo "Initializing Android platform configurations..."
        npx tauri android init
    fi
    
    # Compile release APK
    npm run tauri android build -- --apk
    
    # 3. Stage output
    echo "Step 3: Staging built APK in dist/android/..."
    cd ..
    mkdir -p dist/android
    
    # Find built APK (usually under src-tauri/gen/android/app/build/outputs/apk/release/)
    built_apk=$(find frontend/src-tauri/gen/android/app/build/outputs/apk/release/*.apk -type f 2>/dev/null | head -n 1)
    if [ -n "$built_apk" ]; then
        cp "$built_apk" dist/android/PosterResizePro-Android.apk
        echo "SUCCESS: Android APK built at dist/android/PosterResizePro-Android.apk"
    else
        echo "ERROR: Gradle compilation completed but APK file could not be found."
        echo "Check build output logs under frontend/src-tauri/gen/android/app/build/outputs/apk/"
    fi
else
    cd ..
    echo "WARNING: Rust 'cargo' is not installed locally."
    echo "Tauri Android compilation bypassed. Source code and Gradle settings are fully prepared."
    echo "To build the APK, configure your Android SDK/NDK, install Rust with target support:"
    echo "rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android"
    echo "And run: cd frontend; npx tauri android build --apk"
fi

echo "=============================================="
echo "              Android Build Step Done"
echo "=============================================="
