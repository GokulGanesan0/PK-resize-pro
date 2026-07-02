import os
import sys
import zipfile
from PIL import Image
import cv2

# Add root folder to sys.path so we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.border_remove import remove_white_borders
from backend.resize_export import resize_and_fit, save_png_with_300dpi
from backend.enhance import enhance_image
from backend.zip_export import create_zip_archive

def run_tests():
    print("==============================================")
    print("       POSTER RESIZE PRO - RUNNING TESTS      ")
    print("==============================================")
    
    test_img_path = "./input/test_pattern.png"
    out_dir = "./output"
    os.makedirs(out_dir, exist_ok=True)
    
    if not os.path.exists(test_img_path):
        print(f"ERROR: Test image {test_img_path} not found. Please run generate_test_image.py first.")
        sys.exit(1)
        
    # --- TEST 1: Border Removal ---
    print("\n[TEST 1] Testing white border removal...")
    cv_img = cv2.imread(test_img_path)
    h, w, c = cv_img.shape
    print(f"Loaded source image size: {w}x{h}")
    
    # Assert initial size is 440x440 (400x400 + 20px border on all 4 sides)
    assert w == 440 and h == 440, f"Expected 440x440 image, got {w}x{h}"
    
    cropped = remove_white_borders(cv_img)
    ch, cw, cc = cropped.shape
    print(f"Cropped image size: {cw}x{ch}")
    
    # Assert border was removed (should be exactly 400x400)
    assert cw == 400 and ch == 400, f"Expected cropped size 400x400, got {cw}x{ch}"
    print("SUCCESS: White borders successfully detected and removed.")
    
    # --- TEST 2: Quality Enhancement ---
    print("\n[TEST 2] Testing image quality enhancement...")
    enhanced = enhance_image(cropped)
    assert enhanced is not None, "Enhanced image is None"
    assert enhanced.shape == cropped.shape, "Shape changed during enhancement"
    print("SUCCESS: Image enhancement executed without shape modification.")
    
    # --- TEST 3: Smart Resizing and Fit ---
    print("\n[TEST 3] Testing print resizing (A4 Portrait)...")
    # A4 portrait should be 2480x3508
    # Test pad mode
    resized = resize_and_fit(enhanced, size_key="A4", orientation="portrait", scale_mode="pad")
    rh, rw, rc = resized.shape
    print(f"Resized pad dimensions: {rw}x{rh}")
    assert rw == 2480 and rh == 3508, f"Expected A4 portrait size 2480x3508, got {rw}x{rh}"
    
    # Test crop mode
    resized_crop = resize_and_fit(enhanced, size_key="A4", orientation="portrait", scale_mode="crop")
    rch, rcw, rcc = resized_crop.shape
    print(f"Resized crop dimensions: {rcw}x{rch}")
    assert rcw == 2480 and rch == 3508, f"Expected A4 portrait size 2480x3508 in crop mode, got {rcw}x{rch}"
    
    # Test smart mode (ratio 1.000 vs 0.707 is > 15% diff, should trigger padding)
    resized_smart = resize_and_fit(enhanced, size_key="A4", orientation="portrait", scale_mode="smart")
    rsh, rsw, rsc = resized_smart.shape
    print(f"Resized smart dimensions: {rsw}x{rsh}")
    assert rsw == 2480 and rsh == 3508, f"Expected A4 portrait size 2480x3508 in smart mode, got {rsw}x{rsh}"
    
    print("SUCCESS: Resizing and fit modes (pad, crop, smart) verified.")
    
    # --- TEST 4: Save PNG with 300 DPI ---
    print("\n[TEST 4] Testing 300 DPI metadata export...")
    out_file = os.path.join(out_dir, "Image_01.png")
    save_success = save_png_with_300dpi(resized, out_file)
    assert save_success, "Failed to save file"
    assert os.path.exists(out_file), "Saved file does not exist"
    
    # Read image back using PIL to inspect metadata DPI
    with Image.open(out_file) as pil_img:
        dpi = pil_img.info.get("dpi")
        rounded_dpi = (round(dpi[0]), round(dpi[1])) if dpi else None
        print(f"Saved image DPI metadata: {dpi} (rounded: {rounded_dpi})")
        assert rounded_dpi == (300, 300), f"Expected DPI (300, 300), got {dpi}"
    print("SUCCESS: PNG saved with valid 300 DPI metadata header.")
    
    # --- TEST 5: ZIP Compression ---
    print("\n[TEST 5] Testing output ZIP packaging...")
    zip_path = os.path.join(out_dir, "PosterResizePro_Output.zip")
    
    # Remove existing ZIP if any
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    zip_success = create_zip_archive([out_file], zip_path)
    assert zip_success, "Failed to create ZIP"
    assert os.path.exists(zip_path), "ZIP file does not exist"
    
    # Verify ZIP contents
    with zipfile.ZipFile(zip_path, 'r') as zf:
        namelist = zf.namelist()
        print(f"ZIP entries: {namelist}")
        assert "Image_01.png" in namelist, "Image_01.png is missing from ZIP"
    print("SUCCESS: Output files successfully packaged into ZIP container.")
    
    # --- TEST 6: Icon Files Generation ---
    print("\n[TEST 6] Testing icon files generation...")
    assert os.path.exists("./frontend/src-tauri/icons/icon.ico"), "icon.ico is missing"
    assert os.path.exists("./frontend/src-tauri/icons/icon.icns"), "icon.icns is missing"
    assert os.path.exists("./frontend/src-tauri/icons/32x32.png"), "32x32.png is missing"
    assert os.path.exists("./frontend/src/assets/logo.png"), "logo.png is missing"
    print("SUCCESS: Tauri icon files and logo assets verified on disk.")
    
    # --- TEST 7: Outpaint Offline Fallback ---
    print("\n[TEST 7] Testing outpaint offline fallback...")
    from backend.outpaint import outpaint_comfyui
    # Outpaint should fail or return None, triggering local blurred outpaint fallback
    outpaint_res = outpaint_comfyui(cv_img, 600, 800)
    assert outpaint_res is None, "Expected outpaint to return None (triggering local fallback)"
    print("SUCCESS: Outpaint module gracefully returned None to trigger local blurred padding.")
    
    # --- TEST 8: FastAPI server routes ---
    print("\n[TEST 8] Testing FastAPI server router...")
    from backend.api import app
    routes = [r.path for r in app.routes]
    print(f"Registered API Server Routes: {routes}")
    assert "/process" in routes, "/process endpoint missing"
    assert "/status" in routes, "/status endpoint missing"
    assert "/open-output" in routes, "/open-output endpoint missing"
    print("SUCCESS: FastAPI server routes verified.")
    
    print("\n==============================================")
    print("       ALL PIPELINE TESTS PASSED SUCCESS       ")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
