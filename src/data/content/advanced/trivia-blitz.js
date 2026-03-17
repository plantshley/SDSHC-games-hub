/**
 * Advanced Trivia Blitz — Content Data
 * College-level soil science questions.
 * Sources: USDA Soil Health Lesson Plans PDF + upgraded kid content + credible web sources.
 *
 * Rounds:
 * - Upgraded from kid: Soil Health Principles, Indigenous Farming, Carbon Cycle,
 *   Climate Change, Agronomy Careers, Soil Art & Culture, Conservation Practices
 * - New from PDF: Bulk Density & Compaction, Soil Texture & Structure,
 *   Nitrogen Cycle Processes, Phosphorus Management, Soil Infiltration & Water,
 *   Electrical Conductivity, Soil pH & Management
 */

export const ROUNDS = [
  // ─── ROUND 1: Soil Health Principles ───
  {
    id: 'soil-health-principles',
    title: 'Soil Health Principles',
    questions: [
      {
        text: 'The five principles of soil health — soil cover, minimal disturbance, plant diversity, living roots, and livestock integration — are designed to mimic which natural system?',
        choices: ['Tropical rainforest canopy dynamics', 'Native grassland and prairie ecosystems', 'Deep ocean nutrient cycling', 'Volcanic soil formation processes'],
        correct: 1,
      },
      {
        text: 'Why does maintaining living roots year-round improve soil health more than leaving fields fallow?',
        choices: ['Living roots prevent all weeds from germinating', 'Root exudates feed soil microbes, maintaining biological activity and nutrient cycling', 'Roots physically prevent wind from reaching the soil surface', 'Living roots eliminate the need for any fertilizer inputs'],
        correct: 1,
      },
      {
        text: 'Reducing soil disturbance preserves mycorrhizal fungal networks. What is the primary benefit these networks provide to plants?',
        choices: ['Nitrogen fixation from atmospheric N₂', 'Enhanced phosphorus uptake and water access beyond the root zone', 'Direct photosynthesis support through chloroplast transfer', 'Physical protection of roots from nematode attack'],
        correct: 1,
      },
      {
        text: 'Plant diversity in crop rotations reduces pest and disease pressure through which ecological mechanism?',
        choices: ['Allelopathic suppression of all organisms', 'Breaking host-specific pest and pathogen life cycles', 'Reducing soil moisture to levels unfavorable for pests', 'Increasing UV radiation reaching the soil surface'],
        correct: 1,
      },
      {
        text: 'Livestock integration through managed grazing contributes to soil health by:',
        choices: ['Compacting soil to reduce erosion', 'Stimulating plant regrowth and cycling nutrients through manure deposition', 'Eliminating all above-ground biomass for maximum sunlight penetration', 'Removing organic matter to reduce fire risk'],
        correct: 1,
      },
      {
        text: 'Which soil health principle is most directly compromised by conventional moldboard plowing?',
        choices: ['Plant diversity', 'Livestock integration', 'Minimal disturbance', 'Soil cover'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 2: Indigenous Farming ───
  {
    id: 'indigenous-farming',
    title: 'Indigenous Farming',
    questions: [
      {
        text: 'In the Three Sisters system, beans fix nitrogen that benefits the corn and squash. This nitrogen fixation is performed by which organisms?',
        choices: ['The bean plant cells directly', 'Rhizobium bacteria in root nodules of the bean plants', 'Mycorrhizal fungi attached to bean roots', 'Free-living cyanobacteria in the soil surface'],
        correct: 1,
      },
      {
        text: 'Aztec chinampas achieved high productivity because the raised bed design provided:',
        choices: ['Protection from all flooding events', 'Continuous nutrient supply from surrounding lake sediments and excellent drainage', 'Complete isolation from soil-borne diseases', 'Year-round frozen soil conditions'],
        correct: 1,
      },
      {
        text: 'Inca terrace farming in the Andes addressed multiple challenges simultaneously. Besides erosion control, what did terraces provide?',
        choices: ['Increased wind exposure for pest control', 'Microclimates allowing cultivation of crops at different elevations', 'Direct access to underground water tables', 'Flat land for livestock grazing exclusively'],
        correct: 1,
      },
      {
        text: 'Aboriginal Australian fire-stick farming creates a mosaic landscape. What ecological benefit does this mosaic pattern provide?',
        choices: ['Eliminates all non-native species', 'Creates diverse habitats at different stages of regrowth, supporting biodiversity', 'Sterilizes soil for disease-free planting', 'Prevents all future fire events'],
        correct: 1,
      },
      {
        text: 'The Zai pit technique from West Africa involves digging small holes and adding organic matter before planting. Why is this effective in degraded, crusted soils?',
        choices: ['It raises soil pH to optimal levels', 'It concentrates scarce water and nutrients directly at the planting site', 'It prevents all insect damage to seedlings', 'It eliminates the need for any seed selection'],
        correct: 1,
      },
      {
        text: 'Which principle shared by most indigenous farming systems is now central to modern regenerative agriculture?',
        choices: ['Maximum tillage for weed control', 'Monoculture for yield optimization', 'Polyculture and mimicking natural ecosystem diversity', 'Chemical-intensive pest management'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 3: Bulk Density & Compaction (from PDF) ───
  {
    id: 'bulk-density',
    title: 'Bulk Density & Compaction',
    questions: [
      {
        text: 'Bulk density is calculated by dividing the mass of dry soil by its:',
        choices: ['Wet weight', 'Total volume (including pore space)', 'Particle density', 'Water content'],
        correct: 1,
      },
      {
        text: 'A typical bulk density for a productive agricultural topsoil is approximately:',
        choices: ['0.5 g/cm³', '1.0–1.4 g/cm³', '2.0–2.5 g/cm³', '3.0+ g/cm³'],
        correct: 1,
      },
      {
        text: 'Soil compaction reduces pore space, which directly impairs:',
        choices: ['Soil color and appearance', 'Root penetration, water infiltration, and gas exchange', 'Soil mineral composition', 'The number of sand particles present'],
        correct: 1,
      },
      {
        text: 'Which management practice is most likely to cause subsoil compaction below the tillage zone?',
        choices: ['Cover cropping with deep-rooted species', 'Repeated heavy equipment traffic on wet soil', 'Application of composted organic matter', 'Rotational grazing with adequate rest periods'],
        correct: 1,
      },
      {
        text: 'Increasing soil organic matter typically decreases bulk density because:',
        choices: ['Organic matter is denser than mineral soil', 'Organic matter promotes aggregation, creating more pore space', 'Organic matter dissolves sand particles', 'Organic matter increases soil weight'],
        correct: 1,
      },
      {
        text: 'In the USDA soil health assessment, bulk density values above which threshold generally indicate compaction problems in loamy soils?',
        choices: ['0.8 g/cm³', '1.0 g/cm³', '1.6 g/cm³', '2.5 g/cm³'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 4: Soil Texture & Structure (from PDF) ───
  {
    id: 'soil-texture-structure',
    title: 'Soil Texture & Structure',
    questions: [
      {
        text: 'Soil texture refers to the relative proportions of three particle sizes. What are they?',
        choices: ['Gravel, pebbles, and boulders', 'Sand, silt, and clay', 'Organic matter, minerals, and water', 'Calcium, iron, and aluminum'],
        correct: 1,
      },
      {
        text: 'The "ribbon test" performed in the field estimates soil texture by:',
        choices: ['Measuring how far a moistened soil sample can be squeezed into a ribbon', 'Observing the color of a soil sample under UV light', 'Timing how quickly water drains through a sample', 'Weighing a sample before and after drying'],
        correct: 0,
      },
      {
        text: 'Soil structure refers to how individual particles group together into aggregates. Which structure type indicates the healthiest topsoil?',
        choices: ['Massive (no visible structure)', 'Platy (flat, horizontal plates)', 'Granular (small, rounded aggregates)', 'Columnar (tall, vertical columns)'],
        correct: 2,
      },
      {
        text: 'Sandy soils drain quickly but have poor nutrient-holding capacity. This is because sand particles have:',
        choices: ['Very high surface area relative to volume', 'Very low surface area relative to volume, reducing cation exchange sites', 'Too many negative charges attracting water', 'A crystalline structure that binds all nutrients permanently'],
        correct: 1,
      },
      {
        text: 'Which soil texture class, found at the center of the textural triangle, has roughly equal influence of sand, silt, and clay properties?',
        choices: ['Sandy clay', 'Silt loam', 'Loam', 'Clay loam'],
        correct: 2,
      },
      {
        text: 'Soil aggregates are held together primarily by:',
        choices: ['Gravity and soil weight', 'Organic matter, fungal hyphae, root exudates, and microbial products', 'Chemical bonds between sand grains', 'Water tension exclusively'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 5: Nitrogen Cycle Processes (from PDF) ───
  {
    id: 'nitrogen-cycle',
    title: 'Nitrogen Cycle',
    questions: [
      {
        text: 'Biological nitrogen fixation converts atmospheric N₂ into ammonia (NH₃). Which enzyme catalyzes this reaction?',
        choices: ['Urease', 'Nitrogenase', 'Nitrate reductase', 'Deaminase'],
        correct: 1,
      },
      {
        text: 'Nitrification is a two-step oxidation process. Which bacterial genera are primarily responsible for converting ammonium to nitrite?',
        choices: ['Rhizobium', 'Nitrosomonas', 'Nitrobacter', 'Clostridium'],
        correct: 1,
      },
      {
        text: 'Denitrification returns nitrogen to the atmosphere. Under what conditions does this process predominantly occur?',
        choices: ['Well-aerated, sandy soils', 'Waterlogged, anaerobic soils with available carbon', 'Frozen soils during winter', 'Extremely acidic conditions (pH < 3)'],
        correct: 1,
      },
      {
        text: 'Why is nitrate (NO₃⁻) more prone to leaching than ammonium (NH₄⁺)?',
        choices: ['Nitrate is a gas that escapes the soil', 'Nitrate carries a negative charge and is repelled by negatively charged soil particles', 'Ammonium is heavier and sinks deeper', 'Nitrate is consumed by all plants instantly'],
        correct: 1,
      },
      {
        text: 'Volatilization of ammonia (NH₃) is a significant nitrogen loss pathway when:',
        choices: ['Urea fertilizer is incorporated deep into moist soil', 'Urea is surface-applied on warm, high-pH soils without rain or incorporation', 'Anhydrous ammonia is injected below the surface', 'Manure is composted before application'],
        correct: 1,
      },
      {
        text: 'Cover crops reduce nitrogen leaching primarily by:',
        choices: ['Releasing nitrogen into the atmosphere through their leaves', 'Absorbing residual soil nitrate into plant biomass during the off-season', 'Increasing denitrification rates in the root zone', 'Physically blocking water movement through the soil profile'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 6: Conservation Practices ───
  {
    id: 'conservation-practices',
    title: 'Conservation Practices',
    questions: [
      {
        text: 'No-till farming preserves soil structure by eliminating moldboard plowing. What biological benefit does this provide?',
        choices: ['It eliminates all soil-dwelling insects', 'It preserves mycorrhizal fungal networks and earthworm habitat', 'It increases soil temperature for faster decomposition', 'It prevents all weed seed germination'],
        correct: 1,
      },
      {
        text: 'Contour farming reduces water erosion by:',
        choices: ['Channeling water downhill more efficiently', 'Creating ridges perpendicular to the slope that slow water flow and increase infiltration', 'Removing all vegetation from the slope', 'Compacting soil along the contour lines'],
        correct: 1,
      },
      {
        text: 'Prairie strips — narrow bands of native perennial vegetation within crop fields — have been shown to reduce sediment loss by:',
        choices: ['About 10%', 'About 30%', 'Over 90%', 'Less than 5%'],
        correct: 2,
      },
      {
        text: 'Integrated pest management (IPM) in conservation agriculture uses a hierarchy of controls. What is the first line of defense?',
        choices: ['Broad-spectrum pesticide application', 'Cultural practices like crop rotation, resistant varieties, and habitat management', 'Releasing predatory insects in large quantities', 'Genetic modification of all crop species'],
        correct: 1,
      },
      {
        text: 'Riparian buffer zones along waterways protect water quality by:',
        choices: ['Increasing stream flow velocity', 'Filtering sediment, absorbing excess nutrients, and stabilizing stream banks with root systems', 'Channeling agricultural runoff directly into the stream', 'Removing all vegetation to reduce water consumption'],
        correct: 1,
      },
      {
        text: 'Managed rotational grazing improves pasture soil health compared to continuous grazing because:',
        choices: ['Livestock compact the soil more evenly', 'Rest periods allow grass recovery, root regrowth, and soil biology restoration', 'Animals eat only the weeds during rotation', 'Manure distribution is concentrated in fewer areas'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 7: Soil pH & Management (from PDF) ───
  {
    id: 'soil-ph',
    title: 'Soil pH & Management',
    questions: [
      {
        text: 'Soil pH is a measure of hydrogen ion concentration. A pH of 5 is how many times more acidic than a pH of 7?',
        choices: ['2 times', '10 times', '100 times', '1000 times'],
        correct: 2,
      },
      {
        text: 'Most nutrient availability for crops is optimal in the pH range of:',
        choices: ['4.0–5.0', '6.0–7.5', '8.5–9.5', '3.0–4.0'],
        correct: 1,
      },
      {
        text: 'At very low soil pH (below 5.0), which element becomes soluble at potentially toxic levels to many crops?',
        choices: ['Calcium', 'Magnesium', 'Aluminum', 'Potassium'],
        correct: 2,
      },
      {
        text: 'Agricultural lime (CaCO₃) raises soil pH by:',
        choices: ['Adding hydrogen ions to the soil', 'Neutralizing hydrogen ions and releasing calcium and carbonate', 'Coating soil particles with an alkaline film', 'Killing acid-producing bacteria'],
        correct: 1,
      },
      {
        text: 'Which nitrogen fertilizer source has the greatest potential to acidify soil over time?',
        choices: ['Calcium nitrate', 'Anhydrous ammonia', 'Urea', 'Ammonium sulfate'],
        correct: 3,
      },
      {
        text: 'In western South Dakota, soils tend to be more alkaline (pH > 7.5) due to:',
        choices: ['High rainfall leaching bases from the soil', 'Low rainfall and accumulation of calcium carbonate from calcareous parent material', 'Volcanic ash deposits', 'Intensive irrigation with acidic water'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 8: Phosphorus Management (from PDF) ───
  {
    id: 'phosphorus',
    title: 'Phosphorus Management',
    questions: [
      {
        text: 'Phosphorus is essential for plants primarily because it is a key component of:',
        choices: ['Chlorophyll molecules', 'ATP (energy currency), DNA, and cell membranes', 'Cellulose cell walls', 'Stomatal guard cells'],
        correct: 1,
      },
      {
        text: 'Unlike nitrogen, phosphorus does not have a significant atmospheric cycle. Why?',
        choices: ['Phosphorus is too heavy to become airborne', 'Phosphorus does not form stable gaseous compounds under normal conditions', 'Bacteria cannot metabolize phosphorus', 'Phosphorus is only found in volcanic rock'],
        correct: 1,
      },
      {
        text: 'Phosphorus availability in soil is most limited at which pH extremes?',
        choices: ['Only at very low pH (acidic)', 'Only at very high pH (alkaline)', 'At both very low and very high pH, with optimal availability around pH 6.0–7.5', 'pH has no effect on phosphorus availability'],
        correct: 2,
      },
      {
        text: 'Phosphorus loss from agricultural fields to waterways primarily occurs through:',
        choices: ['Volatilization into the atmosphere', 'Surface runoff carrying sediment-bound phosphorus and dissolved phosphorus', 'Deep leaching to groundwater in most soils', 'Plant transpiration releasing phosphorus as gas'],
        correct: 1,
      },
      {
        text: 'Why do mycorrhizal fungi play a critical role in phosphorus nutrition for most plants?',
        choices: ['They manufacture phosphorus from nitrogen', 'Their hyphae extend far beyond the root zone, accessing phosphorus the roots cannot reach', 'They break down rocks to release phosphorus directly', 'They store phosphorus in the atmosphere for later plant use'],
        correct: 1,
      },
      {
        text: 'Excess phosphorus in waterways leads to eutrophication. What is the primary harmful effect?',
        choices: ['Water becomes too clear for fish', 'Algal blooms deplete dissolved oxygen, causing fish kills and dead zones', 'Phosphorus crystallizes and blocks stream flow', 'Water pH drops to lethal levels immediately'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 9: Soil Art & Culture ───
  {
    id: 'soil-art-culture',
    title: 'Soil Art & Culture',
    questions: [
      {
        text: 'Bògòlanfini (mudcloth) uses fermented mud containing iron compounds. The permanence of the dye relies on:',
        choices: ['Simple staining that washes out over time', 'Chemical bonding between iron in the mud and plant tannins pre-applied to the cloth', 'Heat-setting the mud in a kiln', 'UV exposure activating mineral pigments'],
        correct: 1,
      },
      {
        text: 'Terra preta ("dark earth") in the Amazon is an ancient soil modification. What makes it remarkably fertile compared to surrounding oxisols?',
        choices: ['It contains volcanic minerals from eruptions', 'High charcoal (biochar) content, bone fragments, and concentrated organic waste added by indigenous peoples', 'Natural river flooding deposited unique clay minerals', 'European colonists imported fertile topsoil'],
        correct: 1,
      },
      {
        text: 'Japanese Dorodango — the art of polishing mud balls — demonstrates which property of fine clay particles?',
        choices: ['Magnetic attraction between particles', 'The ability of clay to compact and polish to a glossy finish under repeated pressure', 'Clay particles naturally repel each other when dry', 'Clay produces a chemical reaction with human skin oils'],
        correct: 1,
      },
      {
        text: 'Rammed earth construction, used for sections of the Great Wall of China, creates strong walls by:',
        choices: ['Mixing soil with cement', 'Compressing moist soil with high clay content into forms, layer by layer', 'Firing bricks made from soil at high temperatures', 'Stacking dried mud bricks with mortar'],
        correct: 1,
      },
      {
        text: 'Ochre pigments have been used in art for over 40,000 years. The range of colors (yellow, red, brown) comes from different:',
        choices: ['Plant species mixed with the clay', 'Oxidation states of iron minerals (goethite, hematite, limonite)', 'Carbon content in the pigment', 'Bacterial communities living in the clay'],
        correct: 1,
      },
      {
        text: 'Adobe construction in the American Southwest uses sun-dried bricks made from clay soil mixed with straw. The straw serves as:',
        choices: ['Decoration only', 'Tensile reinforcement that prevents cracking as the brick dries and shrinks', 'A food source for beneficial bacteria in the wall', 'Waterproofing material'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 10: Agronomy Careers ───
  {
    id: 'agronomy-careers',
    title: 'Agronomy Careers',
    questions: [
      {
        text: 'A Certified Crop Advisor (CCA) provides recommendations on crop management, nutrient planning, and pest control. What is their primary goal?',
        choices: ['Maximizing chemical inputs for highest yield', 'Optimizing crop production while promoting sustainable stewardship of natural resources', 'Selling the most expensive seed varieties', 'Replacing farmers with automated systems'],
        correct: 1,
      },
      {
        text: 'A soil scientist working for NRCS (Natural Resources Conservation Service) primarily:',
        choices: ['Sells fertilizer products to farmers', 'Maps soils, assesses land capability, and provides conservation planning assistance', 'Operates commercial farms for government research', 'Regulates international soil trade agreements'],
        correct: 1,
      },
      {
        text: 'Plant breeders in agronomy work to develop crop varieties with improved traits. What modern tool has accelerated this field?',
        choices: ['Mechanical harvesting equipment', 'Genomic selection and marker-assisted breeding', 'Social media marketing platforms', 'Satellite-based weather forecasting exclusively'],
        correct: 1,
      },
      {
        text: 'An environmental engineer in agriculture might design systems for:',
        choices: ['Only building farm structures', 'Managing water quality, waste treatment, and erosion control infrastructure', 'Trading agricultural commodities on financial markets', 'Forecasting crop prices'],
        correct: 1,
      },
      {
        text: 'A precision agriculture specialist uses technology to optimize farming inputs. Which tools are central to this career?',
        choices: ['Only hand tools and visual observation', 'GPS, remote sensing, variable-rate application equipment, and data analytics', 'Traditional almanac-based planting calendars', 'Laboratory-only soil analysis with no field work'],
        correct: 1,
      },
      {
        text: 'A climatologist studying agriculture focuses on how climate variability and change affects crop production. Their work informs:',
        choices: ['Only historical record-keeping with no practical application', 'Planting date recommendations, crop insurance programs, and adaptation strategies', 'Marketing campaigns for seed companies', 'International diplomatic negotiations exclusively'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 11: Electrical Conductivity (from PDF) ───
  {
    id: 'electrical-conductivity',
    title: 'Electrical Conductivity',
    questions: [
      {
        text: 'Soil electrical conductivity (EC) is a proxy measurement for:',
        choices: ['Soil organic matter content', 'Soluble salt concentration in the soil solution', 'Soil temperature at root depth', 'The number of earthworms present'],
        correct: 1,
      },
      {
        text: 'An EC reading above 4 dS/m generally classifies a soil as:',
        choices: ['Non-saline', 'Slightly saline', 'Saline, causing yield reduction in sensitive crops', 'Optimal for all crop growth'],
        correct: 2,
      },
      {
        text: 'Sodium-affected (sodic) soils have high exchangeable sodium percentage. This causes:',
        choices: ['Improved water infiltration', 'Dispersion of clay particles, poor structure, surface crusting, and reduced infiltration', 'Increased organic matter decomposition', 'Enhanced root growth in all crops'],
        correct: 1,
      },
      {
        text: 'In irrigated agriculture, what is the primary management practice to prevent salt buildup?',
        choices: ['Reducing irrigation to absolute minimum', 'Applying enough water to leach salts below the root zone (leaching fraction)', 'Adding more salt-based fertilizers', 'Increasing soil compaction to slow water movement'],
        correct: 1,
      },
      {
        text: 'Electromagnetic induction (EMI) sensors measure soil EC across a field. This data is useful for:',
        choices: ['Predicting exact crop yields per plant', 'Mapping spatial variability in soil salinity, texture, and moisture for precision management', 'Determining the exact species of soil bacteria present', 'Measuring atmospheric CO₂ concentrations'],
        correct: 1,
      },
      {
        text: 'Gypsum (CaSO₄) is applied to sodic soils to:',
        choices: ['Increase soil sodium levels', 'Displace sodium from exchange sites with calcium, improving soil structure', 'Raise soil pH above 9.0', 'Add nitrogen for crop growth'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 12: Soil Infiltration & Water (from PDF) ───
  {
    id: 'soil-infiltration',
    title: 'Soil Infiltration & Water',
    questions: [
      {
        text: 'Soil infiltration rate measures how quickly water enters the soil surface. Which soil property has the greatest influence?',
        choices: ['Soil color', 'Soil structure, texture, and surface conditions', 'Soil depth to bedrock only', 'The type of crops previously grown'],
        correct: 1,
      },
      {
        text: 'A simple field test for infiltration involves timing how long it takes for a known volume of water to drain into the soil. This is called:',
        choices: ['The ribbon test', 'A single-ring infiltrometer test', 'A slake test', 'A Proctor compaction test'],
        correct: 1,
      },
      {
        text: 'Soil with good aggregation and high organic matter typically has higher infiltration rates because:',
        choices: ['Organic matter repels water', 'Well-aggregated soil has more macropores that allow rapid water entry', 'Organic matter makes soil hydrophobic', 'Aggregation eliminates all micropores'],
        correct: 1,
      },
      {
        text: 'When infiltration rate is lower than rainfall intensity, the excess water becomes:',
        choices: ['Absorbed by plant leaves', 'Surface runoff, which can cause erosion and carry pollutants to waterways', 'Stored in the atmosphere', 'Permanently lost from the water cycle'],
        correct: 1,
      },
      {
        text: 'No-till farming generally improves infiltration compared to conventional tillage because:',
        choices: ['It compacts the surface layer', 'Surface residue protects against raindrop impact and biological pores (worm channels) remain intact', 'It removes all organic matter from the surface', 'It increases surface sealing from rain'],
        correct: 1,
      },
      {
        text: 'The USDA soil health assessment uses infiltration rate as an indicator. Faster infiltration generally indicates:',
        choices: ['Degraded, compacted soil', 'Healthy soil with good structure, biological activity, and organic matter', 'Excessive salinity problems', 'Soil that is too sandy for agriculture'],
        correct: 1,
      },
    ],
  },
]

export const ROUND_TIME = 90 // seconds per round in topic mode

export { PLAYER_COLORS } from './shared.js'

export const INSTRUCTIONS = {
  intro: 'Test your soil science knowledge across 12 advanced categories. Answer quickly for bonus points!',
  topicMode: 'Answer questions in each round. You have 90 seconds per round.',
  endlessMode: 'Random questions from all categories. How many can you answer correctly?',
  completion: 'Outstanding! You\'ve demonstrated expert-level knowledge across all soil science categories.',
}

export const RULES = [
  'Choose Topic Mode (12 rounds, 90s each) or Endless Mode (random, no time limit per round).',
  'Each question is multiple choice with 4 options.',
  'Base score: 100 points per correct answer.',
  'Speed bonus: +50 pts if answered in under 5 seconds, +25 pts if under 10 seconds.',
  'In multiplayer, turns rotate after each question.',
  'Topic Mode ends after 12 rounds. Endless Mode continues until you quit.',
  'Highest score at the end wins!',
]

export const IMPACT_MESSAGES = {
  'soil-health-principles': 'Farms implementing all five soil health principles report improved yields, reduced input costs, and increased resilience to drought within 3-5 years.',
  'conservation-practices': 'Prairie strips occupying just 10% of a field\'s area can reduce sediment loss by 95% and total phosphorus loss by 90%.',
  'nitrogen-cycle': 'Proper nitrogen management through cover crops and precision application can reduce nitrate leaching to groundwater by 40-70%.',
  'soil-infiltration': 'Healthy soils can absorb over 1 inch of rainfall per hour. Degraded soils may absorb less than 0.1 inches, turning rain into destructive runoff.',
  'bulk-density': 'Reducing soil compaction through controlled traffic and cover cropping can increase water storage by thousands of gallons per acre.',
  'phosphorus': 'Agricultural phosphorus runoff is the leading cause of freshwater eutrophication. Conservation buffers can capture over 50% of phosphorus in runoff.',
}
