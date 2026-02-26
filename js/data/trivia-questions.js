// ============================================
// TRIVIA QUESTIONS DATABASE
// All questions sourced from Youth Activities PDFs
// Used by: Game 6 (Spin Wheel) & Game 9 (Trivia Blitz)
// ============================================

const TRIVIA_QUESTIONS = {
    // === LEVEL 1: CLORPT ===
    clorpt: [
        {
            question: "What does the 'C' in CLORPT stand for?",
            options: ['Climate', 'Carbon', 'Clay', 'Crops'],
            answer: 'Climate'
        },
        {
            question: "What does the 'O' in CLORPT stand for?",
            options: ['Organisms', 'Oxygen', 'Organic', 'Oats'],
            answer: 'Organisms'
        },
        {
            question: "What does the 'R' in CLORPT stand for?",
            options: ['Relief', 'Rain', 'Roots', 'Rocks'],
            answer: 'Relief'
        },
        {
            question: "What does the 'P' in CLORPT stand for?",
            options: ['Parent Material', 'Plants', 'Phosphorus', 'Permafrost'],
            answer: 'Parent Material'
        },
        {
            question: "What does the 'T' in CLORPT stand for?",
            options: ['Time', 'Temperature', 'Topsoil', 'Trees'],
            answer: 'Time'
        }
    ],

    // === LEVEL 2: COVER CROPS ===
    coverCrops: [
        {
            question: 'Which of these is a cover crop that prevents winter erosion?',
            options: ['Rye', 'Dandelion', 'Poison Ivy', 'Crabgrass'],
            answer: 'Rye'
        },
        {
            question: 'Cover crops primarily help prevent what?',
            options: ['Erosion', 'Sunshine', 'Rainfall', 'Gravity'],
            answer: 'Erosion'
        },
        {
            question: 'Which cover crop has deep roots that break up compacted soil?',
            options: ['Sunflower', 'Oats', 'Barley', 'Wheat'],
            answer: 'Sunflower'
        },
        {
            question: 'Fava beans help the soil by fixing what element?',
            options: ['Nitrogen', 'Carbon', 'Oxygen', 'Iron'],
            answer: 'Nitrogen'
        },
        {
            question: 'Which cover crop attracts pollinators with its flowers?',
            options: ['Buckwheat', 'Rye', 'Barley', 'Oats'],
            answer: 'Buckwheat'
        }
    ],

    // === LEVEL 3: SOIL REGIONS ===
    soilRegions: [
        {
            question: "Which soil type is found in the world's breadbaskets?",
            options: ['Chernozem', 'Desert Soil', 'Tundra Soil', 'Tropical Soil'],
            answer: 'Chernozem'
        },
        {
            question: 'Tundra soils have a frozen layer called what?',
            options: ['Permafrost', 'Bedrock', 'Hardpan', 'Glacier'],
            answer: 'Permafrost'
        },
        {
            question: 'In desert soils, moisture evaporates faster than it what?',
            options: ['Accumulates', 'Freezes', 'Flows', 'Sinks'],
            answer: 'Accumulates'
        },
        {
            question: 'Tropical soils are lush with vegetation but surprisingly what?',
            options: ['Not very fertile', 'Very cold', 'Very dry', 'Full of salt'],
            answer: 'Not very fertile'
        },
        {
            question: 'Wetland soils help protect against what natural disaster?',
            options: ['Floods', 'Earthquakes', 'Tornadoes', 'Volcanoes'],
            answer: 'Floods'
        },
        {
            question: 'Temperate forest soils are important for storing what?',
            options: ['Carbon', 'Gold', 'Salt', 'Sand'],
            answer: 'Carbon'
        }
    ],

    // === LEVEL 4: PLANT PARTS WE EAT ===
    plantParts: [
        {
            question: 'A banana is which part of a plant?',
            options: ['Fruit', 'Root', 'Leaf', 'Stem'],
            answer: 'Fruit'
        },
        {
            question: 'We eat the ROOT of which vegetable?',
            options: ['Carrot', 'Lettuce', 'Broccoli', 'Celery'],
            answer: 'Carrot'
        },
        {
            question: 'Broccoli is actually a plant what?',
            options: ['Flower', 'Leaf', 'Root', 'Seed'],
            answer: 'Flower'
        },
        {
            question: 'Rice, peas, and popcorn are all plant what?',
            options: ['Seeds', 'Roots', 'Stems', 'Flowers'],
            answer: 'Seeds'
        },
        {
            question: 'Lettuce, spinach, and cabbage are all plant what?',
            options: ['Leaves', 'Flowers', 'Seeds', 'Fruits'],
            answer: 'Leaves'
        },
        {
            question: 'Celery, asparagus, and sugarcane are plant what?',
            options: ['Stems', 'Roots', 'Leaves', 'Flowers'],
            answer: 'Stems'
        },
        {
            question: 'Potato, yam, and ginger are what type of plant part?',
            options: ['Tuber/Bulb', 'Seed', 'Flower', 'Leaf'],
            answer: 'Tuber/Bulb'
        }
    ],

    // === LEVEL 5: EARTH'S SPHERES ===
    earthSpheres: [
        {
            question: "The prefix 'hydro' means what?",
            options: ['Water', 'Air', 'Life', 'Rock'],
            answer: 'Water'
        },
        {
            question: 'Which sphere includes all living things?',
            options: ['Biosphere', 'Geosphere', 'Atmosphere', 'Hydrosphere'],
            answer: 'Biosphere'
        },
        {
            question: "The prefix 'pedo' in pedosphere refers to what?",
            options: ['Soil', 'Feet', 'Children', 'Rock'],
            answer: 'Soil'
        },
        {
            question: 'The geosphere is made up of what?',
            options: ['Rocks and minerals', 'Water', 'Air', 'Living things'],
            answer: 'Rocks and minerals'
        },
        {
            question: 'The atmosphere is the layer of what surrounding Earth?',
            options: ['Air and gases', 'Water', 'Soil', 'Rock'],
            answer: 'Air and gases'
        }
    ],

    // === LEVEL 6: SOIL BIOLOGY ===
    soilBiology: [
        {
            question: 'These microscopic organisms are primary decomposers in soil.',
            options: ['Bacteria', 'Eagles', 'Trees', 'Rocks'],
            answer: 'Bacteria'
        },
        {
            question: 'This worm improves soil structure by tunneling.',
            options: ['Earthworm', 'Nematode', 'Protozoa', 'Bacteria'],
            answer: 'Earthworm'
        },
        {
            question: 'These single-celled organisms eat bacteria in soil.',
            options: ['Protozoa', 'Fungi', 'Earthworms', 'Mites'],
            answer: 'Protozoa'
        },
        {
            question: 'Microscopic roundworms in soil are called what?',
            options: ['Nematodes', 'Rotifers', 'Springtails', 'Protozoa'],
            answer: 'Nematodes'
        },
        {
            question: 'These tiny soil animals jump using a forked tail appendage.',
            options: ['Springtails', 'Mites', 'Nematodes', 'Bacteria'],
            answer: 'Springtails'
        },
        {
            question: 'Mushrooms are the visible part of which soil organism?',
            options: ['Fungi', 'Bacteria', 'Protozoa', 'Nematodes'],
            answer: 'Fungi'
        },
        {
            question: 'Microscopic animals that filter-feed in water films around soil particles are called what?',
            options: ['Rotifers', 'Springtails', 'Mites', 'Fungi'],
            answer: 'Rotifers'
        }
    ],

    // === LEVEL 7: SOIL ART & CULTURE ===
    soilArtCulture: [
        {
            question: 'Ochre is a natural earth pigment used for what?',
            options: ['Dye and paint', 'Building houses', 'Growing food', 'Making tools'],
            answer: 'Dye and paint'
        },
        {
            question: 'Mudcloth is a traditional art form from which continent?',
            options: ['Africa', 'Europe', 'Antarctica', 'Australia'],
            answer: 'Africa'
        },
        {
            question: 'Pottery is made from which soil material?',
            options: ['Clay', 'Sand', 'Gravel', 'Silt'],
            answer: 'Clay'
        },
        {
            question: 'Ancient Egyptians used which earth material as makeup?',
            options: ['Ochre', 'Mud', 'Sand', 'Chalk'],
            answer: 'Ochre'
        },
        {
            question: 'Bricks are traditionally made from what soil material?',
            options: ['Clay', 'Sand', 'Peat', 'Gravel'],
            answer: 'Clay'
        },
        {
            question: 'Which glass-making ingredient comes from sand?',
            options: ['Silica', 'Clay', 'Iron', 'Calcium'],
            answer: 'Silica'
        }
    ],

    // === TRIVIA BLITZ EXTRA LEVELS ===

    // Level 1: Soil Health Principles
    soilHealthPrinciples: [
        {
            question: 'Keeping plant residues on the soil surface is called what?',
            options: ['Soil Cover', 'Mulching', 'Composting', 'Tilling'],
            answer: 'Soil Cover'
        },
        {
            question: 'Which soil health principle means minimal tillage?',
            options: ['Limited Disturbance', 'Soil Cover', 'Living Roots', 'Crop Rotation'],
            answer: 'Limited Disturbance'
        },
        {
            question: 'Year-round root systems in soil is called what principle?',
            options: ['Living Roots', 'Soil Cover', 'Plant Diversity', 'Limited Disturbance'],
            answer: 'Living Roots'
        },
        {
            question: 'Crop rotation supports which soil health principle?',
            options: ['Plant Diversity', 'Soil Cover', 'Living Roots', 'Limited Disturbance'],
            answer: 'Plant Diversity'
        },
        {
            question: 'Adding animals to a farm system supports which principle?',
            options: ['Livestock Integration', 'Plant Diversity', 'Soil Cover', 'Limited Disturbance'],
            answer: 'Livestock Integration'
        }
    ],

    // Level 2: Indigenous Farming
    indigenousFarming: [
        {
            question: 'Aztec floating gardens built on lake beds are called what?',
            options: ['Chinampa', 'Milpa', 'Terrace', 'Paddy'],
            answer: 'Chinampa'
        },
        {
            question: 'Three Sisters intercropping is also known as what?',
            options: ['Milpa', 'Chinampa', 'Terrace', 'Paddy'],
            answer: 'Milpa'
        },
        {
            question: 'Step-like fields carved into mountain sides are called what?',
            options: ['Terraces', 'Chinampas', 'Milpas', 'Paddies'],
            answer: 'Terraces'
        },
        {
            question: 'Growing trees and crops together in the Amazon is called what?',
            options: ['Polyculture & Agroforestry', 'Monoculture', 'Clearcutting', 'Terraforming'],
            answer: 'Polyculture & Agroforestry'
        },
        {
            question: 'Rice that grows in deep floodwaters in Southeast Asia is called what?',
            options: ['Floating Rice', 'Swimming Rice', 'Deep Rice', 'Lake Rice'],
            answer: 'Floating Rice'
        },
        {
            question: 'Stone walls that create microclimates in the Mediterranean are called what?',
            options: ['Dry Stone Walling', 'Brick Laying', 'Rock Farming', 'Stone Gardening'],
            answer: 'Dry Stone Walling'
        }
    ],

    // Level 5: Agronomy Careers
    agronomyCareers: [
        {
            question: 'Who analyzes seeds for quality and germination rates?',
            options: ['Seed Analyst', 'Farm Manager', 'Climatologist', 'Plant Breeder'],
            answer: 'Seed Analyst'
        },
        {
            question: 'Who studies long-term weather patterns and their effect on farming?',
            options: ['Climatologist', 'Seed Analyst', 'Soil Scientist', 'Farm Manager'],
            answer: 'Climatologist'
        },
        {
            question: 'Who manages the day-to-day operations of a farm?',
            options: ['Farm Manager', 'Plant Breeder', 'Seed Analyst', 'Soil Scientist'],
            answer: 'Farm Manager'
        },
        {
            question: 'Who studies and maps soils in forests and natural areas?',
            options: ['Forest Soil Scientist', 'Climatologist', 'Farm Manager', 'Seed Analyst'],
            answer: 'Forest Soil Scientist'
        },
        {
            question: 'Who develops new crop varieties that resist drought or disease?',
            options: ['Plant Breeder', 'Farm Manager', 'Climatologist', 'Seed Analyst'],
            answer: 'Plant Breeder'
        },
        {
            question: 'Who designs drainage systems, bioreactors, and conservation structures?',
            options: ['Engineer Specialist', 'Farm Manager', 'Climatologist', 'Plant Breeder'],
            answer: 'Engineer Specialist'
        }
    ],

    // Level 6: Carbon Cycle
    carbonCycle: [
        {
            question: 'Trees store carbon primarily in their what?',
            options: ['Wood and roots', 'Leaves only', 'Flowers', 'Seeds'],
            answer: 'Wood and roots'
        },
        {
            question: 'Which farming practice stores carbon in the soil?',
            options: ['No-till farming', 'Deep plowing', 'Burning fields', 'Deforestation'],
            answer: 'No-till farming'
        },
        {
            question: 'Which human activity releases stored carbon into the atmosphere?',
            options: ['Burning fossil fuels', 'Planting trees', 'Cover cropping', 'Building wetlands'],
            answer: 'Burning fossil fuels'
        },
        {
            question: 'Plowing releases carbon because it does what to organic matter?',
            options: ['Exposes it to air (oxidation)', 'Freezes it', 'Compresses it', 'Dissolves it'],
            answer: 'Exposes it to air (oxidation)'
        },
        {
            question: 'Healthy soil with living roots helps do what with carbon?',
            options: ['Store it underground', 'Release it as methane', 'Convert it to iron', 'Dissolve it in water'],
            answer: 'Store it underground'
        }
    ],

    // Level 8: Climate Change
    climateChange: [
        {
            question: 'How is climate change expected to affect agriculture in the Great Plains by 2080?',
            options: ['Reduced productivity in some areas', 'No change at all', 'All areas will improve', 'Farming will be impossible'],
            answer: 'Reduced productivity in some areas'
        },
        {
            question: 'Which soil health practice helps farms adapt to climate change?',
            options: ['Building soil organic matter', 'Increasing tillage', 'Removing all vegetation', 'Using more chemicals'],
            answer: 'Building soil organic matter'
        },
        {
            question: 'Healthy soils can help fight climate change by doing what?',
            options: ['Storing more carbon', 'Releasing more methane', 'Increasing erosion', 'Reducing biodiversity'],
            answer: 'Storing more carbon'
        },
        {
            question: 'Deforestation contributes to climate change by doing what?',
            options: ['Releasing stored carbon', 'Cooling the atmosphere', 'Creating more soil', 'Increasing rainfall'],
            answer: 'Releasing stored carbon'
        }
    ]
};

// Mapping for Spin the Wheel game (Game 6) - which categories per level
const SPIN_WHEEL_CATEGORIES = {
    1: { name: 'CLORPT', key: 'clorpt', color: '#e74c3c' },
    2: { name: 'Cover Crops', key: 'coverCrops', color: '#2ecc71' },
    3: { name: 'Soil Regions', key: 'soilRegions', color: '#3498db' },
    4: { name: 'Plant Parts', key: 'plantParts', color: '#f39c12' },
    5: { name: "Earth's Spheres", key: 'earthSpheres', color: '#9b59b6' },
    6: { name: 'Soil Biology', key: 'soilBiology', color: '#1abc9c' },
    7: { name: 'Soil Art & Culture', key: 'soilArtCulture', color: '#e67e22' }
};

// Mapping for Trivia Blitz game (Game 9) - levels to categories
const TRIVIA_BLITZ_CATEGORIES = {
    1: { name: 'Soil Health Principles', key: 'soilHealthPrinciples' },
    2: { name: 'Indigenous Farming', key: 'indigenousFarming' },
    3: { name: 'CLORPT & Soil Formation', key: 'clorpt' },
    4: { name: 'Soil Biology & Food Web', key: 'soilBiology' },
    5: { name: 'Agronomy Careers', key: 'agronomyCareers' },
    6: { name: 'Carbon Cycle', key: 'carbonCycle' },
    7: { name: 'Soil Art & Culture', key: 'soilArtCulture' },
    8: { name: 'Climate Change', key: 'climateChange' },
    9: { name: 'Soil Regions', key: 'soilRegions' },
    10: { name: 'BONUS: All Categories', key: 'bonus' }
};
