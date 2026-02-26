// ============================================
// GAME CONTENT DATA
// All level data, labels, and educational text
// sourced from Youth Activities PDFs
// ============================================

const GAME_REGISTRY = {
    sprouts: [
        {
            id: 'soil-cake',
            title: 'Build a Soil Cake',
            icon: '🍰',
            levels: 3,
            description: 'Stack soil layers in the right order!',
            module: 'js/games/soil-cake.js'
        },
        {
            id: 'dot-to-dot',
            title: 'What Does Soil Make?',
            icon: '✨',
            levels: 5,
            description: 'Connect glowing stars to reveal hidden objects!',
            module: 'js/games/dot-to-dot.js'
        },
        {
            id: 'soil-maze',
            title: 'Soil Life Maze',
            icon: '🐛',
            levels: 3,
            description: 'Help the earthworm find its friends!',
            module: 'js/games/soil-maze.js'
        },
        {
            id: 'coloring',
            title: 'Soil Critter Coloring',
            icon: '🎨',
            levels: 6,
            description: 'Color soil creatures and plants!',
            module: 'js/games/coloring.js'
        },
        {
            id: 'food-web',
            title: 'Soil Food Web',
            icon: '🕸️',
            levels: 1,
            description: 'Build a simple food web!',
            module: 'js/games/food-web.js'
        }
    ],
    explorers: [
        {
            id: 'three-sisters',
            title: 'Three Sisters Garden',
            icon: '🌽',
            levels: 5,
            description: 'Plant the right crops in the garden!',
            module: 'js/games/three-sisters.js'
        },
        {
            id: 'spin-wheel',
            title: 'Spin the Soil Wheel',
            icon: '🎡',
            levels: 7,
            description: 'Spin and answer soil trivia!',
            module: 'js/games/spin-wheel.js'
        },
        {
            id: 'odd-one-out',
            title: 'Odd One Out',
            icon: '🔍',
            levels: 5,
            description: 'Find what doesn\'t belong!',
            module: 'js/games/odd-one-out.js'
        },
        {
            id: 'food-web',
            title: 'Soil Food Web',
            icon: '🕸️',
            levels: 1,
            description: 'Build an intermediate food web!',
            module: 'js/games/food-web.js'
        }
    ],
    heroes: [
        {
            id: 'farm-manager',
            title: 'Farm Manager',
            icon: '🌾',
            levels: 8,
            description: 'Solve farm crises with conservation!',
            module: 'js/games/farm-manager.js'
        },
        {
            id: 'trivia-blitz',
            title: 'Trivia Blitz',
            icon: '⚡',
            levels: 10,
            description: 'Fast-paced soil health trivia!',
            module: 'js/games/trivia-blitz.js'
        },
        {
            id: 'food-web',
            title: 'Soil Food Web',
            icon: '🕸️',
            levels: 1,
            description: 'Build the complete soil food web!',
            module: 'js/games/food-web.js'
        }
    ]
};

const TIER_NAMES = {
    sprouts: 'Little Sprouts',
    explorers: 'Earth Explorers',
    heroes: 'Agro-Heroes'
};

// ============================================
// GAME 1: SOIL CAKE - Level Data
// ============================================
const SOIL_CAKE_LEVELS = {
    1: {
        title: 'Soil Horizons',
        instruction: 'Stack the soil layers from bottom to top!',
        layers: [
            { id: 'R', name: 'R - Bedrock', color: '#7a7a7a', desc: 'Solid rock foundation' },
            { id: 'C', name: 'C - Parent Material', color: '#a0846e', desc: 'Broken rock pieces' },
            { id: 'B', name: 'B - Subsoil', color: '#c4953a', desc: 'Clay and minerals collect here' },
            { id: 'A', name: 'A - Topsoil', color: '#5a3a1a', desc: 'Rich, dark soil full of life' },
            { id: 'O', name: 'O - Organic Layer', color: '#2d1f0a', desc: 'Decomposing leaves and plants' }
        ],
        correctOrder: ['R', 'C', 'B', 'A', 'O']
    },
    2: {
        title: "Earth's Spheres",
        instruction: 'Stack the spheres from innermost to outermost!',
        layers: [
            { id: 'geo', name: 'Geosphere (Rock)', color: '#8b4513', desc: 'Geo = Earth/Rock' },
            { id: 'pedo', name: 'Pedosphere (Soil)', color: '#6b4226', desc: 'Pedo = Soil' },
            { id: 'hydro', name: 'Hydrosphere (Water)', color: '#4169e1', desc: 'Hydro = Water' },
            { id: 'bio', name: 'Biosphere (Life)', color: '#228b22', desc: 'Bio = Life' },
            { id: 'atmo', name: 'Atmosphere (Air)', color: '#87ceeb', desc: 'Atmo = Air/Vapor' }
        ],
        correctOrder: ['geo', 'pedo', 'hydro', 'bio', 'atmo']
    },
    3: {
        title: 'Soil Regions',
        instruction: 'Build a prairie soil profile!',
        layers: [
            { id: 'bedrock', name: 'Limestone Bedrock', color: '#c0b090', desc: 'Ancient sea floor' },
            { id: 'loess', name: 'Loess (Wind Deposits)', color: '#d4b896', desc: 'Fine silt blown by wind' },
            { id: 'chernozem', name: 'Chernozem (Black Soil)', color: '#2d1f0a', desc: 'World\'s most fertile soil!' },
            { id: 'roots', name: 'Dense Root Network', color: '#4a6741', desc: 'Prairie grass roots go deep' },
            { id: 'thatch', name: 'Grass Thatch Layer', color: '#8b7d3c', desc: 'Dead grass protects the soil' }
        ],
        correctOrder: ['bedrock', 'loess', 'chernozem', 'roots', 'thatch']
    }
};

// ============================================
// GAME 2: DOT-TO-DOT - Level Data
// ============================================
const DOT_TO_DOT_LEVELS = {
    1: {
        title: 'Soil Makes...',
        puzzles: [
            { name: 'Pencil', dotCount: 8 },
            { name: 'Clothes', dotCount: 10 },
            { name: 'Fruit', dotCount: 7 }
        ]
    },
    2: {
        title: 'Sand Makes...',
        puzzles: [
            { name: 'Glasses', dotCount: 9 },
            { name: 'Computer', dotCount: 12 },
            { name: 'Light Bulb', dotCount: 8 }
        ]
    },
    3: {
        title: 'Clay Makes...',
        puzzles: [
            { name: 'Mug', dotCount: 8 },
            { name: 'Brick', dotCount: 6 },
            { name: 'Plate', dotCount: 10 }
        ]
    },
    4: {
        title: 'Flowers Like...',
        puzzles: [
            { name: 'Bee', dotCount: 10 },
            { name: 'Sunshine', dotCount: 8 },
            { name: 'Water', dotCount: 7 }
        ]
    },
    5: {
        title: 'Soil Critters',
        puzzles: [
            { name: 'Bison', dotCount: 14 },
            { name: 'Tree', dotCount: 10 },
            { name: 'Cow', dotCount: 12 },
            { name: 'Duck', dotCount: 9 },
            { name: 'Worm', dotCount: 6 },
            { name: 'Caterpillar', dotCount: 11 }
        ]
    }
};

// ============================================
// GAME 3: MAZE - Level Data
// ============================================
const MAZE_LEVELS = {
    1: {
        title: 'Help the Earthworm!',
        instruction: 'Guide the earthworm to its friends. Avoid the birds!',
        width: 11,
        height: 9,
        difficulty: 'easy'
    },
    2: {
        title: 'Grow a Sunflower!',
        instruction: 'Help the seed reach sunlight to become a sunflower!',
        width: 13,
        height: 11,
        difficulty: 'medium'
    },
    3: {
        title: 'CLORPT Journey',
        instruction: 'Visit all 5 soil factors: Climate, Organisms, Relief, Parent Material, Time!',
        width: 15,
        height: 13,
        difficulty: 'hard',
        checkpoints: ['Climate', 'Organisms', 'Relief', 'Parent Material', 'Time']
    }
};

// ============================================
// GAME 5: THREE SISTERS - Level Data
// ============================================
const THREE_SISTERS_LEVELS = {
    1: {
        title: 'The Three Sisters',
        clues: [
            { text: 'We need a tall stalk to reach the sun! What should we plant?', answer: 'corn', options: ['corn', 'beans', 'squash', 'wheat'], fact: 'Corn (selu in Cherokee) grows tall and gives beans something to climb!' },
            { text: 'We need something to fix nitrogen in the soil!', answer: 'beans', options: ['corn', 'beans', 'squash', 'tomato'], fact: 'Beans (iya in Cherokee) pull nitrogen from the air into the soil!' },
            { text: 'We need big leaves to keep moisture in and block weeds!', answer: 'squash', options: ['corn', 'beans', 'squash', 'lettuce'], fact: 'Squash (tuya in Cherokee) spreads its leaves like a living mulch!' }
        ],
        bonusRound: {
            instruction: 'Match the Cherokee names!',
            pairs: [
                { cherokee: 'Selu', english: 'Corn' },
                { cherokee: 'Iya', english: 'Beans' },
                { cherokee: 'Tuya', english: 'Squash' }
            ]
        }
    },
    2: {
        title: 'Pollinator Garden',
        clues: [
            { text: 'Place SHORT native flowers at the front of the garden.', answer: 'short-flowers', options: ['short-flowers', 'tall-grass', 'flat-stones', 'puddling-area'] },
            { text: 'Place MEDIUM native flowers in the middle.', answer: 'medium-flowers', options: ['medium-flowers', 'short-flowers', 'tall-flowers', 'tall-grass'] },
            { text: 'Place TALL native flowers behind the medium ones.', answer: 'tall-flowers', options: ['tall-flowers', 'short-flowers', 'medium-flowers', 'tall-grass'] },
            { text: 'Place TALL native grass at the very back for shelter.', answer: 'tall-grass', options: ['tall-grass', 'tall-flowers', 'short-flowers', 'flat-stones'] },
            { text: 'Add a PUDDLING AREA for butterflies to drink water.', answer: 'puddling-area', options: ['puddling-area', 'flat-stones', 'tall-grass', 'short-flowers'] },
            { text: 'Add FLAT STONES for butterflies to warm up on.', answer: 'flat-stones', options: ['flat-stones', 'puddling-area', 'short-flowers', 'tall-grass'] }
        ]
    },
    3: {
        title: 'Year in Bloom',
        instruction: 'Plant flowers in their blooming order!',
        flowers: [
            { name: 'Golden Alexander', month: 'April', color: '#f4d03f' },
            { name: 'Scarlet Globemallow', month: 'May', color: '#e74c3c' },
            { name: 'Prairie Rose', month: 'June', color: '#e91e90' },
            { name: 'Butterfly Milkweed', month: 'July-Aug', color: '#ff8c00' },
            { name: 'Stiff Sunflower', month: 'September', color: '#f1c40f' },
            { name: 'New England Aster', month: 'October', color: '#3f51b5' }
        ]
    },
    4: {
        title: 'Cover Crops',
        instruction: 'Match each cover crop to its benefit!',
        crops: [
            { name: 'Sunflower', benefit: 'Deep roots break up compacted soil', icon: '🌻' },
            { name: 'Rye', benefit: 'Prevents erosion over winter', icon: '🌾' },
            { name: 'Oats', benefit: 'Quick ground cover after harvest', icon: '🌿' },
            { name: 'Buckwheat', benefit: 'Attracts pollinators with flowers', icon: '🌸' },
            { name: 'Fava Bean', benefit: 'Fixes nitrogen in the soil', icon: '🫘' },
            { name: 'Barley', benefit: 'Tolerates cold and dry conditions', icon: '🌱' }
        ]
    },
    5: {
        title: 'Indigenous Farming',
        instruction: 'Match each farming practice to its region!',
        practices: [
            { name: 'Chinampa', region: 'Aztec Lakes (Mexico)', desc: 'Floating gardens built on lake beds', icon: '🏝️' },
            { name: 'Milpa', region: 'Mesoamerica', desc: 'Three Sisters intercropping system', icon: '🌽' },
            { name: 'Terraces', region: 'Andes Mountains', desc: 'Step-like fields carved into hillsides', icon: '🏔️' },
            { name: 'Polyculture & Agroforestry', region: 'Amazon Rainforest', desc: 'Trees and crops grown together', icon: '🌳' },
            { name: 'Floating Rice', region: 'Southeast Asia', desc: 'Rice that grows in deep floodwaters', icon: '🌊' },
            { name: 'Dry Stone Walling', region: 'Mediterranean', desc: 'Stone walls create microclimates', icon: '🧱' }
        ]
    }
};

// ============================================
// GAME 7: ODD ONE OUT - Level Data
// ============================================
const ODD_ONE_OUT_LEVELS = {
    1: {
        title: 'Things That Don\'t Belong',
        rounds: [
            { items: ['Bee', 'Cow', 'Butterfly', 'Flower'], answer: 'Flower', explanation: 'Flower is a plant, not an animal!' },
            { items: ['Sand', 'Clay', 'Silt', 'Leaf'], answer: 'Leaf', explanation: 'Leaf is a plant part, not a soil component!' },
            { items: ['Horse', 'Sun', 'Pig', 'Duck'], answer: 'Sun', explanation: 'Sun is a star, not a farm animal!' },
            { items: ['Grape', 'Water', 'Earth', 'Wind'], answer: 'Grape', explanation: 'Grape is a fruit, not a natural element!' }
        ]
    },
    2: {
        title: 'Plant Parts',
        rounds: [
            { items: ['Carrot', 'Potato', 'Onion', 'Lettuce'], answer: 'Lettuce', explanation: 'Lettuce is a leaf! The others grow underground.' },
            { items: ['Broccoli', 'Rice', 'Artichoke', 'Cauliflower'], answer: 'Rice', explanation: 'Rice is a seed! The others are flower parts.' },
            { items: ['Banana', 'Apple', 'Celery', 'Tomato'], answer: 'Celery', explanation: 'Celery is a stem! The others are fruits.' },
            { items: ['Peanut', 'Coffee Bean', 'Spinach', 'Popcorn'], answer: 'Spinach', explanation: 'Spinach is a leaf! The others are seeds.' },
            { items: ['Ginger', 'Asparagus', 'Sugarcane', 'Rhubarb'], answer: 'Ginger', explanation: 'Ginger is a root! The others are stems.' }
        ]
    },
    3: {
        title: 'Soil Organisms',
        rounds: [
            { items: ['Bacteria', 'Fungi', 'Protozoa', 'Granite'], answer: 'Granite', explanation: 'Granite is a rock! The others are living soil organisms.' },
            { items: ['Earthworm', 'Nematode', 'Corn', 'Mite'], answer: 'Corn', explanation: 'Corn is a plant! The others are soil creatures.' },
            { items: ['Springtail', 'Rotifer', 'Protozoa', 'Limestone'], answer: 'Limestone', explanation: 'Limestone is a rock! The others are soil organisms.' },
            { items: ['Bacteria', 'Arthropod', 'Clay', 'Earthworm'], answer: 'Clay', explanation: 'Clay is a mineral! The others are living things.' },
            { items: ['Nematode', 'Mite', 'Springtail', 'Humus'], answer: 'Humus', explanation: 'Humus is decomposed matter! The others are animals.' }
        ]
    },
    4: {
        title: 'Cover Crops',
        rounds: [
            { items: ['Rye', 'Oats', 'Dandelion', 'Barley'], answer: 'Dandelion', explanation: 'Dandelion is a weed, not a cover crop!' },
            { items: ['Buckwheat', 'Fava Bean', 'Crabgrass', 'Sunflower'], answer: 'Crabgrass', explanation: 'Crabgrass is an invasive weed!' },
            { items: ['Winter Pea', 'Wheat', 'Thistle', 'Rye'], answer: 'Thistle', explanation: 'Thistle is a weed, not a cover crop!' },
            { items: ['Barley', 'Kudzu', 'Oats', 'Buckwheat'], answer: 'Kudzu', explanation: 'Kudzu is an invasive vine, not a cover crop!' },
            { items: ['Sunflower', 'Fava Bean', 'Poison Ivy', 'Rye'], answer: 'Poison Ivy', explanation: 'Poison Ivy is definitely not a cover crop!' }
        ]
    },
    5: {
        title: 'Conservation Practices',
        rounds: [
            { items: ['Prairie Strips', 'Cover Crops', 'Paving Fields', 'Wetlands'], answer: 'Paving Fields', explanation: 'Paving destroys soil! The others protect it.' },
            { items: ['Bioreactors', 'Saturated Buffers', 'Clearcutting', 'Drainage Mgmt'], answer: 'Clearcutting', explanation: 'Clearcutting removes all trees and causes erosion!' },
            { items: ['Crop Rotation', 'Living Roots', 'Monoculture', 'Plant Diversity'], answer: 'Monoculture', explanation: 'Monoculture harms soil! The others are soil health principles.' },
            { items: ['No-Till', 'Soil Cover', 'Deep Plowing', 'Living Roots'], answer: 'Deep Plowing', explanation: 'Deep plowing disturbs soil structure!' },
            { items: ['Soil Scientist', 'Climatologist', 'Seed Analyst', 'Demolition Expert'], answer: 'Demolition Expert', explanation: 'Not an agronomy career!' }
        ]
    }
};

// ============================================
// GAME 8: FARM MANAGER - Level Data
// ============================================
const FARM_MANAGER_LEVELS = {
    1: {
        scenario: 'Your field is losing nutrients into the local river! The water is turning murky and algae is growing downstream.',
        correctPractice: 'saturated-buffers',
        practices: [
            { id: 'saturated-buffers', name: 'Saturated Buffers', desc: 'Redirect tile drainage water through riparian buffers to filter nutrients' },
            { id: 'prairie-strips', name: 'Prairie Strips', desc: 'Plant strips of native prairie within crop fields' },
            { id: 'wetlands', name: 'Wetlands', desc: 'Construct wetlands to filter and store water' },
            { id: 'cover-crops', name: 'Cover Crops', desc: 'Plant crops after harvest to protect soil' }
        ],
        successText: 'The saturated buffer filters nutrients before they reach the river. The water clears up!'
    },
    2: {
        scenario: 'Erosion is destroying your hillside crops! Heavy rain washes topsoil downhill every storm.',
        correctPractice: 'prairie-strips',
        practices: [
            { id: 'prairie-strips', name: 'Prairie Strips', desc: 'Plant native prairie strips across the slope to slow water and trap sediment' },
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Install underground woodchip filters' },
            { id: 'drainage', name: 'Drainage Management', desc: 'Control water table with managed drainage' },
            { id: 'saturated-buffers', name: 'Saturated Buffers', desc: 'Redirect drainage through riparian areas' }
        ],
        successText: 'Prairie strips slow the water and trap sediment! Your hillside crops are protected.'
    },
    3: {
        scenario: 'Your water table is too high after heavy rain! Crop roots are drowning and yields are dropping.',
        correctPractice: 'drainage',
        practices: [
            { id: 'drainage', name: 'Drainage Water Management', desc: 'Control structures that raise or lower the water table as needed' },
            { id: 'cover-crops', name: 'Cover Crops', desc: 'Plant living roots to absorb excess water' },
            { id: 'prairie-strips', name: 'Prairie Strips', desc: 'Native grass strips within fields' },
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Woodchip filters for tile drainage' }
        ],
        successText: 'Drainage water management lets you control the water table! Crops can breathe again.'
    },
    4: {
        scenario: 'You need to filter nitrate runoff before it hits the creek! The community depends on this water.',
        correctPractice: 'bioreactors',
        practices: [
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Underground trenches filled with woodchips that break down nitrates' },
            { id: 'wetlands', name: 'Wetlands', desc: 'Constructed wetlands to filter water' },
            { id: 'saturated-buffers', name: 'Saturated Buffers', desc: 'Buffer strips along waterways' },
            { id: 'drainage', name: 'Drainage Management', desc: 'Water table control structures' }
        ],
        successText: 'The woodchip bioreactor removes nitrates naturally! Clean water flows to the creek.'
    },
    5: {
        scenario: 'Your soil is depleted after harvest season! The bare field is exposed to wind and rain.',
        correctPractice: 'cover-crops',
        practices: [
            { id: 'cover-crops', name: 'Cover Crops', desc: 'Plant rye, oats, or clover to protect and feed the soil over winter' },
            { id: 'prairie-strips', name: 'Prairie Strips', desc: 'Permanent native grass strips' },
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Underground nitrate filters' },
            { id: 'drainage', name: 'Drainage Management', desc: 'Water table control' }
        ],
        successText: 'Cover crops protect the soil, add organic matter, and feed soil organisms all winter!'
    },
    6: {
        scenario: 'Flooding threatens your lowland fields! Spring snowmelt overwhelms your drainage system every year.',
        correctPractice: 'wetlands',
        practices: [
            { id: 'wetlands', name: 'Wetlands', desc: 'Construct wetlands to absorb and slowly release floodwater' },
            { id: 'cover-crops', name: 'Cover Crops', desc: 'Plant living roots to absorb water' },
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Underground woodchip filters' },
            { id: 'saturated-buffers', name: 'Saturated Buffers', desc: 'Riparian buffer filtering' }
        ],
        successText: 'The wetland acts like a sponge, absorbing floodwater and releasing it slowly!'
    },
    7: {
        scenario: 'Your soil has no structure and compacts easily! Water pools on the surface instead of soaking in.',
        correctPractice: 'living-roots',
        practices: [
            { id: 'living-roots', name: 'Living Roots (Year-Round)', desc: 'Keep living plant roots in the soil every day of the year' },
            { id: 'bioreactors', name: 'Bioreactors', desc: 'Underground woodchip filters' },
            { id: 'saturated-buffers', name: 'Saturated Buffers', desc: 'Riparian buffer strips' },
            { id: 'wetlands', name: 'Wetlands', desc: 'Construct water storage areas' }
        ],
        successText: 'Living roots create channels for water, feed soil organisms, and build soil structure!'
    },
    8: {
        scenario: 'Pests are taking over - your monoculture corn field is under attack! Same pests year after year.',
        correctPractice: 'plant-diversity',
        practices: [
            { id: 'plant-diversity', name: 'Plant Diversity / Crop Rotation', desc: 'Rotate different crops each year to break pest cycles' },
            { id: 'cover-crops', name: 'Cover Crops', desc: 'Plant cover between cash crops' },
            { id: 'prairie-strips', name: 'Prairie Strips', desc: 'Native grass strips in fields' },
            { id: 'living-roots', name: 'Living Roots', desc: 'Year-round root systems' }
        ],
        successText: 'Crop rotation breaks pest cycles and plant diversity creates a balanced ecosystem!'
    }
};

// ============================================
// GAME 10: FOOD WEB - Tier Data
// ============================================
const FOOD_WEB_DATA = {
    sprouts: {
        title: 'Simple Food Web',
        organisms: [
            { id: 'plants', name: 'Plants', emoji: '🌱', desc: 'Make food from sunlight' },
            { id: 'bacteria', name: 'Bacteria', emoji: '🦠', desc: 'Break down dead things' },
            { id: 'earthworms', name: 'Earthworms', emoji: '🪱', desc: 'Eat soil and dead plants' },
            { id: 'birds', name: 'Birds', emoji: '🐦', desc: 'Eat worms and bugs' }
        ],
        connections: [
            { from: 'plants', to: 'bacteria', label: 'Dead plants feed bacteria' },
            { from: 'bacteria', to: 'earthworms', label: 'Worms eat bacteria' },
            { from: 'earthworms', to: 'birds', label: 'Birds eat worms' }
        ]
    },
    explorers: {
        title: 'Intermediate Food Web',
        organisms: [
            { id: 'plants', name: 'Plants', emoji: '🌱', desc: 'Producers - make food from sunlight' },
            { id: 'bacteria', name: 'Bacteria', emoji: '🦠', desc: 'Decomposers' },
            { id: 'fungi', name: 'Fungi', emoji: '🍄', desc: 'Decomposers' },
            { id: 'protozoa', name: 'Protozoa', emoji: '🔬', desc: 'Eat bacteria' },
            { id: 'earthworms', name: 'Earthworms', emoji: '🪱', desc: 'Eat organic matter' },
            { id: 'arthropods', name: 'Arthropods', emoji: '🐜', desc: 'Insects, spiders, mites' },
            { id: 'birds', name: 'Birds/Animals', emoji: '🐦', desc: 'Top predators' }
        ],
        connections: [
            { from: 'plants', to: 'bacteria' },
            { from: 'plants', to: 'fungi' },
            { from: 'bacteria', to: 'protozoa' },
            { from: 'bacteria', to: 'earthworms' },
            { from: 'fungi', to: 'arthropods' },
            { from: 'protozoa', to: 'arthropods' },
            { from: 'earthworms', to: 'birds' },
            { from: 'arthropods', to: 'birds' }
        ]
    },
    heroes: {
        title: 'Complete Soil Food Web',
        organisms: [
            { id: 'plants', name: 'Plants', emoji: '🌱', desc: 'Photosynthesis producers' },
            { id: 'organic', name: 'Organic Matter', emoji: '🍂', desc: 'Dead plant & animal material' },
            { id: 'bacteria', name: 'Bacteria', emoji: '🦠', desc: 'Primary decomposers' },
            { id: 'fungi', name: 'Fungi', emoji: '🍄', desc: 'Decompose complex materials' },
            { id: 'protozoa', name: 'Protozoa', emoji: '🔬', desc: 'Single-celled predators' },
            { id: 'nematodes', name: 'Nematodes', emoji: '🐍', desc: 'Microscopic roundworms' },
            { id: 'arthropods', name: 'Arthropods', emoji: '🐜', desc: 'Insects, mites, spiders' },
            { id: 'earthworms', name: 'Earthworms', emoji: '🪱', desc: 'Engineer the soil' },
            { id: 'birds', name: 'Birds/Animals', emoji: '🐦', desc: 'Top of the food web' }
        ],
        connections: [
            { from: 'plants', to: 'organic' },
            { from: 'organic', to: 'bacteria' },
            { from: 'organic', to: 'fungi' },
            { from: 'bacteria', to: 'protozoa' },
            { from: 'bacteria', to: 'nematodes' },
            { from: 'fungi', to: 'nematodes' },
            { from: 'fungi', to: 'arthropods' },
            { from: 'protozoa', to: 'nematodes' },
            { from: 'protozoa', to: 'arthropods' },
            { from: 'nematodes', to: 'arthropods' },
            { from: 'organic', to: 'earthworms' },
            { from: 'earthworms', to: 'birds' },
            { from: 'arthropods', to: 'birds' }
        ]
    }
};
