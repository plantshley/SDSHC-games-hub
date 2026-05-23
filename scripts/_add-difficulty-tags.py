"""
One-time: insert `difficulty: N` into the 60 Field Guide items across the five
topics that were untagged (cover-crops, conservation-practices, farm-equipment,
sd-wildlife, soil-types). Difficulty is a blended recognizability ramp: the most
iconic / commonly known items are level 1, the most obscure are level 4 (3 items
per level per topic). Idempotent — skips items that already carry a difficulty.
"""

import re

TARGET = r'../src/data/content/advanced/field-guide.js'

DIFFICULTY = {
    # cover-crops
    'cereal-rye': 3, 'oilseed-radish': 4, 'crimson-clover': 3, 'hairy-vetch': 4,
    'winter-oats': 2, 'turnips': 2, 'corn': 1, 'soybeans': 1, 'winter-wheat': 2,
    'sunflower': 1, 'grain-sorghum': 3, 'field-pea': 4,
    # conservation-practices
    'no-till': 1, 'contour-farming': 2, 'terracing': 1, 'grassed-waterway': 3,
    'riparian-buffer': 3, 'windbreak': 1, 'cover-cropping': 2, 'strip-cropping': 4,
    'crop-rotation': 2, 'grazing-management': 3, 'wetland-restoration': 4,
    'pollinator-habitat': 4,
    # farm-equipment
    'row-crop-planter': 2, 'no-till-drill': 3, 'combine-harvester': 1,
    'grain-cart': 2, 'strip-till-rig': 4, 'roller-crimper': 4,
    'cover-crop-interseeder': 4, 'agricultural-drone': 1, 'manure-spreader': 3,
    'soil-sampler': 3, 'center-pivot': 1, 'grain-bin': 2,
    # sd-wildlife
    'ring-necked-pheasant': 2, 'american-bison': 1, 'prairie-dog': 3,
    'monarch-butterfly': 2, 'western-meadowlark': 3, 'white-tailed-deer': 1,
    'pronghorn': 3, 'bald-eagle': 1, 'painted-lady': 4, 'great-plains-toad': 4,
    'eastern-cottontail': 4, 'red-fox': 2,
    # soil-types
    'mollisol': 3, 'sandy-loam': 3, 'clay-soil': 1, 'soil-horizons': 2,
    'loess': 4, 'caliche': 4, 'soil-aggregate': 3, 'earthworm': 1,
    'mycorrhizae': 4, 'gully-erosion': 1, 'healthy-vs-degraded': 2,
    'prairie-roots': 2,
}

ID_RE = re.compile(r"^(\s*)id: '([^']+)',\s*$")
SUBTYPE_RE = re.compile(r"^\s*subtype: '")
DIFF_RE = re.compile(r"^\s*difficulty: ")

with open(TARGET, encoding='utf-8') as f:
    lines = f.readlines()

out = []
current_id = None
inserted = 0
for i, line in enumerate(lines):
    out.append(line)
    m = ID_RE.match(line)
    if m:
        current_id = m.group(2)
        continue
    if current_id in DIFFICULTY and SUBTYPE_RE.match(line):
        indent = re.match(r'^(\s*)', line).group(1)
        # Idempotency: don't insert if a difficulty already follows.
        nxt = lines[i + 1] if i + 1 < len(lines) else ''
        if not DIFF_RE.match(nxt):
            out.append(f"{indent}difficulty: {DIFFICULTY[current_id]},\n")
            inserted += 1
        current_id = None  # only one insert per item

with open(TARGET, 'w', encoding='utf-8', newline='') as f:
    f.writelines(out)

print(f'Inserted difficulty into {inserted} items (expected 60).')
