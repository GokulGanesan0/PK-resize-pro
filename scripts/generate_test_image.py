import os
from PIL import Image, ImageDraw

def create_test_image():
    # Target path
    input_dir = "./input"
    os.makedirs(input_dir, exist_ok=True)
    img_path = os.path.join(input_dir, "test_pattern.png")
    
    # 1. Create a 400x400 source image
    # We will make it with a dark blue background and a red circle in the center
    w, h = 400, 400
    inner_img = Image.new("RGB", (w, h), (15, 23, 42))  # Slate-900 background
    draw = ImageDraw.Draw(inner_img)
    
    # Draw a mock face/subject: a yellow circle with eyes and mouth
    draw.ellipse([100, 100, 300, 300], fill=(234, 179, 8), outline=(202, 138, 4)) # Yellow face
    draw.ellipse([140, 150, 170, 180], fill=(15, 23, 42)) # Left eye
    draw.ellipse([230, 150, 260, 180], fill=(15, 23, 42)) # Right eye
    draw.arc([150, 200, 250, 260], start=0, end=180, fill=(15, 23, 42), width=5) # Smile
    
    # Draw a cyan label border
    draw.rectangle([20, 20, 380, 380], outline=(6, 182, 212), width=3) # Cyan box
    
    # 2. Add a solid 20px white border around the entire image (making it 440x440)
    border_px = 20
    out_w, out_h = w + (border_px * 2), h + (border_px * 2)
    final_img = Image.new("RGB", (out_w, out_h), (255, 255, 255)) # White canvas
    
    # Paste original in center
    final_img.paste(inner_img, (border_px, border_px))
    
    # Save the test image
    final_img.save(img_path)
    print(f"Generated test image with border at: {img_path} ({out_w}x{out_h}px)")

if __name__ == "__main__":
    create_test_image()
