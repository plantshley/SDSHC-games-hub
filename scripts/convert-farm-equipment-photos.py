"""
Convert SDSHC FFA Convention farm-equipment photos to WebP for the Field Guide.

Reads source images from the SDSHC Box "FFA Convention" folder, center-crops to
4:3, resizes to 960x720, and writes WebP into
public/assets/field-guide/farm-equipment/.

ROTATION: unlike the native-plants converter, this does NOT call
ImageOps.exif_transpose. Per the kiosk owner, portrait shots were being rotated
incorrectly, so we leave pixels exactly as stored and only center-crop. (Verified
safe: none of these sources carry an EXIF orientation flag, so transpose would be
a no-op anyway.)

Machines with several good photos are written as numbered variants
("<slug>.webp", "<slug>-2.webp", ...) so all stay in the random pool, matching
the native-plants variant pattern. Two sources are skipped for low resolution:
the 480x360 auger-flex combine (three better combines exist) and the 150x296
soil probe.
"""

import os
import sys
from PIL import Image

SRC_DIR = r'C:\Users\ashle\Box\SDSHC Box Files\Working Files\Austin Working Files\FFA Convention'
OUT_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'public', 'assets', 'field-guide', 'farm-equipment'
)

TARGET_WIDTH = 960
TARGET_HEIGHT = 720
WEBP_QUALITY = 82

# (source filename, output slug without extension). "-2"/"-3" = variants of one machine.
MAPPING = [
    # ── Tractors ──
    ('two wheel drive tractor.jpeg', 'two-wheel-drive-tractor'),
    ('mechanical front wheel assist tractor.jpg', 'mfwd-tractor'),
    ('4wd articulated tractor.webp', '4wd-articulated-tractor'),
    ('quad trac tractor.jpg', 'quad-trac-tractor'),
    ('two track tractor.webp', 'two-track-tractor'),
    # ── Combine (FFA variants added to existing web primary) ──
    ('combine harvester with a corn head harvesting corn.jpg', 'combine-harvester-2'),
    ('Combine harvester with a stripper head harvesting wheat.jpg', 'combine-harvester-3'),
    ('combine harvester with flex draper head harvesting soybeans.jpg', 'combine-harvester-4'),
    # ── Row crop planter (FFA variants added to existing web primary) ──
    ('row crop box fill 16 row planter.webp', 'row-crop-planter-2'),
    ('row crop central fill 16 row planter.webp', 'row-crop-planter-3'),
    ('Central Fill split row planter.jpg', 'row-crop-planter-4'),
    # ── Seeding ──
    ('no-till drill.webp', 'no-till-drill-2'),
    ('no till air drill.jpg', 'no-till-drill-3'),
    ('Air seeder disc drill.jpg', 'air-seeder'),
    ('air seeder hoe drill.jpg', 'air-seeder-2'),
    ('Grain drill.jpg', 'grain-drill'),
    # ── Manure spreader (FFA variants added to existing web primary) ──
    ('horizontal beater manure spreader.webp', 'manure-spreader-2'),
    ('vertical beater manure spreader.jpg', 'manure-spreader-3'),
    ('side slinger manure spreader.jpg', 'manure-spreader-4'),
    # ── Fertilizer application ──
    ('Dry fertilizer applicator with air booms.jpg', 'air-boom-applicator'),
    ('dry fertilizer applicator with spinner spreader.webp', 'spinner-spreader'),
    ('dry fertilizer spreader.jpg', 'spinner-spreader-2'),
    ('liquid fertilizer applicator.avif', 'liquid-fertilizer-applicator'),
    ('side-dress fertilizer application for corn.webp', 'side-dress-applicator'),
    # ── Sprayers ──
    ('self propelled sprayer.jpg', 'self-propelled-sprayer'),
    ('pull type sprayer.jpg', 'pull-type-sprayer'),
    # ── Grain handling ──
    ('grain cart.jpg', 'grain-cart-2'),
    ('Grain auger.png', 'grain-auger'),
    ('Grain conveyor.jpg', 'grain-conveyor'),
    ('grain vac.png', 'grain-vac'),
    ('gravity wagon.jpg', 'gravity-wagon'),
    # ── Strip-till (FFA variants added to existing web primary) ──
    ('strip till machine applying dry fertilizer.webp', 'strip-till-rig-2'),
    ('strip till machine applying liquid fertilizer.png', 'strip-till-rig-3'),
    # ── Hay & forage: mowers ──
    ('Mower Conditioner.jpg', 'mower-conditioner'),
    ('Sickle mower.jpg', 'sickle-mower'),
    ('disc mower.webp', 'disc-mower'),
    # ── Hay & forage: rakes ──
    ('Wheel rake.jpg', 'wheel-rake'),
    ('bar rake.jpg', 'bar-rake'),
    ('rotary rake.jpg', 'rotary-rake'),
    # ── Hay & forage: balers ──
    ('round baler.jpg', 'round-baler'),
    ('large square baler.jpg', 'large-square-baler'),
    ('small square baler.webp', 'small-square-baler'),
    # ── Windrower ──
    ('Windrower or Swather.png', 'windrower-swather'),
]


def convert(src_path, out_path):
    """Center-crop to 4:3, resize to 960x720, save WebP. No rotation."""
    img = Image.open(src_path).convert('RGB')

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
    # Re-runnable: just overwrite our MAPPING outputs. Do NOT wipe other webps —
    # the original web-sourced primaries (e.g. combine-harvester.webp, grain-bin.webp)
    # live in the same folder and must be preserved.

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
