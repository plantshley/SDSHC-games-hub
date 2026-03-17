/**
 * Soil Jeopardy — Content Data
 * 6 categories × 5 questions each (100–500 points).
 * Sources: USDA Soil Health Lesson Plans PDF + upgraded kid content + credible web sources.
 */

export const CATEGORIES = [
  {
    id: 'nitrogen-cycle',
    title: 'Nitrogen Cycle',
    questions: [
      { points: 100, text: 'This form of nitrogen (NH₄⁺) carries a positive charge and is held by soil particles.', answer: 'Ammonium', choices: ['Nitrate', 'Ammonium', 'Nitrite', 'Urea'], correct: 1 },
      { points: 200, text: 'The microbial process that converts ammonium to nitrate in two steps.', answer: 'Nitrification', choices: ['Denitrification', 'Mineralization', 'Nitrification', 'Volatilization'], correct: 2 },
      { points: 300, text: 'This enzyme, found only in nitrogen-fixing organisms, catalyzes the conversion of N₂ to NH₃.', answer: 'Nitrogenase', choices: ['Urease', 'Nitrogenase', 'Nitrate reductase', 'Cellulase'], correct: 1 },
      { points: 400, text: 'Denitrification converts nitrate back to atmospheric N₂. This process requires these specific soil conditions.', answer: 'Anaerobic (waterlogged) with available carbon', choices: ['Dry, well-aerated soil', 'Frozen soil with high pH', 'Anaerobic (waterlogged) with available carbon', 'Sandy soil with low organic matter'], correct: 2 },
      { points: 500, text: 'When surface-applied urea fertilizer breaks down on warm, moist soil without incorporation, nitrogen is lost as this gas.', answer: 'Ammonia (NH₃)', choices: ['Nitrous oxide (N₂O)', 'Carbon dioxide (CO₂)', 'Ammonia (NH₃)', 'Methane (CH₄)'], correct: 2 },
    ],
  },
  {
    id: 'soil-properties',
    title: 'Soil Properties',
    questions: [
      { points: 100, text: 'The three particle sizes that determine soil texture.', answer: 'Sand, silt, and clay', choices: ['Gravel, sand, and silt', 'Sand, silt, and clay', 'Clay, loam, and humus', 'Rock, mineral, and organic'], correct: 1 },
      { points: 200, text: 'This soil structure type — small, rounded aggregates — indicates the healthiest topsoil.', answer: 'Granular', choices: ['Platy', 'Blocky', 'Granular', 'Prismatic'], correct: 2 },
      { points: 300, text: 'Bulk density measures dry soil mass per unit volume. Values above 1.6 g/cm³ in loamy soils generally indicate this problem.', answer: 'Compaction', choices: ['Salinity', 'Compaction', 'Erosion', 'Acidification'], correct: 1 },
      { points: 400, text: 'Clay soils have high cation exchange capacity (CEC). CEC measures the soil\'s ability to do this.', answer: 'Hold and exchange positively charged nutrient ions', choices: ['Conduct electricity through water', 'Hold and exchange positively charged nutrient ions', 'Resist pH changes from acid rain', 'Filter heavy metals from groundwater'], correct: 1 },
      { points: 500, text: 'A soil with 40% sand, 40% silt, and 20% clay is classified as this texture on the USDA textural triangle.', answer: 'Loam', choices: ['Sandy loam', 'Loam', 'Silt loam', 'Clay loam'], correct: 1 },
    ],
  },
  {
    id: 'conservation',
    title: 'Conservation',
    questions: [
      { points: 100, text: 'This farming practice eliminates moldboard plowing to preserve soil structure and biology.', answer: 'No-till farming', choices: ['Contour farming', 'No-till farming', 'Strip cropping', 'Terracing'], correct: 1 },
      { points: 200, text: 'Narrow bands of native perennial vegetation planted within crop fields that can reduce sediment loss by over 90%.', answer: 'Prairie strips', choices: ['Windbreaks', 'Prairie strips', 'Grassed waterways', 'Filter strips'], correct: 1 },
      { points: 300, text: 'Plowing across a slope rather than up and down to reduce water runoff and erosion.', answer: 'Contour farming', choices: ['Terracing', 'Strip cropping', 'Contour farming', 'Ridge tillage'], correct: 2 },
      { points: 400, text: 'In IPM (Integrated Pest Management), this is the first line of defense before chemical application.', answer: 'Cultural practices (crop rotation, resistant varieties, habitat management)', choices: ['Broad-spectrum pesticide application', 'Cultural practices like rotation and resistant varieties', 'Releasing sterile male insects', 'Genetically modifying all crops'], correct: 1 },
      { points: 500, text: 'Vegetation zones planted along waterways that filter sediment, absorb nutrients, and stabilize banks.', answer: 'Riparian buffer zones', choices: ['Wetland reserves', 'Riparian buffer zones', 'Flood control dams', 'Drainage tile outlets'], correct: 1 },
    ],
  },
  {
    id: 'ph-nutrients',
    title: 'pH & Nutrients',
    questions: [
      { points: 100, text: 'The pH range where most crop nutrients are optimally available.', answer: '6.0–7.5', choices: ['4.0–5.0', '6.0–7.5', '8.0–9.0', '3.0–4.0'], correct: 1 },
      { points: 200, text: 'This calcium-based material is applied to acidic soils to raise pH.', answer: 'Agricultural lime (CaCO₃)', choices: ['Gypsum (CaSO₄)', 'Agricultural lime (CaCO₃)', 'Elemental sulfur', 'Potassium chloride'], correct: 1 },
      { points: 300, text: 'At very low pH (below 5.0), this element becomes soluble at potentially toxic levels for crops.', answer: 'Aluminum', choices: ['Calcium', 'Aluminum', 'Iron', 'Manganese'], correct: 1 },
      { points: 400, text: 'Phosphorus is a key component of ATP, DNA, and cell membranes. Unlike nitrogen, it lacks a significant cycle through this sphere.', answer: 'The atmosphere', choices: ['The hydrosphere', 'The atmosphere', 'The lithosphere', 'The biosphere'], correct: 1 },
      { points: 500, text: 'Excess phosphorus reaching waterways causes algal blooms that deplete dissolved oxygen. This process is called:', answer: 'Eutrophication', choices: ['Salinization', 'Eutrophication', 'Acidification', 'Desertification'], correct: 1 },
    ],
  },
  {
    id: 'soil-biology',
    title: 'Soil Biology',
    questions: [
      { points: 100, text: 'A teaspoon of healthy soil contains approximately this many microorganisms.', answer: 'More than 1 billion', choices: ['About 1,000', 'About 1 million', 'More than 1 billion', 'About 100'], correct: 2 },
      { points: 200, text: 'These fungi form symbiotic relationships with plant roots, enhancing phosphorus and water uptake.', answer: 'Mycorrhizal fungi', choices: ['Decomposer fungi', 'Mycorrhizal fungi', 'Pathogenic fungi', 'Yeast'], correct: 1 },
      { points: 300, text: 'This group of soil organisms is primarily responsible for decomposing complex molecules like lignin.', answer: 'Fungi', choices: ['Bacteria', 'Fungi', 'Protozoa', 'Nematodes'], correct: 1 },
      { points: 400, text: 'Bacterial-dominated soils tend to favor this type of ecosystem, while fungal-dominated soils favor forests.', answer: 'Annual croplands and grasslands', choices: ['Old-growth forests', 'Annual croplands and grasslands', 'Wetlands', 'Tundra'], correct: 1 },
      { points: 500, text: 'This glycoprotein produced by mycorrhizal fungi acts as biological "glue" binding soil aggregates together.', answer: 'Glomalin', choices: ['Chitin', 'Glomalin', 'Cellulose', 'Lignin'], correct: 1 },
    ],
  },
  {
    id: 'indigenous-culture',
    title: 'Indigenous & Culture',
    questions: [
      { points: 100, text: 'In the Three Sisters system, this crop shades the soil with large leaves, suppressing weeds and retaining moisture.', answer: 'Squash', choices: ['Corn', 'Beans', 'Squash', 'Sunflower'], correct: 2 },
      { points: 200, text: 'Aztec artificial islands built on shallow lakes for intensive agriculture.', answer: 'Chinampas', choices: ['Terraces', 'Chinampas', 'Milpa fields', 'Zai pits'], correct: 1 },
      { points: 300, text: 'This West African textile uses fermented iron-rich mud bonded with plant tannins to create permanent dark patterns.', answer: 'Bògòlanfini (mudcloth)', choices: ['Kente cloth', 'Bògòlanfini (mudcloth)', 'Adinkra cloth', 'Batik'], correct: 1 },
      { points: 400, text: 'Ancient Amazonian "dark earth" (terra preta) remains remarkably fertile due to high concentrations of this material added by indigenous peoples.', answer: 'Charcoal (biochar)', choices: ['Volcanic ash', 'Charcoal (biochar)', 'Crushed limestone', 'River clay'], correct: 1 },
      { points: 500, text: 'The Hopi people of the arid Southwest use this key dryland farming technique to access residual soil moisture.', answer: 'Deep planting', choices: ['Irrigation canals', 'Deep planting', 'Greenhouse cultivation', 'Cloud seeding'], correct: 1 },
    ],
  },
]

// 2 random cells per game become Daily Doubles (2× points)
export const DAILY_DOUBLE_COUNT = 2

export { PLAYER_COLORS } from './shared.js'

export const INSTRUCTIONS = {
  intro: 'Test your soil science knowledge Jeopardy-style! Select a category and point value, then answer the question. Daily Doubles let you wager for bonus points!',
  completion: 'Outstanding performance! You\'ve conquered the Jeopardy board!',
}

export const RULES = [
  'Select a tile from the board to reveal a question.',
  'Higher point values mean harder questions.',
  'Answer correctly to earn the points; wrong answers earn nothing.',
  'Daily Doubles let you wager up to your current score (or 500 minimum).',
  'In multiplayer, turns rotate after each question.',
  'The game ends when all tiles are cleared.',
  'Highest score at the end wins!',
]

export const IMPACT_MESSAGES = {
  'nitrogen-cycle': 'Proper nitrogen management through cover crops and precision application can reduce nitrate leaching to groundwater by 40-70%, protecting drinking water sources.',
  'conservation': 'Farms using integrated conservation practices have seen yield stability improve even in drought years, while reducing input costs by 15-25%.',
  'soil-biology': 'Healthy soil contains billions of organisms in every teaspoon. Conservation tillage preserves the fungal networks that connect plants and cycle nutrients underground.',
  'soil-properties': 'Every 1% increase in soil organic matter can hold an additional 20,000 gallons of water per acre — a natural buffer against drought.',
}
