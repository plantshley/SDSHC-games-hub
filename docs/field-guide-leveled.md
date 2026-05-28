# Field Guide — Leveled Play Reference

Practical reference for expanding existing categories or adding new ones to the
advanced-mode **Field Guide** game. The leveled design is not described in any
single place in the code — this doc consolidates the design rules, the data
shape, the photo recipe, and a step-by-step "add a category" walkthrough.

---

## What leveled play is

When the player picks **one** topic on the Field Guide intro screen, the game
plays as **4 numbered levels of rising difficulty** (most iconic items first,
most specialist items last). Each player gets the same number of questions per
level, drawn from that level's pool of items.

Two other modes share most of the same plumbing:

- **Grouped** — player picks ≥2 topics; per-topic counts are sized so the total
  lands near 30 questions and each player gets an equal share per topic.
- **All: Randomized** — pools every item across all topics, bands them by
  difficulty, and plays the same 4-level structure with cross-topic questions.

Single-topic and randomized both require **`difficulty: 1-4`** on every item.
Grouped does not (it ignores level when sizing).

---

## Per-item data shape

Defined in [src/data/content/advanced/field-guide.js](../src/data/content/advanced/field-guide.js).

```js
{
  id: 'kebab-case-slug',          // unique within the category
  subtype: 'subtype-key',         // see "Subtypes & distractors" below
  difficulty: 1,                  // 1-4 ramp (required for leveled play)
  name: 'Display Name',           // shown as the correct answer choice
  image: '/assets/field-guide/<cat>/<slug>.webp',   // OR use images: [...]
  // images: [                     // for items with multiple photos (variants)
  //   '/assets/field-guide/<cat>/<slug>.webp',
  //   '/assets/field-guide/<cat>/<slug>-2.webp',
  // ],
  clues: [
    'Clue 1 — general / functional hint.',
    'Clue 2 — visual appearance.',
    'Clue 3 — most specific identifying detail.',
  ],
  significance: 'One-sentence soil-health / conservation connection.',
}
```

`itemImages()` in [src/games/advanced/field-guide.js:49-51](../src/games/advanced/field-guide.js#L49-L51)
returns `item.images` when present, otherwise `[item.image]` — so both shapes
work transparently.

---

## Difficulty ramp principles

The ramp is a **"blended recognizability ramp"** — judge each item by how
likely a high-school or college student in South Dakota would name it on sight:

| Level | Meaning | Examples (from existing categories) |
|-------|---------|-------------------------------------|
| **1** | Iconic / everyone knows | Combine harvester, round baler, bald eagle, white-tailed deer, corn, soybeans |
| **2** | Common / slightly more specific | Row crop planter, grain cart, monarch butterfly, winter wheat |
| **3** | Needs farm or naturalist knowledge | Articulated 4WD tractor, prairie dog, cereal rye, mollisol |
| **4** | Specialist / look-alike confusable | Track tractors, painted lady butterfly, oilseed radish, caliche |

The intent is **not** "harder facts" but **less familiar items**. A
specialist tool that an FFA student would know cold is still L4 if the general
public would not recognize it.

### Pool size

Per-level pools should be **≥6 items** so 3-player games (which draw 6
questions per level) give every player equal turns. The engine tolerates
shorter pools — it just picks `min(perLevel, pool)` — but the level then runs
short and turn counts go unequal. See `questionsPerLevel(playerCount)` in
[src/games/advanced/field-guide.js](../src/games/advanced/field-guide.js):
**6 for 3 players, 4 for 1/2/4 players**.

If a topic has fewer than 6 items at some level, that's fine for now but flag
it as a candidate for new photos.

---

## Subtypes & distractors

Each item carries a **`subtype`** key. Wrong-answer choices (distractors) come
from two pools, both keyed by subtype:

1. **Other items in the same category** with matching `subtype` (their `name`s)
2. **`EXTRA_DISTRACTORS[catId][subtype]`** — extra plausible names that aren't
   real items in the game

Difficulty drives **how confusable** the distractors are — see
[src/games/advanced/field-guide.js:725-736](../src/games/advanced/field-guide.js#L725-L736):

| Difficulty | Distractor preference |
|-----------|----------------------|
| **1** | Cross-subtype first (answer stands out clearly) |
| **2** | Balanced; same-subtype first |
| **3 or 4** | Same-subtype look-alikes only (hardest) |

So subtype choice matters a lot at L3/L4: items in the same subtype will be
each other's distractors. Group **visually or functionally similar items** under
the same subtype.

### `EXTRA_DISTRACTORS` rules

- Every subtype actually used by items must have a key in
  `EXTRA_DISTRACTORS[catId]`.
- Distractor strings must **not collide with any real item's `name`** in the
  same category (the engine already dedups, but collisions waste a slot and
  signal a missing item).
- Aim for **≥5 distractor names per subtype** so the engine has options even
  when many items in that subtype have already been used in the round.

---

## Variants (multiple photos per item)

When you have several good photos of the same machine/plant/animal, list them
as variants on a single item — the engine randomly picks one per round and
tracks usage so replays show different photos before repeating:

```js
{
  id: 'combine-harvester',
  // ...
  images: [
    '/assets/field-guide/farm-equipment/combine-harvester.webp',
    '/assets/field-guide/farm-equipment/combine-harvester-2.webp',
    '/assets/field-guide/farm-equipment/combine-harvester-3.webp',
  ],
}
```

The naming convention is **`<slug>.webp`** for the primary and
**`<slug>-2.webp`, `<slug>-3.webp`, …** for additional photos.

Variant rotation is per-session, per-category: `usedImagesByCategory` (a
module-level `Set`) records every served image src. When a band's photos are
all exhausted, the band's records are freed and rotation starts over. See
`pickItems` and `pickItemsPooled` near the top of
[src/games/advanced/field-guide.js](../src/games/advanced/field-guide.js).

---

## Photo conversion recipe

Target: **960×720 WebP, center-cropped to 4:3, quality 82.** Use
[scripts/convert-farm-equipment-photos.py](../scripts/convert-farm-equipment-photos.py)
or [scripts/convert-native-plant-photos.py](../scripts/convert-native-plant-photos.py)
as templates. Both scripts share the same crop/resize logic but differ on
**EXIF orientation handling** — read this before you copy one.

### EXIF orientation: pick one and document it

- **native-plants script** calls `ImageOps.exif_transpose` to bake EXIF
  orientation into pixels before cropping. Good when source files reliably
  carry correct orientation flags (e.g., direct-from-camera shots).
- **farm-equipment script** does **not** call `exif_transpose` and only
  center-crops. Use this when sources are web downloads (no EXIF flag) or when
  a prior run produced sideways portraits — `exif_transpose` will rotate based
  on the flag, and a wrong/double-applied flag yields sideways output.

Probe the source folder first:

```python
from PIL import Image
for f in os.listdir(src):
    ex = Image.open(os.path.join(src, f)).getexif()
    if ex.get(274, 1) != 1:  # 274 = Orientation tag
        print('rotated flag:', f, ex[274])
```

If nothing prints, both approaches produce identical pixels and "don't rotate"
is the safe default.

### Mapping table

Inside the script, the `MAPPING` list pairs each source filename with its
output slug. Variants use suffixes:

```python
MAPPING = [
    ('source-filename.jpg', 'slug'),           # primary
    ('another-photo.jpg',  'slug-2'),          # variant
    # ...
]
```

### Don't wipe the output folder

The farm-equipment script intentionally does **not** delete other `.webp` files
in the output dir on re-run — original web-sourced primaries
(`combine-harvester.webp`, `grain-bin.webp`, etc.) live in the same folder and
must survive. Only files matching `MAPPING` outputs are overwritten. Keep this
behavior in any new converter.

---

## The three play modes

| Mode | Trigger | Engine path | Question count |
|------|---------|-------------|----------------|
| **Single (leveled)** | Player selects 1 topic | `pickItems(band, perLevel, cat.id)` per level | 4 × `perLevel` (16 or 24) |
| **Grouped** | Player selects 2-5 topics | `pickItems(items, perTopic, cat.id)` per topic | `perTopic × T`, sized by `groupedCount(P, T)` |
| **All: Randomized** | "All: Randomized" button | `pickItemsPooled(band, perLevel)` per level | 4 × `perLevel` (16 or 24) |

`perLevel = questionsPerLevel(P)`: **6 for P=3, else 4**.
`groupedCount(P, T) = max(P, round(30/T/P) × P)` — keeps per-topic counts
divisible by P so each player gets equal turns, while targeting ~30 questions
total.

Single mode falls back to a non-leveled single shuffled round if **no item in
the category has a `difficulty`** — so leveled play is opt-in per category by
tagging items. Every existing category is tagged.

---

## Recipe: add a new category

1. **Create the asset folder**
   `public/assets/field-guide/<cat-id>/` — drop converted WebPs here.

2. **Write a conversion script** (only if you have raw source photos)
   Copy [scripts/convert-farm-equipment-photos.py](../scripts/convert-farm-equipment-photos.py),
   change `SRC_DIR`, `OUT_DIR`, and `MAPPING`. Decide EXIF handling per the
   probe above.

3. **Add the category object** to `CATEGORIES` in
   [src/data/content/advanced/field-guide.js](../src/data/content/advanced/field-guide.js):

   ```js
   {
     id: 'cat-id',
     title: 'Display Title',
     items: [
       // ~16-30 items, each with id/subtype/difficulty/name/image(s)/clues/significance
     ],
   },
   ```

   - Aim for **≥6 items per difficulty level** (24+ items total).
   - Distribute difficulty: a rough 1/4 of items at each level works; weight
     toward L2/L3 if you have lots of mid-difficulty items.

4. **Add distractor pools** to `EXTRA_DISTRACTORS[catId]` — one key per subtype
   you used, ≥5 plausible non-item names each.

5. **Add an impact message** to `IMPACT_MESSAGES[catId]` — one-sentence
   soil-health takeaway shown at end of single-topic play.

6. **Verify**:
   ```bash
   node -e "import('./src/data/content/advanced/field-guide.js').then(m=>{
     const c = m.CATEGORIES.find(x => x.id === 'cat-id');
     const fs = require('fs');
     const refs = c.items.flatMap(i => i.images?.length ? i.images : [i.image]);
     console.log('items:', c.items.length);
     console.log('by level:', c.items.reduce((a,i)=>(a[i.difficulty]=(a[i.difficulty]||0)+1,a),{}));
     console.log('missing:', refs.filter(p => !fs.existsSync('public'+p)));
   })"
   npm run build
   ```

   Check: every level ≥6, every image resolves, every subtype has a distractor
   pool, build is clean.

---

## Recipe: tag difficulty for new items in an existing category

For one-off batch tagging, follow the pattern of
[scripts/tag-difficulty.py](../scripts/tag-difficulty.py): a Python script with
an `id → difficulty` dict that walks the content file, finds each item by id,
and inserts the `difficulty:` line right after its `subtype:` line. Idempotent
— skips items that already carry a `difficulty:` tag.

When in doubt, tag by **first reaction of an unfamiliar student**, not by
"importance" or "conservation relevance."

---

## Recipe: add variants to an existing item

1. Convert the new photos to WebP at 960×720 (same recipe as above), naming
   them `<existing-slug>-N.webp` (next available `N`).
2. In the content file, change the item's `image: '...'` to
   `images: ['...primary.webp', '...primary-2.webp', ...]`. If it already has
   an `images:` array, just append.
3. Build to verify.

Variants do **not** change difficulty — they just give the engine more photos
to rotate per item.

---

## Known gotchas

- **Engine bands by difficulty value, not by array order** — item order in the
  content file is cosmetic; reorder freely for readability.
- **Distractors are pulled at round-render time**, not at game start. So
  `state.answeredIds` excludes already-shown items, which keeps the same wrong
  answer from appearing twice in a row.
- **Subtype keys are case- and string-sensitive**. `'harvest'` and
  `'harvesting'` are different pools — don't mix.
- **Single-photo items still need `.webp`** at 960×720 even when the source is
  already small; the photo display assumes the 4:3 aspect.
- **Difficulty ratings will drift** as topics get new photos. The current
  ratings reflect today's pool; rebalance when the pool grows substantially.
