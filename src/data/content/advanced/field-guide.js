/**
 * Advanced Mode — Field Guide Content
 * Photo identification game: SD native plants, cover crops, conservation practices, farm equipment.
 * All clues sourced from USDA, NRCS, SDSU Extension, and credible agricultural references.
 */

export { PLAYER_COLORS } from './shared.js'

// ─── Categories & Items ───

export const CATEGORIES = [
  {
    id: 'native-plants',
    title: 'SD Native Plants & Trees',
    items: [
      {
        id: 'pasque-flower',
        subtype: 'flower',
        name: 'Pasque Flower',
        image: 'assets/field-guide/native-plants/pasque-flower.webp',
        clues: [
          'South Dakota\'s state flower — a purple spring wildflower.',
          'One of the first blooms of spring, often pushing through snow. Named after "Pascha" (Easter).',
          'Covered in fine silky hairs. After petals drop, feathery whisk-like seed heads form.',
        ],
        significance: 'Early-blooming natives like the Pasque Flower provide critical food for pollinators when few other flowers are available.',
      },
      {
        id: 'purple-coneflower',
        subtype: 'flower',
        name: 'Purple Coneflower',
        image: 'assets/field-guide/native-plants/purple-coneflower.webp',
        clues: [
          'A prairie wildflower with drooping pink-to-purple petals around a spiny center cone.',
          'The central cone is copper-orange and prickly to the touch. Stems are rough and stiff-haired.',
          'Echinacea angustifolia — historically used as an herbal remedy by Indigenous peoples of the Great Plains.',
        ],
        significance: 'Deep taproots improve soil structure and create channels for water infiltration. A major pollinator magnet for bees and butterflies.',
      },
      {
        id: 'black-eyed-susan',
        subtype: 'flower',
        name: 'Black-Eyed Susan',
        image: 'assets/field-guide/native-plants/black-eyed-susan.webp',
        clues: [
          'A cheerful, daisy-like wildflower with bright golden-yellow petals.',
          'The dark brown-black center dome is its most distinctive feature. Blooms June through August.',
          'Highly drought-tolerant with rough, hairy stems. Common in disturbed prairies and roadsides.',
        ],
        significance: 'Excellent pollinator plant that tolerates poor soils. Used in prairie restoration seed mixes that rebuild organic matter.',
      },
      {
        id: 'big-bluestem',
        subtype: 'grass',
        name: 'Big Bluestem',
        image: 'assets/field-guide/native-plants/big-bluestem.webp',
        clues: [
          'Called the "monarch" of the tallgrass prairie — this native grass towers 6-8 feet tall.',
          'Its most distinctive feature is a three-branched seed head that resembles a turkey\'s foot.',
          'Blue-green in spring, it shifts to reddish-bronze in fall. A warm-season clump-forming grass.',
        ],
        significance: 'Roots extend 10+ feet deep, dramatically increasing soil organic matter and carbon sequestration — an anchor for prairie soil health.',
      },
      {
        id: 'little-bluestem',
        subtype: 'grass',
        name: 'Little Bluestem',
        image: 'assets/field-guide/native-plants/little-bluestem.webp',
        clues: [
          'A shorter, more delicate native grass cousin, typically 2-4 feet tall.',
          'In fall, it transforms to brilliant copper-red with fluffy white cottony seed tufts catching the light.',
          'Spring and summer growth is powder blue at the base. One of the most common grasses on SD prairies.',
        ],
        significance: 'Deep roots build organic matter year after year. Excellent for erosion control on slopes and disturbed areas.',
      },
      {
        id: 'prairie-coneflower',
        subtype: 'flower',
        name: 'Prairie Coneflower',
        image: 'assets/field-guide/native-plants/prairie-coneflower.webp',
        clues: [
          'Also called "Mexican Hat" — its flower looks like a tiny sombrero.',
          'The central cone is unusually tall and elongated (up to 2 inches), with petals drooping below it.',
          'Extremely drought-tolerant with finely divided leaves. Blooms June through September on dry prairies.',
        ],
        significance: 'An indicator of native prairie soils. Its presence signals relatively undisturbed grassland habitat important for soil biome health.',
      },
      {
        id: 'bur-oak',
        subtype: 'tree',
        name: 'Bur Oak',
        image: 'assets/field-guide/native-plants/bur-oak.webp',
        clues: [
          'The most fire- and drought-resistant oak tree on the Great Plains.',
          'Its bark is deeply furrowed and rough. Younger branches often develop corky, wing-like ridges.',
          'Most distinctive: large acorns partially enclosed in a fringed, "burred" cap covering more than half the nut.',
        ],
        significance: 'Stabilizes streambeds and riparian areas. Leaf litter contributes heavily to forest soil organic matter over decades.',
      },
      {
        id: 'cottonwood',
        subtype: 'tree',
        name: 'Eastern Cottonwood',
        image: 'assets/field-guide/native-plants/cottonwood.webp',
        clues: [
          'South Dakota\'s state tree — a massive, fast-growing tree found along rivers and streams.',
          'Triangular (delta-shaped) leaves flutter in the slightest breeze. Bark is silvery-white when young.',
          'In early summer, female trees release enormous clouds of white cottony seed fluff.',
        ],
        significance: 'Critical riparian tree whose roots hold riverbank soil, preventing erosion. Leaf litter feeds streamside soil food webs.',
      },
      {
        id: 'ponderosa-pine',
        subtype: 'tree',
        name: 'Ponderosa Pine',
        image: 'assets/field-guide/native-plants/ponderosa-pine.webp',
        clues: [
          'The dominant tree of the Black Hills — tall, straight-trunked conifers that can exceed 100 feet.',
          'Mature bark breaks into large, orange puzzle-piece scales. Long needles grow in bundles of 2-3.',
          'Remarkable identifier: warm bark smells distinctly of vanilla or butterscotch.',
        ],
        significance: 'The most numerous tree in SD. Supports Black Hills forest soils with a distinct needle-litter soil layer.',
      },
      {
        id: 'prairie-rose',
        subtype: 'shrub',
        name: 'Prairie Rose',
        image: 'assets/field-guide/native-plants/prairie-rose.webp',
        clues: [
          'A small, shrubby wild rose found in nearly every county in South Dakota.',
          'Simple five-petaled pink flowers with a yellow center bloom May through August.',
          'Thorny stems with compound leaves. Small red rose hips persist into winter, feeding wildlife.',
        ],
        significance: 'Fixes soil on roadsides and prairie edges. Rose hips provide critical fall and winter food for birds and mammals.',
      },
      {
        id: 'switchgrass',
        subtype: 'grass',
        name: 'Switchgrass',
        image: 'assets/field-guide/native-plants/switchgrass.webp',
        clues: [
          'A tall, airy warm-season prairie grass with a wide, open seed head (panicle).',
          'A distinctive patch of white hairs marks where each leaf blade joins the stem.',
          'Blue-green summer foliage turns golden-yellow in fall. Seed head starts reddish-purple, then turns golden.',
        ],
        significance: 'Deep roots (6-11 feet) are exceptional for carbon sequestration. Used in prairie restoration and biofuel research.',
      },
    ],
  },
  {
    id: 'cover-crops',
    title: 'Cover Crops & Crop Types',
    items: [
      {
        id: 'cereal-rye',
        subtype: 'grain',
        name: 'Cereal Rye',
        image: 'assets/field-guide/cover-crops/cereal-rye.webp',
        clues: [
          'The most popular cover crop in South Dakota and the upper Midwest.',
          'Narrow, upright blue-green blades with a waxy coating form a dense, weed-smothering carpet over winter.',
          'Grows aggressively in cold weather. Has a slender wheat-like seed head and stands 3-5 feet at maturity.',
        ],
        significance: 'Prevents erosion over winter, scavenges residual nitrogen, and suppresses weeds through allelopathy. Top choice for SD\'s cold winters.',
      },
      {
        id: 'oilseed-radish',
        subtype: 'brassica',
        name: 'Oilseed Radish',
        image: 'assets/field-guide/cover-crops/oilseed-radish.webp',
        clues: [
          'Also called a "tillage radish" — this cover crop has a massive white taproot that drills into compacted soil.',
          'The thick carrot-like root (2-4 inches in diameter) often pushes visibly out of the ground.',
          'Large, coarse rosette leaves at the surface. Winterkills, leaving channels in the soil.',
        ],
        significance: '"Biodrilling" — the taproot fractures hardpan and compaction layers. Winterkill leaves channels for water infiltration and earthworm movement.',
      },
      {
        id: 'crimson-clover',
        subtype: 'legume',
        name: 'Crimson Clover',
        image: 'assets/field-guide/cover-crops/crimson-clover.webp',
        clues: [
          'The most visually striking cover crop — when it blooms, entire fields glow brilliant red.',
          'Elongated cone-shaped flower heads up to 2 inches long in deep crimson/scarlet.',
          'A winter annual legume with typical trifoliate (3-leaf) clover leaves and fine hairs on stems.',
        ],
        significance: 'A nitrogen factory: fixes 60-200 lbs of atmospheric nitrogen per acre for the next cash crop. Also feeds pollinators.',
      },
      {
        id: 'hairy-vetch',
        subtype: 'legume',
        name: 'Hairy Vetch',
        image: 'assets/field-guide/cover-crops/hairy-vetch.webp',
        clues: [
          'A vining legume that sprawls and climbs, creating a tangled mat 3-4 feet tall.',
          'Compound leaves with many small leaflets in opposite pairs, plus coiling tendrils at the tips.',
          'Small purple-and-white pea-like flowers. Hairy stems (hence the name). Often mixed with cereal rye.',
        ],
        significance: 'One of the highest nitrogen-fixing cover crops — up to 250 lbs N per acre. Thick mulch layer suppresses weeds after termination.',
      },
      {
        id: 'winter-oats',
        subtype: 'grain',
        name: 'Winter Oats',
        image: 'assets/field-guide/cover-crops/winter-oats.webp',
        clues: [
          'Resembles wheat or rye but with broader, smoother leaf blades.',
          'Distinctive open, drooping seed head (panicle) — not a tight spike like wheat.',
          'In SD, planted as a fall cover crop that winterkills naturally, leaving standing residue.',
        ],
        significance: 'Quick biomass production and nitrogen scavenging. Winterkills without herbicide termination needed — easy residue management.',
      },
      {
        id: 'turnips',
        subtype: 'brassica',
        name: 'Turnips',
        image: 'assets/field-guide/cover-crops/turnips.webp',
        clues: [
          'A brassica cover crop with a round purple-and-white bulb sitting at the soil surface.',
          'Large, coarse blue-green lobed leaves form a rosette above the bulb.',
          'Related to radishes but with a rounder, shallower root. Fields often smell of sulfur (brassica family).',
        ],
        significance: 'Moderate compaction relief plus excellent fall cattle forage (dual-purpose cover crop). Brassica family members reduce certain soil pathogens.',
      },
      {
        id: 'corn',
        subtype: 'grain',
        name: 'Corn',
        image: 'assets/field-guide/cover-crops/corn.webp',
        clues: [
          'South Dakota\'s top commodity crop — one of the most recognizable crops in the field.',
          'Wide, sword-shaped leaves alternate along a thick central stalk. Male tassel forms at the very top.',
          'Female silks (light green to reddish strands) emerge from ear husks partway up the stalk.',
        ],
        significance: 'Leaves heavy residue that protects soil over winter. Pairing corn with cover crops is key to maintaining soil organic matter.',
      },
      {
        id: 'soybeans',
        subtype: 'legume',
        name: 'Soybeans',
        image: 'assets/field-guide/cover-crops/soybeans.webp',
        clues: [
          'SD\'s second-largest crop. Compact, bushy plants 2-4 feet tall.',
          'Each leaf has exactly three rounded leaflets with pointed tips (trifoliate).',
          'Fuzzy bean-shaped pods cluster along every stem. Fields turn golden-yellow all at once before harvest.',
        ],
        significance: 'Nitrogen-fixing legume — roots host rhizobia bacteria that add 40-100 lbs N per acre back to soil when rotated.',
      },
      {
        id: 'winter-wheat',
        subtype: 'grain',
        name: 'Winter Wheat',
        image: 'assets/field-guide/cover-crops/winter-wheat.webp',
        clues: [
          'Planted in fall, overwinters as a low green carpet, then bolts upright in spring.',
          'Tight, compact grain heads with short "beards" (awns) on each kernel.',
          'By July, entire fields turn golden-bronze simultaneously — a dramatic landscape transformation.',
        ],
        significance: 'Ground cover over winter prevents erosion. Straw residue after harvest protects soil. Crop rotations with wheat break disease cycles.',
      },
      {
        id: 'sunflower',
        subtype: 'oilseed',
        name: 'Sunflower',
        image: 'assets/field-guide/cover-crops/sunflower.webp',
        clues: [
          'South Dakota ranks in the top 2 states nationally for production of this crop.',
          'Unmistakable: a single massive flower head (4-12 inches across) atop a stout, rough, hairy stalk.',
          'Heads track the sun (heliotropism) when young, then face east at maturity. Grows 5-12 feet tall.',
        ],
        significance: 'Deep taproots break compaction. Excellent for pollinators. Seed head residue provides critical winter wildlife habitat.',
      },
      {
        id: 'grain-sorghum',
        subtype: 'grain',
        name: 'Grain Sorghum',
        image: 'assets/field-guide/cover-crops/grain-sorghum.webp',
        clues: [
          'Looks like a shorter, stouter version of corn — but without ears on the stalk.',
          'Grain forms in a large, bushy, upright head (panicle) at the very top of the plant.',
          'Stalks and leaves have a waxy, whitish coating. Extraordinarily drought-tolerant.',
        ],
        significance: 'Excellent drought crop for western SD. Heavy residue reduces need for irrigation that can cause soil salinization.',
      },
    ],
  },
  {
    id: 'conservation-practices',
    title: 'Conservation Practices',
    items: [
      {
        id: 'no-till',
        subtype: 'field-management',
        name: 'No-Till Farming',
        image: 'assets/field-guide/conservation-practices/no-till-farming.webp',
        clues: [
          'This field has never been plowed — the surface is covered with last year\'s crop residue.',
          'Seeds are planted directly through the residue mat with a specialized drill. The soil surface is undisturbed.',
          'Visible old stalks and straw between new crop rows. Soil is often darker and richer when the residue is parted.',
        ],
        significance: 'Eliminates tillage-caused erosion, preserves soil structure and earthworm habitat, and can reduce soil erosion by 90%.',
      },
      {
        id: 'contour-farming',
        subtype: 'field-management',
        name: 'Contour Farming',
        image: 'assets/field-guide/conservation-practices/contour-farming.webp',
        clues: [
          'Crop rows curve in graceful parallel lines following the natural elevation of a hillside.',
          'From above, the field looks like a fingerprint — rows run across the slope, not up and down.',
          'Most effective on 2-10% slopes. Each curved row acts as a small dam trapping water and sediment.',
        ],
        significance: 'Slows water runoff velocity and traps sediment. Can reduce soil erosion by 50% compared to farming straight up and down the slope.',
      },
      {
        id: 'terracing',
        subtype: 'water-management',
        name: 'Terracing',
        image: 'assets/field-guide/conservation-practices/terracing.webp',
        clues: [
          'Step-like earthen platforms cut into steep hillsides to create level planting areas.',
          'Distinct flat benches separated by steep banks — a staircase carved into the landscape.',
          'Often paired with grassed waterways at terrace outlets. Aerial view shows parallel horizontal lines across rolling hills.',
        ],
        significance: 'Interrupts long slopes that generate destructive runoff. Traps water to infiltrate and prevents gully formation on steep land.',
      },
      {
        id: 'grassed-waterway',
        subtype: 'water-management',
        name: 'Grassed Waterway',
        image: 'assets/field-guide/conservation-practices/grassed-waterway.webp',
        clues: [
          'A broad, shallow, grass-lined channel running through farm cropland.',
          'Intentionally shaped to funnel runoff safely without causing erosion. Permanently kept in grass.',
          'Typically 30-100+ feet wide. Often planted with smooth brome or bluegrass. Like a green highway through the field.',
        ],
        significance: 'Safely conveys concentrated runoff without gully formation. The grass filters sediment and nutrients before they reach waterways.',
      },
      {
        id: 'riparian-buffer',
        subtype: 'vegetation-based',
        name: 'Riparian Buffer',
        image: 'assets/field-guide/conservation-practices/riparian-buffer.webp',
        clues: [
          'A strip of permanent vegetation planted between a farm field and a waterway.',
          'Multi-layer design: trees nearest the water, shrubs in the middle, grasses at the field edge.',
          'From above, it looks like a green ribbon running alongside a stream or river.',
        ],
        significance: 'Intercepts nutrient runoff and sediment before reaching waterways. Tree roots stabilize streambanks and reduce flooding impacts.',
      },
      {
        id: 'windbreak',
        subtype: 'vegetation-based',
        name: 'Windbreak',
        image: 'assets/field-guide/conservation-practices/windbreak.webp',
        clues: [
          'Rows of trees and shrubs planted in a line along field edges to slow the wind.',
          'Typically 3-8 rows wide: shorter shrubs on the outside, taller trees in the center.',
          'Often include evergreens (pines, cedars) for year-round protection. Can extend for miles on the Great Plains.',
        ],
        significance: 'Dramatically reduces wind erosion — the primary erosion type in western SD. Also reduces soil moisture loss and provides carbon from leaf litter.',
      },
      {
        id: 'cover-cropping',
        subtype: 'field-management',
        name: 'Cover Cropping',
        image: 'assets/field-guide/conservation-practices/cover-cropping.webp',
        clues: [
          'After cash crop harvest, this field stays green while neighboring conventional fields are bare brown stubble.',
          'Growing plants visible in a harvested field during fall or winter — a striking contrast with bare neighbors.',
          'May show diverse species mixed together: grasses, legumes, brassicas. Radish bulbs sometimes visible at the soil surface.',
        ],
        significance: 'Keeps living roots in the soil year-round, prevents erosion during the post-harvest window, and feeds soil biology through root exudates.',
      },
      {
        id: 'strip-cropping',
        subtype: 'field-management',
        name: 'Strip Cropping',
        image: 'assets/field-guide/conservation-practices/strip-cropping.webp',
        clues: [
          'Alternating strips of row crops and close-growing grasses run across a hillside.',
          'From above, the field has alternating green-and-brown horizontal bands — a pinstripe pattern.',
          'Often combined with contour farming. The grass strips catch sediment washing off the crop strips.',
        ],
        significance: 'Close-growing strips act as living filter strips, catching sediment and reducing runoff velocity between the row crop strips.',
      },
    ],
  },
  {
    id: 'farm-equipment',
    title: 'Farm Equipment',
    items: [
      {
        id: 'row-crop-planter',
        subtype: 'planting',
        name: 'Row Crop Planter',
        image: 'assets/field-guide/farm-equipment/row-crop-planter.webp',
        clues: [
          'This machine plants corn and soybeans at precise spacing and depth.',
          'A long horizontal toolbar with individual planting units hanging down — each unit plants one row.',
          'Modern versions cover 12, 16, 24, or even 48 rows at once. Folds up for road transport.',
        ],
        significance: 'Precision depth control ensures good germination with minimal soil disturbance. Can be configured for no-till planting.',
      },
      {
        id: 'no-till-drill',
        subtype: 'planting',
        name: 'No-Till Drill',
        image: 'assets/field-guide/farm-equipment/no-till-drill.webp',
        clues: [
          'A wide, low box on wheels that plants small grains and cover crops into un-tilled soil.',
          'Multiple disk or coulter openers along the front slice through residue to deposit seed.',
          'Press wheels behind each opener firm the seed slot. Typically 7-20 feet wide. Pulled by a tractor.',
        ],
        significance: 'The defining piece of no-till equipment. Eliminates soil disturbance while establishing crops and cover crops into standing residue.',
      },
      {
        id: 'combine-harvester',
        subtype: 'harvesting',
        name: 'Combine Harvester',
        image: 'assets/field-guide/farm-equipment/combine-harvester.webp',
        clues: [
          'The largest single machine in a harvest-season field — it cuts, threshes, and separates grain in one pass.',
          'Wide cutting header on the front (sometimes 40+ feet). Large grain tank on top.',
          'Straw and chaff blow from the rear. Unloading auger extends to the side to fill grain carts on the go.',
        ],
        significance: 'Residue management settings affect next season\'s soil cover. Spreading residue evenly protects soil from raindrop impact and erosion.',
      },
      {
        id: 'grain-cart',
        subtype: 'harvesting',
        name: 'Grain Cart',
        image: 'assets/field-guide/farm-equipment/grain-cart.webp',
        clues: [
          'A large wagon with a built-in auger, pulled by a tractor alongside a harvesting combine.',
          'The combine fills it on-the-go through a side-discharge auger while both machines keep moving.',
          'V-shaped or rectangular body with high sides. Prominent curved auger tube folds up for unloading.',
        ],
        significance: '"On-the-go" unloading keeps the combine moving and reduces heavy truck traffic in the field, minimizing soil compaction.',
      },
      {
        id: 'strip-till-rig',
        subtype: 'tillage',
        name: 'Strip-Till Rig',
        image: 'assets/field-guide/farm-equipment/strip-till-rig.webp',
        clues: [
          'A toolbar with individual shank units spaced at row width, pulled by a tractor.',
          'Each shank tills a narrow 8-10 inch band while leaving everything between rows completely undisturbed.',
          'Result in the field: alternating tilled strips and untouched residue-covered middles.',
        ],
        significance: 'Limits soil disturbance to only 20-30% of the field surface. Protects between-row soil while creating a warm, loose seedbed.',
      },
      {
        id: 'roller-crimper',
        subtype: 'specialty',
        name: 'Roller Crimper',
        image: 'assets/field-guide/farm-equipment/roller-crimper.webp',
        clues: [
          'A heavy steel drum with dull, blunt blades welded in a chevron (V-pattern) across its surface.',
          'Rolled over standing cover crops to flatten and crimp them — killing the cover crop mechanically.',
          'Creates a thick mulch mat without herbicides or tillage. Can be front- or rear-mounted on a tractor.',
        ],
        significance: 'Eliminates herbicide use for cover crop termination. The mulch mat suppresses weeds, protects soil, and feeds soil biology as it decomposes.',
      },
      {
        id: 'cover-crop-interseeder',
        subtype: 'planting',
        name: 'Cover Crop Interseeder',
        image: 'assets/field-guide/farm-equipment/cover-crop-interseeder.webp',
        clues: [
          'A tall, high-clearance machine that drives over standing corn or soybeans mid-season.',
          'Looks like a sprayer on stilts — 5-8 feet of ground clearance. Carries seed instead of liquid.',
          'Wide boom with drop tubes broadcasts cover crop seed while the cash crop is still growing.',
        ],
        significance: 'Gives cover crops a head start — they\'re already established at cash crop harvest, reducing bare soil time to near zero.',
      },
      {
        id: 'agricultural-drone',
        subtype: 'specialty',
        name: 'Agricultural Drone',
        image: 'assets/field-guide/farm-equipment/agricultural-drone.webp',
        clues: [
          'A large multi-rotor aircraft (6-12 rotors) with a seed hopper mounted underneath.',
          'Used to aerial-seed cover crops into standing crops or areas too wet for ground equipment.',
          'Operated remotely with GPS autopilot. Seeds broadcast in a fan pattern below the rotors.',
        ],
        significance: 'Zero soil compaction and reaches inaccessible areas. Enables cover crop establishment in challenging terrain without heavy equipment.',
      },
    ],
  },
]

// ─── Extra Distractor Names (same-category items NOT featured as questions) ───

export const EXTRA_DISTRACTORS = {
  'native-plants': {
    flower: ['Wild Bergamot', 'Goldenrod', 'Prairie Smoke', 'Blazing Star', 'Prairie Clover', 'Milkweed', 'Blanket Flower', 'Spiderwort', 'Harebell'],
    grass: ['Blue Grama Grass', 'Indian Grass', 'Side-Oats Grama', 'Buffalo Grass', 'Prairie Dropseed', 'Needle-and-Thread Grass', 'Western Wheatgrass'],
    tree: ['American Elm', 'Green Ash', 'Chokecherry', 'Wild Plum', 'Paper Birch', 'Hackberry', 'Box Elder', 'Red Cedar'],
    shrub: ['Leadplant', 'Silver Buffaloberry', 'Western Snowberry', 'Smooth Sumac', 'Skunkbush Sumac'],
  },
  'cover-crops': {
    legume: ['Austrian Winter Pea', 'Red Clover', 'Sweet Clover', 'Cowpea', 'Sunn Hemp', 'Field Pea', 'Alfalfa', 'Dry Edible Bean', 'Lentil'],
    grain: ['Barley', 'Pearl Millet', 'Annual Ryegrass', 'Triticale', 'Proso Millet', 'Oat'],
    oilseed: ['Safflower', 'Canola', 'Flax', 'Camelina', 'Mustard'],
    brassica: ['Kale', 'Ethiopian Cabbage', 'Forage Radish', 'Rape'],
    broadleaf: ['Buckwheat', 'Phacelia', 'Chicory'],
  },
  'conservation-practices': {
    'field-management': ['Crop Rotation', 'Mulching', 'Residue Management', 'Nutrient Management Plan', 'Integrated Pest Management'],
    'water-management': ['Water & Sediment Control Basin', 'Grade Stabilization Structure', 'Wetland Restoration', 'Drainage Water Management'],
    'vegetation-based': ['Prescribed Grazing', 'Pollinator Habitat', 'Prairie Restoration', 'Alley Cropping'],
  },
  'farm-equipment': {
    planting: ['Air Seeder', 'Seed Tender', 'Broadcast Spreader', 'Precision Planter'],
    tillage: ['Chisel Plow', 'Disc Harrow', 'Subsoiler', 'Field Cultivator', 'Moldboard Plow'],
    harvesting: ['Bale Wrapper', 'Rotary Mower', 'Swather', 'Forage Harvester'],
    specialty: ['Land Leveler', 'Fertigation System', 'Pivot Irrigator', 'Manure Spreader', 'Yield Monitor'],
  },
}

// ─── Instructions ───

export const INSTRUCTIONS = {
  intro: 'Identify South Dakota native plants, cover crops, conservation practices, and farm equipment from photos. Use fewer clues for more points!',
  completion: 'Great field knowledge! You can identify soil health champions out in the real world.',
}

// ─── Rules ───

export const RULES = [
  'A photo is shown — identify what\'s in it!',
  'You start with 400 points. Tap "Show Clue" to reveal hints (\u2212100 pts each).',
  'Each clue narrows it down. Fewer clues = more points.',
  'Tap one of four answer choices to guess.',
  'Correct answers earn points based on clues used (400 / 300 / 200 / 100 pts).',
  'Wrong answers earn 0 points. The correct answer is shown.',
  'After completing a category, a brief soil health fact is revealed.',
  'Player with the most points wins!',
]

// ─── Impact Messages (per category) ───

export const IMPACT_MESSAGES = {
  'native-plants': 'South Dakota\'s native prairie plants have root systems extending 6-10 feet deep, building organic matter and preventing erosion for thousands of years. Protecting native prairies is one of the most effective ways to preserve soil health.',
  'cover-crops': 'Cover crops can reduce soil erosion by up to 90% and add organic matter each year. In South Dakota, cereal rye is the most popular cover crop due to its exceptional winter hardiness and weed-suppressing properties.',
  'conservation-practices': 'Farmers using no-till with cover crops report 20-50% less fuel usage, improved water-holding capacity, and healthier soil biology within 3-5 years of adoption.',
  'farm-equipment': 'Modern precision agriculture equipment like no-till drills, roller crimpers, and interseeders allows farmers to protect soil structure while maintaining profitable crop production.',
}
