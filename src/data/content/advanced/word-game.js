/**
 * Word Game (Wheel of Fortune style) — Content Data
 * Soil science terms with category hints.
 * Sources: USDA PDF + upgraded kid content + credible web sources.
 */

export const WORDS = [
  // Nitrogen Cycle
  { term: 'DENITRIFICATION', category: 'Nitrogen Cycle', hint: 'Converts nitrate back to atmospheric gas under anaerobic conditions' },
  { term: 'NITRIFICATION', category: 'Nitrogen Cycle', hint: 'Two-step microbial oxidation of ammonium to nitrate' },
  { term: 'VOLATILIZATION', category: 'Nitrogen Cycle', hint: 'Loss of nitrogen as ammonia gas from soil surface' },
  { term: 'MINERALIZATION', category: 'Nitrogen Cycle', hint: 'Conversion of organic nitrogen to plant-available inorganic forms' },
  { term: 'IMMOBILIZATION', category: 'Nitrogen Cycle', hint: 'Microbes consume inorganic nitrogen, making it temporarily unavailable' },
  { term: 'NITROGENASE', category: 'Nitrogen Cycle', hint: 'Enzyme that catalyzes biological nitrogen fixation' },
  { term: 'RHIZOBIUM', category: 'Nitrogen Cycle', hint: 'Bacteria in legume root nodules that fix atmospheric nitrogen' },
  { term: 'AMMONIUM', category: 'Nitrogen Cycle', hint: 'Positively charged nitrogen form held by soil particles (NH₄⁺)' },

  // Soil Biology
  { term: 'MYCORRHIZAE', category: 'Soil Biology', hint: 'Symbiotic fungi that enhance plant phosphorus uptake' },
  { term: 'GLOMALIN', category: 'Soil Biology', hint: 'Glycoprotein from mycorrhizal fungi that binds soil aggregates' },
  { term: 'NEMATODE', category: 'Soil Biology', hint: 'Microscopic non-segmented worm-like soil organisms' },
  { term: 'PROTOZOA', category: 'Soil Biology', hint: 'Single-celled organisms that feed on bacteria in soil water films' },
  { term: 'SPRINGTAIL', category: 'Soil Biology', hint: 'Six-legged soil arthropod with a tail-like jumping structure' },
  { term: 'DECOMPOSITION', category: 'Soil Biology', hint: 'Biological breakdown of organic matter into simpler compounds' },

  // Soil Properties
  { term: 'AGGREGATION', category: 'Soil Properties', hint: 'The binding of soil particles into structural units' },
  { term: 'BULK DENSITY', category: 'Soil Properties', hint: 'Mass of dry soil per unit volume, indicates compaction' },
  { term: 'POROSITY', category: 'Soil Properties', hint: 'The proportion of soil volume occupied by pore spaces' },
  { term: 'INFILTRATION', category: 'Soil Properties', hint: 'Rate at which water enters the soil surface' },
  { term: 'PERMEABILITY', category: 'Soil Properties', hint: 'How easily water moves through the soil profile' },
  { term: 'CATION EXCHANGE', category: 'Soil Properties', hint: 'The swapping of positively charged ions between soil and solution' },
  { term: 'HORIZON', category: 'Soil Properties', hint: 'A distinct layer in a soil profile with unique characteristics' },

  // Conservation
  { term: 'COVER CROP', category: 'Conservation', hint: 'Plants grown between cash crop seasons to protect and improve soil' },
  { term: 'NO TILL', category: 'Conservation', hint: 'Planting directly into undisturbed soil to preserve structure' },
  { term: 'CROP ROTATION', category: 'Conservation', hint: 'Alternating different crops to break pest cycles and vary nutrient demands' },
  { term: 'CONTOUR FARMING', category: 'Conservation', hint: 'Plowing across a slope to reduce water runoff and erosion' },
  { term: 'RIPARIAN BUFFER', category: 'Conservation', hint: 'Vegetation strips along waterways that filter runoff' },
  { term: 'PRAIRIE STRIP', category: 'Conservation', hint: 'Native perennial bands within crop fields reducing sediment by 90%+' },

  // pH & Nutrients
  { term: 'EUTROPHICATION', category: 'pH & Nutrients', hint: 'Nutrient enrichment of water causing algal blooms and oxygen depletion' },
  { term: 'SALINIZATION', category: 'pH & Nutrients', hint: 'Accumulation of soluble salts in soil, often from irrigation' },
  { term: 'LIMING', category: 'pH & Nutrients', hint: 'Applying calcium carbonate to raise acidic soil pH' },
  { term: 'PHOSPHORUS', category: 'pH & Nutrients', hint: 'Essential nutrient for ATP and DNA with no atmospheric cycle' },
  { term: 'CONDUCTIVITY', category: 'pH & Nutrients', hint: 'Electrical measurement indicating soluble salt concentration in soil' },

  // Indigenous & Culture
  { term: 'CHINAMPA', category: 'Indigenous Farming', hint: 'Aztec raised garden built on shallow lake beds' },
  { term: 'TERRA PRETA', category: 'Indigenous Farming', hint: 'Ancient Amazonian dark earth enriched with charcoal and bone' },
  { term: 'MILPA', category: 'Indigenous Farming', hint: 'Mesoamerican corn-bean-squash intercropping system' },
  { term: 'POLYCULTURE', category: 'Indigenous Farming', hint: 'Growing multiple crop species together, mimicking natural diversity' },
  { term: 'BIOCHAR', category: 'Indigenous Farming', hint: 'Charcoal added to soil that improves fertility for centuries' },

  // Organic Matter
  { term: 'HUMUS', category: 'Organic Matter', hint: 'Stable, well-decomposed organic material that persists for centuries' },
  { term: 'CARBON SEQUESTRATION', category: 'Organic Matter', hint: 'The process of capturing and storing atmospheric CO₂ in soil' },
  { term: 'RESIDUE', category: 'Organic Matter', hint: 'Plant material left on the field after harvest' },
  { term: 'RESPIRATION', category: 'Organic Matter', hint: 'Microbial process releasing CO₂ as organic matter decomposes' },
]

export const MAX_WRONG = 6

export { PLAYER_COLORS } from './shared.js'

export const INSTRUCTIONS = {
  intro: 'Guess soil science terms letter by letter! A hint and category are provided. You have 6 wrong guesses before the word is lost.',
  completion: 'Excellent vocabulary! You\'ve mastered the language of soil science.',
}

export const RULES = [
  'Guess the soil science term one letter at a time using the keyboard.',
  'A category and hint are shown to help you.',
  'Consonants earn 50 points per occurrence. Vowels are free.',
  'Wrong guesses cost a life and pass the turn (in multiplayer).',
  'Tap "Solve" to guess the full word — correct = +300 pts, wrong = −100 pts.',
  'You have 6 wrong guesses per word before it\'s revealed.',
  'After completing all rounds, you can choose to play more or end the game.',
]

export const IMPACT_MESSAGES = {
  'Nitrogen Cycle': 'Cover crops can reduce nitrogen leaching by up to 50%, keeping our waterways cleaner and protecting drinking water sources.',
  'Conservation': 'No-till farming combined with cover crops can sequester up to 0.5 tons of carbon per acre per year, helping combat climate change.',
  'Soil Biology': 'A single teaspoon of healthy soil contains more microorganisms than there are people on Earth. Conservation practices protect this incredible underground ecosystem.',
}
