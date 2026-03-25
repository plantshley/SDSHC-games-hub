/**
 * Advanced Mode — Conservation Connections Content
 * NYT Connections-style grouping game: sort 16 tiles into 4 hidden groups.
 * All content sourced from USDA, NRCS, SDSU Extension, and credible agricultural references.
 */

export { PLAYER_COLORS } from './shared.js'

// ─── Difficulty Colors ───

export const DIFFICULTY_COLORS = {
  1: '#b8e84a',  // yellow-green (easiest)
  2: '#38cebc',  // teal
  3: '#9973ff',  // purple
  4: '#ff71ce',  // pink (hardest)
}

export const DIFFICULTY_LABELS = {
  1: 'Straightforward',
  2: 'Moderate',
  3: 'Tricky',
  4: 'Devious',
}

// ─── Puzzles (10 total) ───

export const PUZZLES = [
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    groups: [
      {
        category: 'Nitrogen Cycle Processes',
        difficulty: 1,
        items: ['Fixation', 'Nitrification', 'Denitrification', 'Volatilization'],
      },
      {
        category: 'Soil Texture Classes',
        difficulty: 2,
        items: ['Sandy Loam', 'Silty Clay', 'Loam', 'Clay Loam'],
      },
      {
        category: 'Conservation Practices',
        difficulty: 3,
        items: ['No-Till', 'Contour Farming', 'Terracing', 'Strip Cropping'],
      },
      {
        category: 'Soil Organisms',
        difficulty: 4,
        items: ['Rhizobium', 'Mycorrhizae', 'Protozoa', 'Springtail'],
      },
    ],
  },
  {
    id: 'soil-properties',
    title: 'Soil Properties',
    groups: [
      {
        category: 'Soil Horizons',
        difficulty: 1,
        items: ['O Horizon', 'A Horizon', 'B Horizon', 'C Horizon'],
      },
      {
        category: 'Soil Structure Types',
        difficulty: 2,
        items: ['Granular', 'Blocky', 'Platy', 'Prismatic'],
      },
      {
        category: 'What Soil Color Indicates',
        difficulty: 3,
        items: ['Dark = Organic Matter', 'Red = Iron Oxide', 'Gray = Waterlogged', 'White = Salts'],
      },
      {
        category: 'Measured with Instruments',
        difficulty: 4,
        items: ['Bulk Density', 'pH', 'Electrical Conductivity', 'Infiltration Rate'],
      },
    ],
  },
  {
    id: 'living-soil',
    title: 'Living Soil',
    groups: [
      {
        category: 'Decomposers',
        difficulty: 1,
        items: ['Earthworm', 'Fungi', 'Bacteria', 'Millipede'],
      },
      {
        category: 'Soil Predators',
        difficulty: 2,
        items: ['Nematode', 'Centipede', 'Ground Beetle', 'Spider Mite'],
      },
      {
        category: 'Symbiotic Relationships',
        difficulty: 3,
        items: ['Mycorrhizal Network', 'Root Nodules', 'Lichen', 'Actinomycetes'],
      },
      {
        category: 'Products of Soil Biology',
        difficulty: 4,
        items: ['Glomalin', 'Humic Acid', 'Aggregate', 'Root Exudate'],
      },
    ],
  },
  {
    id: 'nutrient-management',
    title: 'Nutrient Management',
    groups: [
      {
        category: 'Macronutrients (N-P-K-S)',
        difficulty: 1,
        items: ['Nitrogen', 'Phosphorus', 'Potassium', 'Sulfur'],
      },
      {
        category: 'Forms of Nitrogen in Soil',
        difficulty: 2,
        items: ['Ammonium', 'Nitrate', 'Nitrite', 'Urea'],
      },
      {
        category: 'Causes of Nutrient Loss',
        difficulty: 3,
        items: ['Leaching', 'Surface Runoff', 'Tile Drainage', 'Crop Removal'],
      },
      {
        category: 'Nutrient Assessment Tools',
        difficulty: 4,
        items: ['Soil Test', 'Tissue Test', 'EC Meter', 'Chlorophyll Meter'],
      },
    ],
  },
  {
    id: 'water-erosion',
    title: 'Water & Erosion',
    groups: [
      {
        category: 'Types of Erosion',
        difficulty: 1,
        items: ['Sheet', 'Rill', 'Gully', 'Wind'],
      },
      {
        category: 'Erosion-Reducing Practices',
        difficulty: 2,
        items: ['Terraces', 'Windbreaks', 'Grassed Waterways', 'Prairie Strips'],
      },
      {
        category: 'Water Movement Terms',
        difficulty: 3,
        items: ['Infiltration', 'Percolation', 'Runoff', 'Evapotranspiration'],
      },
      {
        category: 'Harmed by Soil Compaction',
        difficulty: 4,
        items: ['Porosity', 'Aeration', 'Root Growth', 'Water Holding Capacity'],
      },
    ],
  },
  {
    id: 'cover-crops',
    title: 'Cover Crops',
    groups: [
      {
        category: 'Legume Cover Crops',
        difficulty: 1,
        items: ['Crimson Clover', 'Hairy Vetch', 'Field Pea', 'Cowpea'],
      },
      {
        category: 'Grass Cover Crops',
        difficulty: 2,
        items: ['Cereal Rye', 'Annual Ryegrass', 'Oats', 'Sorghum-Sudan'],
      },
      {
        category: 'Brassica Cover Crops',
        difficulty: 3,
        items: ['Daikon Radish', 'Turnip', 'Rapeseed', 'Mustard'],
      },
      {
        category: 'Benefits of Cover Crops',
        difficulty: 4,
        items: ['Nitrogen Fixation', 'Weed Suppression', 'Erosion Control', 'Compaction Relief'],
      },
    ],
  },
  {
    id: 'soil-chemistry',
    title: 'Soil Chemistry',
    groups: [
      {
        category: 'Cation Exchange Ions',
        difficulty: 1,
        items: ['Calcium', 'Magnesium', 'Hydrogen', 'Sodium'],
      },
      {
        category: 'Organic Matter Components',
        difficulty: 2,
        items: ['Humus', 'Fresh Residue', 'Living Organisms', 'Root Exudates'],
      },
      {
        category: 'pH Adjustment Materials',
        difficulty: 3,
        items: ['Agricultural Lime', 'Elemental Sulfur', 'Gypsum', 'Wood Ash'],
      },
      {
        category: 'Signs of Problem Soils',
        difficulty: 4,
        items: ['White Crust', 'Rotten Egg Smell', 'Blue-Gray Color', 'Surface Sealing'],
      },
    ],
  },
  {
    id: 'traditional-ag',
    title: 'Traditional Agriculture',
    groups: [
      {
        category: 'Three Sisters Crops',
        difficulty: 1,
        items: ['Maize', 'Beans', 'Squash', 'Sunflower'],
      },
      {
        category: 'Ancient Farming Systems',
        difficulty: 2,
        items: ['Chinampas', 'Terrace Farming', 'Zai Pits', 'Paddy Rice'],
      },
      {
        category: 'Traditional Soil Amendments',
        difficulty: 3,
        items: ['Biochar', 'Bone Meal', 'Manure', 'Wood Ash'],
      },
      {
        category: 'Regions Known for Farming Innovation',
        difficulty: 4,
        items: ['Fertile Crescent', 'Andes Mountains', 'Nile River Valley', 'Mesoamerica'],
      },
    ],
  },
  {
    id: 'sd-agriculture',
    title: 'SD Agriculture',
    groups: [
      {
        category: 'Major SD Cash Crops',
        difficulty: 1,
        items: ['Corn', 'Soybeans', 'Wheat', 'Hay'],
      },
      {
        category: 'SD Soil Orders',
        difficulty: 2,
        items: ['Mollisols', 'Aridisols', 'Entisols', 'Alfisols'],
      },
      {
        category: 'SD Conservation Challenges',
        difficulty: 3,
        items: ['Wind Erosion', 'Drought', 'Salinity', 'Grassland Conversion'],
      },
      {
        category: 'SD Soil Health Practices',
        difficulty: 4,
        items: ['Diverse Rotations', 'Managed Grazing', 'Perennial Cover', 'Reduced Tillage'],
      },
    ],
  },
  {
    id: 'climate-carbon',
    title: 'Climate & Carbon',
    groups: [
      {
        category: 'Greenhouse Gases from Soil',
        difficulty: 1,
        items: ['Carbon Dioxide', 'Methane', 'Nitrous Oxide', 'Water Vapor'],
      },
      {
        category: 'Carbon Sequestration Practices',
        difficulty: 2,
        items: ['No-Till Farming', 'Perennial Grasses', 'Agroforestry', 'Biochar Application'],
      },
      {
        category: 'Climate Effects on Soil',
        difficulty: 3,
        items: ['Faster Decomposition', 'Increased Erosion', 'Salinization', 'Permafrost Thaw'],
      },
      {
        category: 'Carbon Cycle Processes',
        difficulty: 4,
        items: ['Photosynthesis', 'Respiration', 'Decomposition', 'Humification'],
      },
    ],
  },
]

// ─── Instructions ───

export const INSTRUCTIONS = {
  intro: 'Sort 16 soil science tiles into 4 hidden groups. Tap 4 tiles you think belong together and submit. But watch out — some tiles could fit more than one group!',
  completion: 'Excellent connection-making! You\'ve shown deep knowledge of how soil science concepts relate to each other.',
}

// ─── Rules ───

export const RULES = [
  'Find 4 groups of 4 related tiles from the 16 on the board.',
  'Tap 4 tiles to select them, then tap Submit.',
  'Correct groups are revealed with their category name.',
  'You have 4 lives per round — each wrong guess costs one.',
  'If you\'re "one away" (3 of 4 correct), you\'ll get a hint.',
  'Points = group difficulty × solve order (earlier finds earn more!).',
  'The last group standing is a freebie — 0 points.',
  '30-second timer per turn — running out costs a life.',
  'In multiplayer, turns alternate after each guess.',
]

// ─── Impact Messages (per puzzle topic) ───

export const IMPACT_MESSAGES = {
  'fundamentals': 'Understanding soil fundamentals — texture, biology, nutrients, and conservation — is the foundation of every good land management decision.',
  'soil-properties': 'Reading soil profiles is like reading a history book. Each horizon, color, and structure type tells the story of how that soil formed and how healthy it is.',
  'living-soil': 'A single teaspoon of healthy soil contains more organisms than there are people on Earth. This invisible ecosystem drives nutrient cycling, disease suppression, and plant growth.',
  'nutrient-management': 'Precision nutrient management prevents both crop deficiency and environmental pollution. Soil testing is the single most cost-effective tool a farmer can use.',
  'water-erosion': 'It takes nature 500-1,000 years to form one inch of topsoil, but a single heavy rainstorm can wash away that same inch from unprotected fields.',
  'cover-crops': 'Cover crop cocktail mixes — combining legumes, grasses, and brassicas — mimic native prairie diversity and provide multiple soil health benefits simultaneously.',
  'traditional-ag': 'Indigenous farming systems sustained civilizations for millennia by working with natural soil processes. Modern regenerative agriculture draws heavily on these time-tested principles.',
  'soil-chemistry': 'Soil chemistry governs which nutrients are available to plants. A pH shift of just one unit changes nutrient availability dramatically — the difference between a thriving crop and a struggling one.',
  'sd-agriculture': 'South Dakota\'s Mollisol soils are among the most fertile on Earth — built by 10,000+ years of prairie grass roots. Conservation practices ensure these soils remain productive for future generations.',
  'climate-carbon': 'Agricultural soils hold more carbon than the atmosphere and all plant life combined. How we manage farmland is one of the most powerful levers for addressing climate change.',
}
