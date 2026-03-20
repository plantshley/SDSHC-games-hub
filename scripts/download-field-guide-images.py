"""
Download field guide images from Wikimedia Commons API.
Searches for each item, downloads the best match, converts to WebP at 960x720.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from PIL import Image
from io import BytesIO

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'field-guide')

# Search terms mapped to output paths
ITEMS = {
    'native-plants': [
        ('Pulsatilla patens flower prairie', 'pasque-flower'),
        ('Echinacea angustifolia purple coneflower', 'purple-coneflower'),
        ('Rudbeckia hirta black eyed susan flower', 'black-eyed-susan'),
        ('Andropogon gerardii big bluestem grass', 'big-bluestem'),
        ('Schizachyrium scoparium little bluestem', 'little-bluestem'),
        ('Ratibida columnifera prairie coneflower', 'prairie-coneflower'),
        ('Quercus macrocarpa bur oak tree', 'bur-oak'),
        ('Populus deltoides cottonwood tree', 'cottonwood'),
        ('Pinus ponderosa bark', 'ponderosa-pine'),
        ('Rosa arkansana prairie rose', 'prairie-rose'),
        ('Panicum virgatum switchgrass', 'switchgrass'),
    ],
    'cover-crops': [
        ('Secale cereale rye grain', 'cereal-rye'),
        ('Raphanus sativus radish', 'oilseed-radish'),
        ('Trifolium incarnatum crimson clover field', 'crimson-clover'),
        ('Vicia villosa hairy vetch flower', 'hairy-vetch'),
        ('Avena sativa oat plant', 'winter-oats'),
        ('Brassica rapa turnip field', 'turnips'),
        ('Zea mays corn field', 'corn'),
        ('Glycine max soybean plant', 'soybeans'),
        ('Triticum aestivum wheat field', 'winter-wheat'),
        ('Helianthus annuus sunflower field', 'sunflower'),
        ('Sorghum bicolor grain sorghum', 'grain-sorghum'),
    ],
    'conservation-practices': [
        ('no-till farming field', 'no-till-farming'),
        ('contour plowing farming', 'contour-farming'),
        ('terrace farming agriculture', 'terracing'),
        ('grassed waterway erosion', 'grassed-waterway'),
        ('riparian buffer zone stream', 'riparian-buffer'),
        ('windbreak trees agriculture', 'windbreak'),
        ('cover crop green field', 'cover-cropping'),
        ('strip farming alternating crops', 'strip-cropping'),
    ],
    'farm-equipment': [
        ('seed planter agricultural equipment', 'row-crop-planter'),
        ('seed drill agricultural machine', 'no-till-drill'),
        ('combine harvester', 'combine-harvester'),
        ('grain cart farm harvest', 'grain-cart'),
        ('strip tillage equipment', 'strip-till-rig'),
        ('roller crimper agriculture', 'roller-crimper'),
        ('tractor seeder planting field', 'cover-crop-interseeder'),
        ('agricultural drone spraying', 'agricultural-drone'),
    ],
}

TARGET_WIDTH = 960
TARGET_HEIGHT = 720
HEADERS = {
    'User-Agent': 'SDSHCFieldGuideBot/1.0 (educational project; https://github.com/SDSHC-games-hub)',
}
REQUEST_DELAY = 5  # seconds between requests to avoid 429


def fetch_with_retry(url, max_retries=3):
    """Fetch URL with retry and exponential backoff for 429 errors."""
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                wait = (attempt + 1) * 15
                print(f'  Rate limited, waiting {wait}s...')
                time.sleep(wait)
            else:
                raise
    return None


def search_commons(query):
    """Search Wikimedia Commons for an image and return the thumbnail URL."""
    params = urllib.parse.urlencode({
        'action': 'query',
        'generator': 'search',
        'gsrnamespace': '6',  # File namespace
        'gsrsearch': query,
        'gsrlimit': '3',
        'prop': 'imageinfo',
        'iiprop': 'url|size|mime',
        'iiurlwidth': str(TARGET_WIDTH),
        'format': 'json',
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'

    data_bytes = fetch_with_retry(url)
    data = json.loads(data_bytes.decode())

    pages = data.get('query', {}).get('pages', {})
    for page_id, page in sorted(pages.items(), key=lambda x: x[0]):
        info_list = page.get('imageinfo', [])
        for info in info_list:
            mime = info.get('mime', '')
            if 'image' not in mime or 'svg' in mime:
                continue
            thumb_url = info.get('thumburl', info.get('url', ''))
            if thumb_url:
                return thumb_url
    return None


def download_and_convert(url, output_path):
    """Download image from URL and save as WebP at target dimensions."""
    img_data = fetch_with_retry(url)

    img = Image.open(BytesIO(img_data))
    img = img.convert('RGB')

    # Crop to 4:3 aspect ratio (960:720) centered
    w, h = img.size
    target_ratio = TARGET_WIDTH / TARGET_HEIGHT  # 1.333
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall — crop top/bottom
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    # Resize to target dimensions
    img = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS)

    # Save as WebP
    img.save(output_path, 'WEBP', quality=80)


def main():
    total = sum(len(items) for items in ITEMS.values())
    done = 0
    failed = []

    for category, items in ITEMS.items():
        cat_dir = os.path.join(BASE_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)

        for search_term, filename in items:
            output_path = os.path.join(cat_dir, f'{filename}.webp')
            done += 1

            if os.path.exists(output_path):
                print(f'[{done}/{total}] SKIP (exists): {category}/{filename}')
                continue

            print(f'[{done}/{total}] Searching: "{search_term}"...')
            try:
                thumb_url = search_commons(search_term)
                if not thumb_url:
                    print(f'  FAIL No image found')
                    failed.append(f'{category}/{filename}')
                    continue

                print(f'  Downloading: {thumb_url[:80]}...')
                download_and_convert(thumb_url, output_path)
                size_kb = os.path.getsize(output_path) / 1024
                print(f'  OK Saved: {category}/{filename}.webp ({size_kb:.0f} KB)')
            except Exception as e:
                print(f'  FAIL Error: {e}')
                failed.append(f'{category}/{filename}')

            # Rate limit: wait between requests to avoid 429
            time.sleep(REQUEST_DELAY)

    print(f'\n--- Done: {total - len(failed)}/{total} images downloaded ---')
    if failed:
        print(f'Failed ({len(failed)}):')
        for f in failed:
            print(f'  - {f}')


if __name__ == '__main__':
    main()
