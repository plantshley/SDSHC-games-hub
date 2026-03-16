/**
 * Spin the Soil Wheel — Content Data
 * Game 6: Meadow Makers (3rd-5th Grade)
 * 7 categories, ~41 questions total
 * All content sourced from Youth Activities PDFs / Clues & Answers
 */

export const CATEGORIES = [
  {
    id: 'clorpt',
    title: 'CLORPT',
    questions: [
      {
        text: "What does the 'C' in CLORPT stand for?",
        choices: ['Carbon', 'Climate', 'Clay', 'Crops'],
        correct: 1,
      },
      {
        text: 'Which CLORPT factor includes plant roots, burrowing animals, and bacteria that help break down soil?',
        choices: ['Relief', 'Time', 'Organisms', 'Parent Material'],
        correct: 2,
      },
      {
        text: "In CLORPT, 'Relief' refers to what?",
        choices: ['Rainfall amount', 'The shape of the land', 'Soil temperature', 'Rock hardness'],
        correct: 1,
      },
      {
        text: 'What does "Parent Material" describe in soil formation?',
        choices: ['The age of the soil', 'The material soil forms from, like rock or lake beds', 'The plants growing in soil', 'The color of topsoil'],
        correct: 1,
      },
      {
        text: "Why do older soils differ from younger soils according to the 'T' in CLORPT?",
        choices: ['They have different parent materials', 'They are always darker', 'They have had more time to develop', 'They contain more sand'],
        correct: 2,
      },
    ],
  },
  {
    id: 'plant-parts',
    title: 'Plant Parts',
    questions: [
      {
        text: 'A banana, apple, and tomato are all examples of which plant part we eat?',
        choices: ['Root', 'Fruit', 'Stem', 'Leaf'],
        correct: 1,
      },
      {
        text: 'Lettuce, cabbage, and spinach are all which plant part?',
        choices: ['Flower', 'Stem', 'Leaf', 'Seed'],
        correct: 2,
      },
      {
        text: 'Celery and asparagus are examples of eating which plant part?',
        choices: ['Root', 'Leaf', 'Seed', 'Stem'],
        correct: 3,
      },
      {
        text: 'Broccoli and artichoke are which part of the plant?',
        choices: ['Flower', 'Tuber', 'Root', 'Leaf'],
        correct: 0,
      },
      {
        text: 'Rice, peas, and popcorn are all examples of which plant part?',
        choices: ['Fruit', 'Root', 'Seed', 'Stem'],
        correct: 2,
      },
      {
        text: 'A carrot and radish are examples of eating which plant part?',
        choices: ['Tuber', 'Root', 'Bulb', 'Stem'],
        correct: 1,
      },
      {
        text: 'A potato is an enlarged underground stem that stores food. What is it called?',
        choices: ['Root', 'Bulb', 'Tuber', 'Seed'],
        correct: 2,
      },
    ],
  },
  {
    id: 'cover-crops',
    title: 'Cover Crops',
    questions: [
      {
        text: 'What are cover crops planted in addition to?',
        choices: ['Weeds', 'A cash crop', 'Trees', 'Flowers'],
        correct: 1,
      },
      {
        text: 'Which of these is a benefit of cover crops?',
        choices: ['They prevent nutrient loss from soil', 'They increase erosion', 'They remove earthworms', 'They dry out the soil'],
        correct: 0,
      },
      {
        text: 'Which of these is an example of a cover crop?',
        choices: ['Corn', 'Rye', 'Cotton', 'Tobacco'],
        correct: 1,
      },
      {
        text: 'Cover crops help soil by providing what throughout much of the year?',
        choices: ['Shade for animals', 'Living roots', 'Extra water', 'Fallen leaves'],
        correct: 1,
      },
      {
        text: 'Which cover crop is also commonly used as a grain?',
        choices: ['Sunflower', 'Clover', 'Oats', 'Alfalfa'],
        correct: 2,
      },
    ],
  },
  {
    id: 'earth-spheres',
    title: "Earth's Spheres",
    questions: [
      {
        text: "Which sphere is the soil layer?",
        choices: ['Geosphere', 'Hydrosphere', 'Pedosphere', 'Biosphere'],
        correct: 2,
      },
      {
        text: "Which sphere includes rocks and minerals?",
        choices: ['Atmosphere', 'Geosphere', 'Pedosphere', 'Hydrosphere'],
        correct: 1,
      },
      {
        text: "Which sphere includes all of Earth's water?",
        choices: ['Hydrosphere', 'Biosphere', 'Atmosphere', 'Geosphere'],
        correct: 0,
      },
      {
        text: "Which sphere includes all living organisms?",
        choices: ['Pedosphere', 'Atmosphere', 'Geosphere', 'Biosphere'],
        correct: 3,
      },
      {
        text: 'Which sphere is the layer of air that surrounds our planet?',
        choices: ['Hydrosphere', 'Pedosphere', 'Atmosphere', 'Biosphere'],
        correct: 2,
      },
    ],
  },
  {
    id: 'soil-biology',
    title: 'Soil Biology',
    questions: [
      {
        text: 'Which single-celled organisms are microscopic and come in shapes like spheres, rods, and spirals?',
        choices: ['Nematodes', 'Bacteria', 'Mites', 'Springtails'],
        correct: 1,
      },
      {
        text: 'Which long, segmented animals move through soil, aerating and enriching it?',
        choices: ['Nematodes', 'Rotifers', 'Earthworms', 'Springtails'],
        correct: 2,
      },
      {
        text: 'Which eight-legged soil creatures are too small to see without magnification?',
        choices: ['Springtails', 'Mites', 'Earthworms', 'Protozoa'],
        correct: 1,
      },
      {
        text: 'Which tiny, non-segmented worm-like organisms live on other organisms or soil organic matter?',
        choices: ['Earthworms', 'Rotifers', 'Nematodes', 'Bacteria'],
        correct: 2,
      },
      {
        text: 'Which single-celled organisms are larger than bacteria and move in water films?',
        choices: ['Mites', 'Springtails', 'Nematodes', 'Protozoa'],
        correct: 3,
      },
      {
        text: 'Which microscopic animals are found in freshwater and moist soil, moving by swimming or crawling?',
        choices: ['Rotifers', 'Bacteria', 'Mites', 'Earthworms'],
        correct: 0,
      },
      {
        text: 'Which six-legged soil creatures have a tail-like structure they use for jumping when threatened?',
        choices: ['Nematodes', 'Protozoa', 'Mites', 'Springtails'],
        correct: 3,
      },
    ],
  },
  {
    id: 'soil-regions',
    title: 'Soil Regions',
    questions: [
      {
        text: 'In which soil region does moisture evaporate faster than it replenishes?',
        choices: ['Prairie', 'Forest', 'Desert', 'Wetland'],
        correct: 2,
      },
      {
        text: "Which soil region makes up the world's 'breadbaskets' where many grains are grown?",
        choices: ['Tropical', 'Prairie', 'Tundra', 'Wetland'],
        correct: 1,
      },
      {
        text: 'Which region stores large amounts of carbon in trees and soil organic matter?',
        choices: ['Desert', 'Tundra', 'Tropical', 'Forest'],
        correct: 3,
      },
      {
        text: 'Which soil region helps protect against floods and cleans out pollutants?',
        choices: ['Wetland', 'Desert', 'Prairie', 'Forest'],
        correct: 0,
      },
      {
        text: 'Tundra soils have a frozen layer that prevents deep root growth. What is it called?',
        choices: ['Bedrock', 'Permafrost', 'Clay pan', 'Hardpan'],
        correct: 1,
      },
      {
        text: 'Which soil region has lush growth but breaks down organic matter so quickly that soils are not very fertile?',
        choices: ['Prairie', 'Forest', 'Desert', 'Tropical'],
        correct: 3,
      },
    ],
  },
  {
    id: 'soil-art',
    title: 'Soil Art & Culture',
    questions: [
      {
        text: 'Mudcloth (bògòlanfini) is a West African textile dyed with fermented mud. What gives it its dark color?',
        choices: ['Charcoal', 'Iron-rich soil', 'Plant dye', 'Volcanic ash'],
        correct: 1,
      },
      {
        text: 'Ochre, one of the oldest art pigments, is made from what earth material?',
        choices: ['Sand', 'Limestone', 'Iron oxide-rich clay', 'Volcanic glass'],
        correct: 2,
      },
      {
        text: 'Ancient pottery is made primarily from which soil component?',
        choices: ['Sand', 'Gravel', 'Clay', 'Silt'],
        correct: 2,
      },
      {
        text: 'Which ancient civilization used ground earth minerals for eye makeup (kohl)?',
        choices: ['Romans', 'Vikings', 'Egyptians', 'Aztecs'],
        correct: 2,
      },
      {
        text: 'What property makes clay ideal for pottery and bricks?',
        choices: ['It dissolves in water', 'It glows in the dark', 'It is moldable when wet and hardens when fired', 'It floats on water'],
        correct: 2,
      },
      {
        text: 'Many ancient dyeing traditions use soil-based materials. What does this show about soil and culture?',
        choices: ['Soil is only useful for farming', 'Earth materials have been central to human art for thousands of years', 'People only recently started using soil', 'Soil cannot be used for art'],
        correct: 1,
      },
    ],
  },
]

export const WHEEL_SLICES = [50, 'steal', 100, 150, 'wild', 300, 200, 100, 150, 200]

export const WIN_THRESHOLD = 800

export const PLANT_STAGES = [
  { threshold: 0, asset: '/assets/sprites/Basic_Plants_fruit-grow2.png' },
  { threshold: 300, asset: '/assets/sprites/Basic_Plants_fruit-grow3.png' },
  { threshold: 600, asset: '/assets/sprites/Basic_Plants_fruit-grow4.png' },
]

export const PLAYER_NAMES = {
  adjectives: ['Sunny', 'Mossy', 'Dewy', 'Breezy', 'Cozy', 'Fuzzy', 'Leafy', 'Rosy', 'Misty', 'Peppy', 'Tiny', 'Lucky'],
  nouns: ['Sprout', 'Pebble', 'Daisy', 'Acorn', 'Fern', 'Clover', 'Willow', 'Cricket', 'Ladybug', 'Mushroom', 'Buttercup', 'Seedling'],
}

export const PLAYER_COLORS = ['#ff8fb2', '#a6c264', '#38cebc', '#e4c84a']

export const INSTRUCTIONS = {
  intro: "Welcome to Spin the Soil Wheel! Spin the wheel, pick a category, and answer soil trivia to grow your plant. Watch out for special slices — Steal and Wild Card! The first to fully grow their plant wins!",
  completion: "Amazing job! You've answered soil trivia like a true Meadow Maker!",
}
