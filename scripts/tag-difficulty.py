"""
One-shot: insert `difficulty: N` into the 5 previously-untagged Field Guide topics.

SD Native Plants was already banded into 4 levels. This tags the other five
topics (12 items each) into the same 1-4 scale using a "blended recognizability
ramp" — the most iconic / commonly recognized items are Level 1, the most
specialist are Level 4 (3 items per level). Difficulty is inserted right after
each item's `subtype:` line, matching the native-plants field order.

Idempotent: skips any item that already carries a difficulty tag.
"""

import os
import re

CONTENT = os.path.join(
    os.path.dirname(__file__), '..', 'src', 'data', 'content', 'advanced', 'field-guide.js'
)

# id -> difficulty (1 = most recognizable, 4 = most specialist)
DIFFICULTY = {
    # cover-crops
    'corn': 1, 'soybeans': 1, 'sunflower': 1,
    'winter-wheat': 2, 'turnips': 2, 'winter-oats': 2,
    'cereal-rye': 3, 'crimson-clover': 3, 'field-pea': 3,
    'oilseed-radish': 4, 'hairy-vetch': 4, 'grain-sorghum': 4,
    # conservation-practices
    'crop-rotation': 1, 'windbreak': 1, 'cover-cropping': 1,
    'no-till': 2, 'terracing': 2, 'pollinator-habitat': 2,
    'contour-farming': 3, 'grassed-waterway': 3, 'wetland-restoration': 3,
    'riparian-buffer': 4, 'strip-cropping': 4, 'grazing-management': 4,
    # farm-equipment
    'combine-harvester': 1, 'grain-bin': 1, 'center-pivot': 1,
    'row-crop-planter': 2, 'grain-cart': 2, 'agricultural-drone': 2,
    'no-till-drill': 3, 'manure-spreader': 3, 'soil-sampler': 3,
    'strip-till-rig': 4, 'roller-crimper': 4, 'cover-crop-interseeder': 4,
    # sd-wildlife
    'american-bison': 1, 'white-tailed-deer': 1, 'bald-eagle': 1,
    'monarch-butterfly': 2, 'ring-necked-pheasant': 2, 'red-fox': 2,
    'prairie-dog': 3, 'western-meadowlark': 3, 'eastern-cottontail': 3,
    'pronghorn': 4, 'painted-lady': 4, 'great-plains-toad': 4,
    # soil-types
    'clay-soil': 1, 'earthworm': 1, 'gully-erosion': 1,
    'sandy-loam': 2, 'soil-horizons': 2, 'healthy-vs-degraded': 2,
    'mollisol': 3, 'prairie-roots': 3, 'mycorrhizae': 3,
    'loess': 4, 'caliche': 4, 'soil-aggregate': 4,
}

ID_RE = re.compile(r"^(\s*)id: '([a-z0-9-]+)',\s*$")
SUBTYPE_RE = re.compile(r"^(\s*)subtype: '")
DIFF_RE = re.compile(r"^\s*difficulty:")


def main():
    with open(CONTENT, encoding='utf-8') as f:
        lines = f.readlines()

    out = []
    pending = None  # (indent, difficulty, id)
    inserted = set()

    for i, line in enumerate(lines):
        m = ID_RE.match(line)
        if m and m.group(2) in DIFFICULTY and m.group(2) not in inserted:
            pending = (m.group(1), DIFFICULTY[m.group(2)], m.group(2))
            out.append(line)
            continue

        if pending and SUBTYPE_RE.match(line):
            indent, diff, item_id = pending
            out.append(line)
            # Skip if the very next line already has a difficulty (idempotency)
            nxt = lines[i + 1] if i + 1 < len(lines) else ''
            if not DIFF_RE.match(nxt):
                out.append(f"{indent}difficulty: {diff},\n")
                inserted.add(item_id)
            pending = None
            continue

        out.append(line)

    missing = set(DIFFICULTY) - inserted
    if missing:
        raise SystemExit(f'ERROR: never tagged these ids: {sorted(missing)}')

    with open(CONTENT, 'w', encoding='utf-8') as f:
        f.writelines(out)

    print(f'Tagged {len(inserted)} items with difficulty.')


if __name__ == '__main__':
    main()
