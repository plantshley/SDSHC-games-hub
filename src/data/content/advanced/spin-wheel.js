/**
 * Advanced Spin the Wheel — Content Data
 * College-level soil science questions.
 * Sources: USDA Soil Health Lesson Plans PDF + upgraded kid content + credible web sources.
 *
 * Categories:
 * - Upgraded from kid: Cover Crops, Soil Biology, Soil Regions,
 *   Soil Art & Culture, Indigenous Farming, Conservation Practices
 * - New from PDF: Soil Texture & Structure, pH & EC, Nitrogen Cycle, Organic Matter
 */

export const CATEGORIES = [
  {
    id: 'cover-crops',
    title: 'Cover Crops',
    questions: [
      {
        text: 'Which cover crop group is known for fixing atmospheric nitrogen through symbiotic bacteria in root nodules?',
        choices: ['Grasses', 'Legumes', 'Brassicas', 'Broadleaves'],
        correct: 1,
      },
      {
        text: 'Cereal rye is a popular cover crop in the Northern Great Plains primarily because it can:',
        choices: ['Fix nitrogen', 'Tolerate cold and establish in fall', 'Produce edible grain while covering soil', 'Attract pollinators year-round'],
        correct: 1,
      },
      {
        text: 'What is the primary concern when terminating a high-biomass cover crop before planting a cash crop?',
        choices: ['Nutrient toxicity to the cash crop', 'Temporary nitrogen immobilization in decomposing residue', 'Cover crop regrowth competing for sunlight', 'Excess soil moisture retention'],
        correct: 1,
      },
      {
        text: 'A cover crop mix of crimson clover and winter rye is considered beneficial because it combines:',
        choices: ['Two nitrogen fixers for maximum N', 'A nitrogen fixer with a carbon-rich grass for balanced residue', 'Two deep-rooted species for compaction relief', 'A warm-season and cool-season species for year-round cover'],
        correct: 1,
      },
      {
        text: 'Which cover crop is known for its deep taproot that can break through compacted soil layers?',
        choices: ['Annual ryegrass', 'Crimson clover', 'Daikon radish', 'Buckwheat'],
        correct: 2,
      },
      {
        text: 'What is "green manure" in the context of cover cropping?',
        choices: ['Animal waste spread over cover crops', 'A cover crop grown specifically to be incorporated into soil as fertilizer', 'Algae that grows on wet cover crop residue', 'Composted cover crop seed'],
        correct: 1,
      },
      {
        text: 'Cover crop termination by roller-crimping is preferred over herbicide application in organic systems because:',
        choices: ['It kills the crop more quickly', 'It mechanically flattens the crop to create a weed-suppressing mulch mat', 'It is less expensive than any other method', 'It works equally well on all cover crop species'],
        correct: 1,
      },
      {
        text: 'Which factor most affects the C:N ratio of cover crop residue, influencing decomposition speed?',
        choices: ['Soil temperature at termination', 'The maturity stage when the cover crop is terminated', 'The color of the cover crop foliage', 'The soil pH where it was grown'],
        correct: 1,
      },
    ],
  },
  {
    id: 'soil-biology',
    title: 'Soil Biology',
    questions: [
      {
        text: 'Mycorrhizal fungi form symbiotic relationships with plant roots. What do the fungi primarily provide to the plant?',
        choices: ['Nitrogen fixation', 'Enhanced phosphorus and water uptake', 'Protection from herbivores', 'Photosynthesis support'],
        correct: 1,
      },
      {
        text: 'Which group of soil organisms is primarily responsible for decomposing complex organic molecules like lignin?',
        choices: ['Bacteria', 'Fungi', 'Protozoa', 'Nematodes'],
        correct: 1,
      },
      {
        text: 'Bacterial-dominated soils tend to favor which type of ecosystem?',
        choices: ['Old-growth forests', 'Annual croplands and grasslands', 'Wetlands', 'Desert environments'],
        correct: 1,
      },
      {
        text: 'What role do predatory nematodes play in the soil food web?',
        choices: ['They decompose plant litter directly', 'They regulate bacterial and fungal populations by feeding on them', 'They fix atmospheric nitrogen', 'They transport water between soil layers'],
        correct: 1,
      },
      {
        text: 'A teaspoon of healthy soil can contain how many microorganisms?',
        choices: ['About 1,000', 'About 100,000', 'More than 1 billion', 'About 1 million'],
        correct: 2,
      },
      {
        text: 'Soil aggregation is directly improved by which biological product?',
        choices: ['Root exudates and fungal hyphae (glomalin)', 'Earthworm castings only', 'Bacterial spores', 'Nematode secretions'],
        correct: 0,
      },
      {
        text: 'The soil food web describes the transfer of energy from one organism to another. What is the base energy source?',
        choices: ['Decomposing rock minerals', 'Organic matter from plant photosynthesis', 'Atmospheric nitrogen', 'Groundwater nutrients'],
        correct: 1,
      },
      {
        text: 'Which indicator organism is often used to assess soil biological health because its populations respond quickly to management changes?',
        choices: ['Earthworms', 'Beetles', 'Deer mice', 'Coyotes'],
        correct: 0,
      },
    ],
  },
  {
    id: 'soil-regions',
    title: 'Soil Regions',
    questions: [
      {
        text: 'Mollisols, the dominant soil order of the Great Plains, are characterized by:',
        choices: ['Extremely acidic conditions', 'A thick, dark, nutrient-rich surface horizon (mollic epipedon)', 'High salinity throughout the profile', 'Permanent waterlogging'],
        correct: 1,
      },
      {
        text: 'Which soil order is most common in tropical rainforests and is typically highly weathered with low fertility?',
        choices: ['Alfisols', 'Oxisols', 'Vertisols', 'Histosols'],
        correct: 1,
      },
      {
        text: 'Permafrost soils (Gelisols) are under threat from climate change. What is the primary concern as permafrost thaws?',
        choices: ['Soil becomes too fertile for native plants', 'Massive release of stored carbon as CO₂ and methane', 'Soil pH drops to toxic levels', 'Earthworm populations explode'],
        correct: 1,
      },
      {
        text: 'Vertisols are clay-rich soils that shrink and swell. This property is due to which type of clay mineral?',
        choices: ['Kaolinite', 'Illite', 'Smectite (montmorillonite)', 'Chlorite'],
        correct: 2,
      },
      {
        text: 'Prairie soils in South Dakota are among the most productive in the world. What primary factor created their deep, organic-rich topsoil?',
        choices: ['Volcanic ash deposits', 'Thousands of years of grass root growth and decomposition', 'Glacial flooding with nutrient-rich silt', 'Indigenous burning practices alone'],
        correct: 1,
      },
      {
        text: 'Aridisols are found in desert regions. What key challenge do farmers face when irrigating these soils?',
        choices: ['Excessive organic matter decomposition', 'Salt accumulation (salinization) from evaporation', 'Rapid nutrient leaching from heavy rainfall', 'Frost heaving damage to crop roots'],
        correct: 1,
      },
      {
        text: 'Wetland soils (Histosols) are important carbon sinks. Approximately what percentage of the world\'s soil carbon do wetlands store?',
        choices: ['About 5%', 'About 12-20%', 'About 50%', 'About 75%'],
        correct: 1,
      },
      {
        text: 'What distinguishes Andisols from other soil orders?',
        choices: ['They form exclusively in river floodplains', 'They develop from volcanic ash and have high water-holding capacity', 'They are found only in polar regions', 'They have the highest clay content of any soil order'],
        correct: 1,
      },
    ],
  },
  {
    id: 'soil-art-culture',
    title: 'Soil Art & Culture',
    questions: [
      {
        text: 'Bògòlanfini (mudcloth) from Mali uses fermented mud as dye. Which chemical process gives the fabric its permanent dark patterns?',
        choices: ['Oxidation of plant tannins bonding with iron in the mud', 'Simple staining from organic matter', 'Bacterial fermentation of cotton fibers', 'UV-activated mineral pigments'],
        correct: 0,
      },
      {
        text: 'Ochre pigments, used in cave paintings over 40,000 years ago, are derived from which mineral?',
        choices: ['Calcium carbonate', 'Iron oxide (hematite and goethite)', 'Copper sulfate', 'Manganese dioxide'],
        correct: 1,
      },
      {
        text: 'Adobe bricks, used in construction across the American Southwest and North Africa, are made from:',
        choices: ['Pure sand and cement', 'Clay-rich soil mixed with straw and dried in the sun', 'Volcanic rock crusite', 'Compressed wood pulp'],
        correct: 1,
      },
      {
        text: 'The tradition of "earthen floors" in many cultures involves tamping soil with additives. What is typically added to create a durable, polished surface?',
        choices: ['Linseed oil and animal blood', 'Crushed glass', 'Synthetic resin', 'Saltwater'],
        correct: 0,
      },
      {
        text: 'Japanese Dorodango is the art of shaping and polishing mud into perfect, shiny spheres. This technique demonstrates which soil property?',
        choices: ['Soil electrical conductivity', 'The ability of fine clay particles to compact and polish under pressure', 'Soil magnetism', 'Chemical bonding with atmospheric nitrogen'],
        correct: 1,
      },
      {
        text: 'Terra preta ("dark earth") found in the Amazon Basin is an ancient soil modification created by:',
        choices: ['Volcanic eruptions enriching the soil', 'Indigenous peoples adding charcoal, bone, and organic waste over centuries', 'Natural river flooding depositing silt', 'European colonial farming practices'],
        correct: 1,
      },
      {
        text: 'Which country has a national soil map that is used as a teaching tool in schools, linking regional soils to local food culture and traditions?',
        choices: ['United States', 'Japan', 'Brazil', 'India'],
        correct: 1,
      },
      {
        text: 'Rammed earth construction dates back over 5,000 years. Which ancient structure famously used this technique?',
        choices: ['The Roman Colosseum', 'Sections of the Great Wall of China', 'The Egyptian Pyramids', 'Stonehenge'],
        correct: 1,
      },
    ],
  },
  {
    id: 'indigenous-farming',
    title: 'Indigenous Farming',
    questions: [
      {
        text: 'In the Three Sisters planting system, what specific role does the squash play in the trio?',
        choices: ['Fixes nitrogen for the other plants', 'Provides a structure for beans to climb', 'Shades the soil with large leaves, suppressing weeds and retaining moisture', 'Attracts pollinators for all three crops'],
        correct: 2,
      },
      {
        text: 'Chinampas ("floating gardens") were developed by which Mesoamerican civilization around Lake Texcoco?',
        choices: ['Maya', 'Inca', 'Aztec', 'Olmec'],
        correct: 2,
      },
      {
        text: 'Terrace farming in the Andes, practiced by the Inca, primarily addresses which agricultural challenge?',
        choices: ['Soil salinity in lowlands', 'Erosion and water management on steep slopes', 'Frost protection for tropical crops', 'Pest control in dense forests'],
        correct: 1,
      },
      {
        text: 'The Australian Aboriginal practice of "fire-stick farming" involves controlled burning to:',
        choices: ['Clear land for permanent settlements', 'Promote new plant growth, manage pests, and create pathways for hunting', 'Signal between distant communities', 'Produce charcoal for trade'],
        correct: 1,
      },
      {
        text: 'Zai pits, a traditional West African soil restoration technique, involve digging small planting holes that:',
        choices: ['Concentrate rainwater and organic matter to rehabilitate degraded land', 'Create drainage channels for flooded fields', 'Trap insects for natural pest control', 'Store seeds underground for the dry season'],
        correct: 0,
      },
      {
        text: 'In Southeast Asian paddy rice cultivation, the flooded field conditions support rice growth by:',
        choices: ['Eliminating all soil microorganisms', 'Creating anaerobic conditions that suppress weeds and fix nitrogen through aquatic organisms', 'Preventing the rice from developing roots', 'Keeping soil temperatures below freezing'],
        correct: 1,
      },
      {
        text: 'The Hopi people of the American Southwest developed dryland farming techniques. What is a key strategy they use in arid conditions?',
        choices: ['Deep planting to access residual moisture below the surface', 'Irrigating exclusively from river diversion', 'Growing only cactus-based crops', 'Farming only during winter months'],
        correct: 0,
      },
      {
        text: 'What principle do most indigenous farming systems share that modern regenerative agriculture is now adopting?',
        choices: ['Maximum tillage for weed control', 'Polyculture and mimicking natural ecosystem diversity', 'Reliance on synthetic fertilizers for yield', 'Separation of livestock and crops'],
        correct: 1,
      },
    ],
  },
  {
    id: 'conservation-practices',
    title: 'Conservation Practices',
    questions: [
      {
        text: 'No-till farming reduces soil disturbance. What is one of its most significant benefits for soil health?',
        choices: ['Eliminates all weeds without herbicides', 'Preserves soil structure and mycorrhizal fungal networks', 'Increases soil temperature for faster crop growth', 'Removes the need for crop rotation'],
        correct: 1,
      },
      {
        text: 'Contour farming involves plowing across a slope rather than up and down. What does this primarily reduce?',
        choices: ['Wind erosion', 'Water runoff and soil erosion', 'Soil compaction from machinery', 'Nutrient volatilization'],
        correct: 1,
      },
      {
        text: 'Riparian buffer strips planted along waterways help protect water quality by:',
        choices: ['Increasing water flow speed to flush pollutants', 'Filtering sediment and absorbing nutrients before they reach the water', 'Shading the water to prevent algae growth only', 'Providing fish habitat but not affecting water quality'],
        correct: 1,
      },
      {
        text: 'Crop rotation benefits soil health by:',
        choices: ['Always increasing yields of the same crop each year', 'Breaking pest and disease cycles and varying nutrient demands on the soil', 'Requiring more fertilizer inputs over time', 'Reducing the need for soil testing'],
        correct: 1,
      },
      {
        text: 'Integrated pest management (IPM) in conservation agriculture prioritizes:',
        choices: ['Eliminating all insects from the field', 'Using biological controls and targeted interventions before resorting to broad chemical application', 'Applying preventative pesticides every season regardless of pest pressure', 'Ignoring pest damage to maintain organic certification'],
        correct: 1,
      },
      {
        text: 'Prairie strips — narrow bands of native prairie planted within crop fields — have been shown to:',
        choices: ['Reduce crop yields by taking up farmland', 'Reduce sediment loss by over 90% and increase pollinator habitat', 'Only benefit soil on slopes greater than 15%', 'Replace the need for cover crops entirely'],
        correct: 1,
      },
      {
        text: 'Managed grazing (rotational grazing) improves pasture soil health by:',
        choices: ['Keeping livestock on one paddock until all forage is consumed', 'Moving livestock frequently to allow rest periods for grass recovery and root regrowth', 'Excluding livestock from all grazing land', 'Supplementing pasture with synthetic fertilizer continuously'],
        correct: 1,
      },
      {
        text: 'What is the primary goal of soil health management systems that combine multiple conservation practices?',
        choices: ['Maximizing short-term yield at any cost', 'Building resilient, self-sustaining soil ecosystems that require fewer external inputs', 'Eliminating all soil organisms to prevent disease', 'Converting all farmland to forest'],
        correct: 1,
      },
    ],
  },
  {
    id: 'soil-texture-structure',
    title: 'Soil Texture & Structure',
    questions: [
      {
        text: 'The soil textural triangle classifies soil into 12 classes based on proportions of sand, silt, and clay. What is considered the ideal agricultural texture?',
        choices: ['Pure clay', 'Sandy loam to loam', 'Pure sand', 'Silty clay'],
        correct: 1,
      },
      {
        text: 'Sand particles are defined as being larger than:',
        choices: ['0.002 mm', '0.05 mm', '2 mm', '0.5 mm'],
        correct: 1,
      },
      {
        text: 'Granular soil structure, commonly found in topsoil, is beneficial because:',
        choices: ['It prevents all water infiltration', 'It provides good aeration and water movement through interconnected pore spaces', 'It indicates high sodium content', 'It forms only in very dry conditions'],
        correct: 1,
      },
      {
        text: 'Which soil structure type, often found in compacted subsoil, restricts root growth and water movement?',
        choices: ['Granular', 'Blocky', 'Platy', 'Prismatic'],
        correct: 2,
      },
      {
        text: 'Clay soils have high cation exchange capacity (CEC). What does this mean for plant nutrition?',
        choices: ['Clay repels all nutrients', 'Clay holds and exchanges nutrient cations (Ca²⁺, Mg²⁺, K⁺) for plant uptake', 'Clay only holds water, not nutrients', 'High CEC means the soil is always acidic'],
        correct: 1,
      },
      {
        text: 'Soil color is determined primarily by organic matter content and:',
        choices: ['The type of plants growing in it', 'Iron compounds in various oxidation states', 'The depth of the water table only', 'Atmospheric dust accumulation'],
        correct: 1,
      },
      {
        text: 'A soil with 40% sand, 40% silt, and 20% clay would be classified as:',
        choices: ['Sandy loam', 'Loam', 'Silty clay', 'Clay loam'],
        correct: 1,
      },
      {
        text: 'Bulk density measures the mass of dry soil per unit volume. Lower bulk density generally indicates:',
        choices: ['Compacted, degraded soil', 'Healthy soil with good structure and organic matter', 'Soil with very high sand content', 'Waterlogged conditions'],
        correct: 1,
      },
    ],
  },
  {
    id: 'ph-ec',
    title: 'pH & EC',
    questions: [
      {
        text: 'Most crops grow best in a soil pH range of:',
        choices: ['4.0 – 5.0', '5.5 – 5.8', '6.0 – 7.5', '8.0 – 9.0'],
        correct: 2,
      },
      {
        text: 'Soil pH affects nutrient availability. At very low pH (< 5.0), which nutrient becomes potentially toxic to plants?',
        choices: ['Calcium', 'Aluminum', 'Nitrogen', 'Potassium'],
        correct: 1,
      },
      {
        text: 'Agricultural lime (calcium carbonate) is applied to acidic soils to:',
        choices: ['Decrease pH further', 'Raise pH by neutralizing hydrogen ions', 'Add nitrogen', 'Reduce organic matter'],
        correct: 1,
      },
      {
        text: 'Soil electrical conductivity (EC) measures:',
        choices: ['Soil temperature', 'The ability of soil to conduct electricity, indicating soluble salt concentration', 'Soil moisture percentage', 'The number of microorganisms present'],
        correct: 1,
      },
      {
        text: 'High EC readings in agricultural soil typically indicate:',
        choices: ['Ideal growing conditions', 'Salinity problems that can reduce crop yields', 'Low organic matter', 'Excellent soil structure'],
        correct: 1,
      },
      {
        text: 'Sodic soils have high levels of exchangeable sodium, causing:',
        choices: ['Improved soil structure and drainage', 'Poor structure, surface crusting, and reduced infiltration', 'Increased biological activity', 'Lower soil pH'],
        correct: 1,
      },
      {
        text: 'In South Dakota, soil pH tends to be higher (more alkaline) in the western part of the state. This is primarily due to:',
        choices: ['High rainfall leaching calcium', 'Lower rainfall and calcium carbonate accumulation from parent material', 'Volcanic soil deposits', 'Urban pollution effects'],
        correct: 1,
      },
      {
        text: 'Which management practice can gradually lower soil pH over time?',
        choices: ['Adding lime', 'Applying elemental sulfur or ammonium-based fertilizers', 'Increasing irrigation with alkaline water', 'Reducing organic matter inputs'],
        correct: 1,
      },
    ],
  },
  {
    id: 'nitrogen-cycle',
    title: 'Nitrogen Cycle',
    questions: [
      {
        text: 'Nitrogen fixation converts atmospheric N₂ gas into plant-available forms. Which organisms perform biological nitrogen fixation?',
        choices: ['Only earthworms', 'Rhizobium bacteria in legume root nodules and free-living soil bacteria', 'Mycorrhizal fungi exclusively', 'Plant root cells directly'],
        correct: 1,
      },
      {
        text: 'Nitrification is the two-step microbial process that converts:',
        choices: ['Nitrate to nitrogen gas', 'Ammonium (NH₄⁺) to nitrite (NO₂⁻) and then to nitrate (NO₃⁻)', 'Organic nitrogen to ammonium', 'Atmospheric N₂ to ammonium'],
        correct: 1,
      },
      {
        text: 'Denitrification — the conversion of nitrate to nitrogen gas — occurs under what soil conditions?',
        choices: ['Well-aerated, dry soils', 'Waterlogged, anaerobic conditions', 'Frozen soils only', 'Very acidic soils exclusively'],
        correct: 1,
      },
      {
        text: 'Nitrogen leaching is a major environmental concern because:',
        choices: ['It makes soil too acidic to farm', 'Nitrate moves easily through soil with water and can contaminate groundwater', 'It causes immediate crop death', 'It only occurs in sandy deserts'],
        correct: 1,
      },
      {
        text: 'Mineralization is the process where:',
        choices: ['Rocks break down into soil', 'Soil organisms convert organic nitrogen into plant-available inorganic forms (NH₄⁺)', 'Plants absorb nitrogen from the atmosphere', 'Nitrogen gas is released from fertilizer granules'],
        correct: 1,
      },
      {
        text: 'Immobilization is the opposite of mineralization. It occurs when:',
        choices: ['Plants release nitrogen into the soil', 'Microbes consume inorganic nitrogen to build their own biomass, temporarily making it unavailable to plants', 'Nitrogen is permanently lost from the system', 'Fertilizer is applied in excess'],
        correct: 1,
      },
      {
        text: 'Volatilization of nitrogen as ammonia gas (NH₃) is most common when:',
        choices: ['Urea fertilizer is surface-applied on warm, moist soils without incorporation', 'Nitrogen is applied deep in the soil', 'Soils are very cold and dry', 'Organic matter levels are extremely high'],
        correct: 0,
      },
      {
        text: 'Cover crops can reduce nitrogen loss from the soil primarily by:',
        choices: ['Releasing nitrogen into the atmosphere', 'Taking up residual soil nitrate and storing it in plant biomass over winter', 'Sealing the soil surface to prevent gas exchange', 'Killing denitrifying bacteria'],
        correct: 1,
      },
    ],
  },
  {
    id: 'organic-matter',
    title: 'Organic Matter',
    questions: [
      {
        text: 'Soil organic matter consists of three components: living organisms, fresh residues, and:',
        choices: ['Rock fragments', 'Humus (well-decomposed, stable organic material)', 'Sand particles', 'Mineral salts'],
        correct: 1,
      },
      {
        text: 'Organic matter improves water-holding capacity. One percent increase in organic matter can increase water-holding capacity by approximately:',
        choices: ['1,000 gallons per acre', 'Up to 20,000 gallons per acre', '100 gallons per acre', '500,000 gallons per acre'],
        correct: 1,
      },
      {
        text: 'Humus is resistant to further decomposition and can persist in soil for:',
        choices: ['Days to weeks', 'Months only', 'Hundreds to thousands of years', 'Exactly one growing season'],
        correct: 2,
      },
      {
        text: 'Which management practice most effectively builds soil organic matter over time?',
        choices: ['Intensive tillage to mix residue', 'Continuous cover cropping with diverse species and reduced tillage', 'Removing all crop residues for biofuel', 'Applying only synthetic fertilizers'],
        correct: 1,
      },
      {
        text: 'Soil organic matter serves as a nutrient reservoir. Which nutrient is predominantly supplied through organic matter decomposition?',
        choices: ['Potassium', 'Nitrogen', 'Iron', 'Boron'],
        correct: 1,
      },
      {
        text: 'Organic matter contributes to soil aggregation by:',
        choices: ['Increasing soil weight', 'Providing binding agents (polysaccharides, glomalin) that hold soil particles together', 'Dissolving mineral particles', 'Repelling water from aggregate surfaces'],
        correct: 1,
      },
      {
        text: 'In the Northern Great Plains, soil organic matter levels have declined since native prairie was first plowed. Typical losses are:',
        choices: ['Less than 5%', 'About 10-15%', 'About 30-50% of original organic matter', 'Over 90%'],
        correct: 2,
      },
      {
        text: 'Dark soil color generally indicates:',
        choices: ['High sand content', 'High organic matter content', 'Recent flooding', 'Volcanic parent material exclusively'],
        correct: 1,
      },
    ],
  },
]

export const WHEEL_SLICES = [100, 'steal', 200, 300, 'wild', 500, 150, 250, 400, 200]

export const WIN_THRESHOLD = 1500

export { PLAYER_COLORS } from './shared.js'

export const INSTRUCTIONS = {
  intro: 'Tap to spin, choose a category, and test your soil science knowledge. First to reach 1500 points wins!',
  completion: 'Outstanding work! You\'ve demonstrated expert-level soil science knowledge.',
}

export const RULES = [
  'Spin the wheel to land on a point value (or special slice).',
  'Choose a category, then answer a multiple-choice question.',
  'Correct answers earn the points shown on the wheel.',
  'WILD doubles your score, then you pick a category for the next player.',
  'STEAL lets you choose a player and steal 100 pts from them (multiplayer).',
  'Wrong answers pass the turn with no penalty.',
  'First player to reach 1500 points wins!',
]

export const IMPACT_MESSAGES = {
  'cover-crops': 'Cover crops can reduce soil erosion by up to 90% and increase soil organic matter by 0.1% per year — small changes that compound into major improvements.',
  'soil-biology': 'Healthy soil contains billions of organisms in every teaspoon. Conservation tillage preserves the fungal networks that connect plants and cycle nutrients underground.',
  'conservation-practices': 'Farms using integrated conservation practices have seen yield stability improve even in drought years, while reducing input costs by 15-25%.',
  'nitrogen-cycle': 'Cover crops and proper nitrogen management can reduce nitrate leaching to groundwater by 40-70%, protecting drinking water sources.',
  'organic-matter': 'Every 1% increase in soil organic matter can hold an additional 20,000 gallons of water per acre — a natural buffer against drought.',
  'soil-regions': 'South Dakota\'s prairie soils took thousands of years to develop their rich topsoil. Conservation practices help protect this irreplaceable resource.',
}
