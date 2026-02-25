import os
import cv2
import numpy as np
from pathlib import Path

def crop_sprites(image_path_str, output_base_dir):
    image_path = Path(image_path_str)
    
    # Read with cv2 including alpha channel
    img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Could not read {image_path}")
        return

    # Extract alpha channel
    if len(img.shape) == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3]
        _, thresh = cv2.threshold(alpha, 1, 255, cv2.THRESH_BINARY)
    else:
        # If no alpha, assume top-left pixel is background color
        if len(img.shape) == 3:
            bg_color = img[0, 0]
            mask = cv2.inRange(img, bg_color, bg_color)
            thresh = cv2.bitwise_not(mask)
        else:
            # Grayscale image
            _, thresh = cv2.threshold(img, 1, 255, cv2.THRESH_BINARY)


    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Processing {image_path.name}...")
    
    # Sort contours by y, then x to try and get a somewhat logical ordering
    bounding_boxes = [cv2.boundingRect(c) for c in contours]
    # Sort by Y first (in chunks to handle rows), then X
    bounding_boxes.sort(key=lambda b: (b[1] // 16, b[0]))

    count = 1
    # Get the base namewithout extension and spaces replaced by underscores
    prefix = image_path.stem.replace(' ', '_')
    
    # Create specific output dir for this sprite sheet to keep it organized
    output_dir = Path(output_base_dir) / prefix
    output_dir.mkdir(parents=True, exist_ok=True)

    sprites_saved = 0
    for x, y, w, h in bounding_boxes:
        if w < 4 or h < 4: continue # ignore tiny specks
        
        sprite = img[y:y+h, x:x+w]
        
        output_path = output_dir / f"{prefix}_{count}.png"
        cv2.imwrite(str(output_path), sprite)
        count += 1
        sprites_saved += 1
        
    print(f"  -> Saved {sprites_saved} components to {output_dir.relative_to(output_base_dir.parent)}")

def process_all_assets():
    base_repo = Path(r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub")
    
    source_dirs = [
        base_repo / "Sprout Lands - Sprites - Basic pack",
        base_repo / "Sprout Lands - UI Pack - Basic pack"
    ]
    
    output_base_dir = base_repo / "cropped_assets" / "all_assets"
    
    for source_dir in source_dirs:
        if not source_dir.exists():
            print(f"Source dir not found: {source_dir}")
            continue
            
        print(f"\nScanning {source_dir.name}...")
        # Recursively find all PNG files
        for png_file in source_dir.rglob("*.png"):
            # Skip the 'Sprout Lands color pallet' directory as it's just swatches
            if "color pallet" in str(png_file).lower():
                continue
            crop_sprites(png_file, output_base_dir)
            
if __name__ == "__main__":
    process_all_assets()
