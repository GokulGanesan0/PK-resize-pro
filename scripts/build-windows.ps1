# PowerShell Build Script for Poster Resize Pro (Windows)

# Ensure script halts on error
$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   Poster Resize Pro - Windows Builder" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Install Python dependencies
Write-Host "Step 1: Checking and installing Python dependencies..." -ForegroundColor Green
python -m pip install --upgrade pip
python -m pip install pyinstaller
python -m pip install -r requirements.txt

# 2. Package Backend sidecar using PyInstaller
Write-Host "Step 2: Building Python backend executable using PyInstaller..." -ForegroundColor Green
python -m PyInstaller --onefile --noconsole --name poster-resize-backend --workpath ./build --distpath ./dist_backend backend/main.py

# 3. Setup Tauri sidecar folder and copy binary
Write-Host "Step 3: Copying backend to Tauri binaries folder..." -ForegroundColor Green
$tauriBinDir = "frontend/src-tauri/binaries"
if (!(Test-Path $tauriBinDir)) {
    New-Item -ItemType Directory -Path $tauriBinDir | Out-Null
}

# Tauri sidecar requires target triple suffix
# For Windows 64-bit: x86_64-pc-windows-msvc
$targetBinary = "$tauriBinDir/poster-resize-backend-x86_64-pc-windows-msvc.exe"
Copy-Item "dist_backend/poster-resize-backend.exe" $targetBinary -Force

Write-Host "Sidecar binary copied to $targetBinary" -ForegroundColor Yellow

# 4. Build Frontend UI and Tauri
Write-Host "Step 4: Compiling frontend UI and building Tauri desktop wrapper..." -ForegroundColor Green
Set-Location frontend
npm install
npm run build

# Build Tauri EXE (Note: requires Rust/cargo to be installed in host system)
if (Get-Command cargo -ErrorAction SilentlyContinue) {
    npm run tauri build
    
    # 5. Move final binary to dist/windows
    Write-Host "Step 5: Staging final executable in dist/windows/..." -ForegroundColor Green
    Set-Location ..
    $outputDist = "dist/windows"
    if (!(Test-Path $outputDist)) {
        New-Item -ItemType Directory -Path $outputDist | Out-Null
    }
    
    # Locate built installer/executable
    $builtExe = Get-ChildItem "frontend/src-tauri/target/release/bundle/nsis/*.exe" | Select-Object -First 1
    if ($builtExe) {
        Copy-Item $builtExe.FullName "$outputDist/PosterResizePro-Windows.exe" -Force
        Write-Host "SUCCESS: Portable Windows EXE built at $outputDist/PosterResizePro-Windows.exe" -ForegroundColor Green
    } else {
        Write-Host "Warning: Tauri NSIS installer not found. Checking for standalone release EXE..." -ForegroundColor Yellow
        $standaloneExe = "frontend/src-tauri/target/release/poster-resize-pro.exe"
        if (Test-Path $standaloneExe) {
            Copy-Item $standaloneExe "$outputDist/PosterResizePro-Windows.exe" -Force
            Write-Host "SUCCESS: Portable Windows EXE built at $outputDist/PosterResizePro-Windows.exe" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Could not locate built executable." -ForegroundColor Red
        }
    }
} else {
    Set-Location ..
    Write-Host "WARNING: Rust 'cargo' is not installed locally." -ForegroundColor Yellow
    Write-Host "Tauri wrapper compilation bypassed. Source code and backend sidecars are fully prepared." -ForegroundColor Yellow
    Write-Host "You can build the final EXE by installing Rust (rustup) and running: cd frontend; npm run tauri build" -ForegroundColor Yellow
    Write-Host "Or push to GitHub to trigger the automated Actions release runner." -ForegroundColor Green
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "               Windows Build Step Done" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
