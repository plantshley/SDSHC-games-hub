"""
Convert SDSHC Box native-plant photos to WebP for the Field Guide game.

Reads source JPGs from the SDSHC Box folder, center-crops to 4:3, resizes to
960x720, and writes WebP into public/assets/field-guide/native-plants/.

Many phone photos store landscape pixels plus an EXIF "orientation" flag that
viewers use to display them upright. WebP drops that flag on save, so we bake the
orientation into the pixels first (ImageOps.exif_transpose) — otherwise portrait
shots show up sideways. This is the photo's own orientation, not an arbitrary
rotation; for images with no flag it is a no-op. We then center-crop only.

New species -> "<slug>.webp". Photos of species already in the game are added
as variants -> "<slug>-2.webp" (both images stay in the random pool).

Non-native species (cheatgrass, crested wheatgrass, Kentucky bluegrass, yellow
salsify) and the unidentified P1010612.JPG are intentionally excluded.
"""

import os
import sys
from PIL import Image, ImageOps

SRC_DIR = r'C:\Users\ashle\Box\SDSHC Box Files\Photos & Graphics\Native Plants Photos'
OUT_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'public', 'assets', 'field-guide', 'native-plants'
)

TARGET_WIDTH = 960
TARGET_HEIGHT = 720
WEBP_QUALITY = 82

# (source filename in Box folder, output slug without extension)
MAPPING = [
    # ── New species (primary photo) ──
    ('AnnualSunflower.jpg', 'annual-sunflower'),
    ('BallCactus.jpg', 'ball-cactus'),
    ('BuffaloGrass.jpg', 'buffalo-grass'),
    ('DottedGayfeather.JPG', 'dotted-gayfeather'),
    ('EasternRedCedar2.jpg', 'eastern-red-cedar'),
    ('Goldenrod (2).jpg', 'goldenrod'),
    ('Image010.jpg', 'scarlet-globemallow'),
    ('Image012.jpg', 'western-wallflower'),
    ('Junegrass1.jpg', 'prairie-junegrass'),
    ('Leadplant.jpg', 'leadplant'),
    ('MaximillianSunflower 2.jpg', 'maximilian-sunflower'),
    ('Milkweed.jpg', 'milkweed'),
    ('P1010614.JPG', 'prairie-smoke'),
    ('Phlox1.jpg', 'phlox'),
    ('PricklyPear1.jpg', 'prickly-pear'),
    ('PurplePrairieClover.jpg', 'purple-prairie-clover'),
    ('Shell Leaf Penstemon.jpg', 'shell-leaf-penstemon'),
    ('Spiderwort.jpg', 'spiderwort'),
    ('Wavyleaf Thistle 2.jpg', 'wavyleaf-thistle'),
    ('WesternWheat.jpg', 'western-wheatgrass'),
    ('WhiteBeardtongue.jpg', 'white-beardtongue'),
    ('Yucca 1.jpg', 'yucca'),
    ('heathaster.jpg', 'heath-aster'),
    ('milkvetch.jpg', 'milkvetch'),
    ('timpsila3.jpg', 'timpsila'),

    # ── Variants of NEW species (second photo of same plant) ──
    ('ScarletGlobemallow.jpg', 'scarlet-globemallow-2'),
    ('P1010517.JPG', 'goldenrod-2'),
    ('P1010521.JPG', 'dotted-gayfeather-2'),

    # ── Variants of EXISTING species already in the game ──
    ('BigBluestem.jpg', 'big-bluestem-2'),
    ('LittleBluestem 2.jpg', 'little-bluestem-2'),
    ('Echinacea1.jpg', 'purple-coneflower-2'),
    ('PrairieConeflower.jpg', 'prairie-coneflower-2'),
    ('PrairieRose 2.jpg', 'prairie-rose-2'),
]


def convert(src_path, out_path):
    """Bake EXIF orientation, center-crop to 4:3, resize to 960x720, save WebP."""
    img = Image.open(src_path)
    img = ImageOps.exif_transpose(img)  # rotate pixels upright per the photo's own EXIF flag
    img = img.convert('RGB')

    w, h = img.size
    target_ratio = TARGET_WIDTH / TARGET_HEIGHT  # 1.333...
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide — crop the sides, centered
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall — crop top and bottom, centered
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    img = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS)
    img.save(out_path, 'WEBP', quality=WEBP_QUALITY, method=6)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    converted, missing, failed = 0, [], []

    for filename, slug in MAPPING:
        src = os.path.join(SRC_DIR, filename)
        out = os.path.join(OUT_DIR, slug + '.webp')
        if not os.path.exists(src):
            missing.append(filename)
            print(f'  MISSING  {filename}')
            continue
        try:
            convert(src, out)
            converted += 1
            print(f'  OK       {filename}  ->  {slug}.webp')
        except Exception as e:  # noqa: BLE001
            failed.append((filename, str(e)))
            print(f'  FAILED   {filename}: {e}')

    print(f'\nConverted {converted}/{len(MAPPING)}.')
    if missing:
        print(f'Missing source files ({len(missing)}): {", ".join(missing)}')
    if failed:
        print(f'Failed ({len(failed)}): {", ".join(f for f, _ in failed)}')
        sys.exit(1)


if __name__ == '__main__':
    main()
