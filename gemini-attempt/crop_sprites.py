import os
import cv2
import numpy as np
from PIL import Image

def crop_sprites(image_path, output_dir, prefix):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Read with cv2 including alpha channel
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Could not read {image_path}")
        return

    # Extract alpha channel
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        _, thresh = cv2.threshold(alpha, 1, 255, cv2.THRESH_BINARY)
    else:
        # If no alpha, assume top-left pixel is background color
        bg_color = img[0, 0]
        mask = cv2.inRange(img, bg_color, bg_color)
        thresh = cv2.bitwise_not(mask)

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Found {len(contours)} sprites in {image_path}")
    count = 1
    for i, c in enumerate(reversed(contours)): # Reversed often gives top-to-bottom/left-to-right
        x, y, w, h = cv2.boundingRect(c)
        if w < 4 or h < 4: continue # ignore tiny specks
        
        sprite = img[y:y+h, x:x+w]
        
        output_path = os.path.join(output_dir, f"{prefix}_{count}.png")
        cv2.imwrite(output_path, sprite)
        count += 1
    print(f"Saved {count-1} cropped components to {output_dir}")

if __name__ == "__main__":
    crop_sprites(
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\Sprout Lands - UI Pack - Basic pack\Sprite sheets\Sprite sheet for Basic Pack.png",
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\cropped_assets\ui_elements",
        "ui"
    )
    
    crop_sprites(
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\Sprout Lands - Sprites - Basic pack\Tilesets\Grass.png",
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\cropped_assets\tilesets_grass",
        "grass"
    )

    crop_sprites(
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\Sprout Lands - Sprites - Basic pack\Tilesets\Tilled Dirt.png",
        r"C:\Users\ashle\Documents\GitHub\SDSHC-games-hub\cropped_assets\tilesets_dirt",
        "dirt"
    )
