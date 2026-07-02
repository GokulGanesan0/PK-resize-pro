import os
from PIL import Image

def generate_tauri_icons():
    logo_path = "./finall.png"
    icons_dir = "./frontend/src-tauri/icons"
    os.makedirs(icons_dir, exist_ok=True)
    
    if not os.path.exists(logo_path):
        print(f"Error: Application logo not found at {logo_path}")
        return False
        
    print(f"Loading app logo from: {logo_path}")
    img = Image.open(logo_path)
    
    # 1. Generate PNG sizes
    sizes_png = {
        "32x32.png": (32, 32),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256)
    }
    
    for name, size in sizes_png.items():
        out_path = os.path.join(icons_dir, name)
        resized = img.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, "PNG")
        print(f"Generated PNG icon: {out_path} ({size[0]}x{size[1]}px)")
        
    # 2. Generate Windows ICO file
    ico_path = os.path.join(icons_dir, "icon.ico")
    # ICO can package multiple sizes inside a single file
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=ico_sizes)
    print(f"Generated Windows ICO package: {ico_path}")
    
    # 3. Generate macOS ICNS file
    icns_path = os.path.join(icons_dir, "icon.icns")
    try:
        # Pillow has a built-in ICNS saver
        # Let's save a copy of the image and call icns saver
        # We need to make sure the image is in RGBA mode
        rgba_img = img.convert("RGBA")
        rgba_img.save(icns_path, format="ICNS")
        print(f"Generated macOS ICNS package: {icns_path}")
    except Exception as e:
        print(f"Warning: Could not compile native macOS ICNS file: {str(e)}")
        # Save high-res PNG copy as fallback
        fallback_path = os.path.join(icons_dir, "icon.icns")
        resized_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        resized_512.save(fallback_path, "PNG")
        print(f"Saved 512x512 PNG fallback as: {fallback_path}")
        
    # 4. Copy logo to frontend assets for App header
    assets_dir = "./frontend/src/assets"
    os.makedirs(assets_dir, exist_ok=True)
    header_logo_path = os.path.join(assets_dir, "logo.png")
    # Resize slightly to 80x80 for clean loading
    resized_logo = img.resize((80, 80), Image.Resampling.LANCZOS)
    resized_logo.save(header_logo_path, "PNG")
    print(f"Generated frontend header logo at: {header_logo_path}")
    
    print("SUCCESS: Icon generation complete!")
    return True

if __name__ == "__main__":
    generate_tauri_icons()
