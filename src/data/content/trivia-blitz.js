/**
 * Soil Health Trivia Blitz — Content Data
 * Game 10: Harvest Guardians (Middle & High School)
 *
 * 9 topic rounds + 1 bonus endless mode
 * ~52 unique questions sourced from Youth Activities PDFs
 * + supplemental climate change & soil art/culture content
 */

export const LEVELS = [
  // ─── ROUND 1: Soil Health Principles (5 Qs) ───
  {
    id: 'soil-health-principles',
    title: 'Soil Health Principles',
    icon: '/assets/svg/principals-soil-cover.svg',
    questions: [
      {
        text: 'Which soil health principle involves keeping plant residues on the soil surface to minimize erosion?',
        choices: ['Living Roots', 'Soil Cover', 'Plant Diversity', 'Livestock Integration'],
        correct: 1,
        asset: '/assets/svg/principals-soil-cover.svg',
      },
      {
        text: 'Which principle keeps plants growing throughout the year to sequester carbon and feed the soil?',
        choices: ['Soil Cover', 'Limited Disturbance', 'Living Roots', 'Plant Diversity'],
        correct: 2,
        asset: '/assets/svg/soil-functions-plant.svg',
      },
      {
        text: 'Using cool and warm season grasses and three or more crops in rotation to mimic nature describes which principle?',
        choices: ['Livestock Integration', 'Living Roots', 'Limited Disturbance', 'Plant Diversity'],
        correct: 3,
        asset: '/assets/svg/principals-diversity.svg',
      },
      {
        text: 'Grazing fall/winter cover crops to increase soil biological activity and improve nutrient cycling is called what?',
        choices: ['Livestock Integration', 'Soil Cover', 'Living Roots', 'Limited Disturbance'],
        correct: 0,
        asset: '/assets/svg/principals-livestock.svg',
      },
      {
        text: 'Which principle focuses on minimizing physical, chemical, and biological disturbance to build soil aggregates and organic matter?',
        choices: ['Soil Cover', 'Plant Diversity', 'Livestock Integration', 'Limited Disturbance'],
        correct: 3,
        asset: '/assets/svg/tillage.svg',
      },
    ],
  },

  // ─── ROUND 2: Indigenous Farming (6 Qs) ───
  {
    id: 'indigenous-farming',
    title: 'Indigenous Farming',
    icon: '/assets/svg/indigenous farming-3sisters.svg',
    questions: [
      {
        text: 'Indigenous peoples in the Andes Mountains built flat areas along steep slopes for cultivation. What is this technique called?',
        choices: ['Chinampa', 'Terrace Farming', 'Dry Stone Walling', 'Floating Rice'],
        correct: 1,
        asset: '/assets/svg/indigenous farming-terrace.svg',
      },
      {
        text: 'The Mesoamerican farming system of intercropping maize, beans, and squash (the Three Sisters) is known as what?',
        choices: ['Polyculture', 'Chinampa', 'Milpa Agriculture', 'Dry Stone Walling'],
        correct: 2,
        asset: '/assets/svg/indigenous farming-3sisters.svg',
      },
      {
        text: 'An Amazon Rainforest approach of growing fruit trees, medicinal plants, and root vegetables together is called what?',
        choices: ['Milpa Agriculture', 'Floating Rice', 'Terrace Farming', 'Polyculture & Agroforestry'],
        correct: 3,
        asset: '/assets/svg/polyculture.svg',
      },
      {
        text: 'What are the artificial islands or floating gardens built on shallow lakes by the Aztec civilization called?',
        choices: ['Chinampas', 'Terraces', 'Prairie Strips', 'Stone Walls'],
        correct: 0,
        asset: '/assets/svg/indigenous farming-chinampa.svg',
      },
      {
        text: 'In the Mediterranean region, farmers built stone walls on hilly terrain to retain soil. What is this technique?',
        choices: ['Terrace Farming', 'Chinampa', 'Floating Rice', 'Dry Stone Walling'],
        correct: 3,
        asset: '/assets/svg/indigenous farming-stone-wall.svg',
      },
      {
        text: 'Which traditional rice cultivation approach, used in Southeast Asia, is adapted to local landscapes and water systems?',
        choices: ['Milpa Agriculture', 'Floating Rice', 'Polyculture', 'Chinampa'],
        correct: 1,
        asset: '/assets/svg/indigenous farming-floating.svg',
      },
    ],
  },

  // ─── ROUND 3: CLORPT + Soil Formation (5 Qs) ───
  {
    id: 'clorpt-soil-formation',
    title: 'CLORPT & Soil Formation',
    icon: '/assets/svg/CLORP-climate.svg',
    questions: [
      {
        text: 'In CLORPT, which factor refers to weather over a long period of time? Soils develop fastest in warm, moist conditions.',
        choices: ['Organisms', 'Relief', 'Climate', 'Time'],
        correct: 2,
        asset: '/assets/svg/CLORP-climate.svg',
      },
      {
        text: 'Which CLORPT factor describes how plant roots, burrowing animals, and bacteria change how soil forms?',
        choices: ['Parent Material', 'Climate', 'Relief', 'Organisms'],
        correct: 3,
        asset: '/assets/svg/CLORP-organisms.svg',
      },
      {
        text: 'The shape of the land, including how much sunlight and water soil gets based on which direction a hill faces, is called what in CLORPT?',
        choices: ['Relief', 'Climate', 'Time', 'Parent Material'],
        correct: 0,
        asset: '/assets/svg/CLORP-relief.svg',
      },
      {
        text: 'Which CLORPT factor describes the properties of the material in which soil forms, such as weathering rock or a dry lake bed?',
        choices: ['Time', 'Relief', 'Parent Material', 'Organisms'],
        correct: 2,
        asset: '/assets/svg/CLORP-parent-material.svg',
      },
      {
        text: 'Why do older soils differ from younger soils according to CLORPT?',
        choices: [
          'They have more organisms',
          'They had more time to develop',
          'They receive more rain',
          'They are closer to bedrock',
        ],
        correct: 1,
        asset: '/assets/svg/CLORP-time.svg',
      },
    ],
  },

  // ─── ROUND 4: Soil Biology & Food Web (7 Qs) ───
  {
    id: 'soil-biology',
    title: 'Soil Biology & Food Web',
    icon: '/assets/svg/bacteria1.svg',
    questions: [
      {
        text: 'Which soil organisms are single-celled, microscopic, and range in shape from spheres to rods to spirals?',
        choices: ['Nematodes', 'Protozoa', 'Bacteria', 'Rotifers'],
        correct: 2,
        asset: '/assets/svg/bacteria1.svg',
      },
      {
        text: 'Which long, thin, segmented animals move through the soil, aerating and enriching it?',
        choices: ['Nematodes', 'Earthworms', 'Springtails', 'Mites'],
        correct: 1,
        asset: '/assets/svg/worm.svg',
      },
      {
        text: 'Which eight-legged soil animals are too small to see without magnification and feed on smaller organisms?',
        choices: ['Springtails', 'Rotifers', 'Nematodes', 'Mites'],
        correct: 3,
        asset: '/assets/svg/mite.svg',
      },
      {
        text: 'Which tiny, non-segmented worm-like organisms mostly live on other organisms or soil organic matter?',
        choices: ['Earthworms', 'Nematodes', 'Bacteria', 'Protozoa'],
        correct: 1,
        asset: '/assets/svg/nematode.svg',
      },
      {
        text: 'Which single-celled organisms are larger than bacteria, move in water films, and feed on bacteria and organic matter?',
        choices: ['Rotifers', 'Fungi', 'Protozoa', 'Springtails'],
        correct: 2,
        asset: '/assets/svg/protozoa.svg',
      },
      {
        text: 'Which microscopic animals found in moist soil and freshwater move by swimming or crawling?',
        choices: ['Mites', 'Rotifers', 'Arthropods', 'Bacteria'],
        correct: 1,
        asset: '/assets/svg/rotifer.svg',
      },
      {
        text: 'Which six-legged soil animals have a tail-like structure folded beneath the body used for jumping when threatened?',
        choices: ['Springtails', 'Mites', 'Nematodes', 'Protozoa'],
        correct: 0,
        asset: '/assets/svg/springtail.svg',
      },
    ],
  },

  // ─── ROUND 5: Agronomy Careers (6 Qs) ───
  {
    id: 'agronomy-careers',
    title: 'Agronomy Careers',
    icon: null,
    questions: [
      {
        text: 'Which career involves running complex agricultural businesses and using market conditions, disease, and soil to decide how to raise crops?',
        choices: ['Seed Analyst', 'Farm Manager', 'Plant Breeder', 'Specialist'],
        correct: 1,
        asset: null,
        emoji: '📋📈🌽',
      },
      {
        text: 'Which career analyzes characteristics of forest soil and researches the ability to survive in differentiated conditions?',
        choices: ['Climatologist', 'Engineer', 'Forest Soil Scientist', 'Specialist'],
        correct: 2,
        asset: null,
        emoji: '🌳🔬🌲',
      },
      {
        text: 'Which career evaluates seed samples for purity, variety, and germination?',
        choices: ['Plant Breeder', 'Farm Manager', 'Specialist', 'Seed Analyst'],
        correct: 3,
        asset: null,
        emoji: '🔬🌱✨',
      },
      {
        text: 'Which career studies climate change, climate variability, and the effects of climate on the biosphere using computer models?',
        choices: ['Engineer', 'Climatologist', 'Seed Analyst', 'Farm Manager'],
        correct: 1,
        asset: null,
        emoji: '🌤️🖥️🌍',
      },
      {
        text: 'Which career studies seed characteristics and works to improve the most desirable traits for a plant?',
        choices: ['Seed Analyst', 'Forest Soil Scientist', 'Plant Breeder', 'Climatologist'],
        correct: 2,
        asset: null,
        emoji: '🧬🌾🥕',
      },
      {
        text: 'There are Biological, Environmental, and Agricultural types of which agronomy career?',
        choices: ['Specialist', 'Farm Manager', 'Engineer', 'Seed Analyst'],
        correct: 2,
        asset: null,
        emoji: '⚙️🌳🧬',
      },
    ],
  },

  // ─── ROUND 6: Carbon Cycle (6 Qs) ───
  {
    id: 'carbon-cycle',
    title: 'Carbon Cycle',
    icon: '/assets/svg/soil-carbon-store.svg',
    questions: [
      {
        text: 'Which of these is a way we STORE carbon in the soil?',
        choices: ['Burning', 'Plowing', 'Tree roots', 'Deforestation'],
        correct: 2,
        asset: '/assets/svg/soil-carbon-store.svg',
      },
      {
        text: 'Which activity RELEASES carbon from the soil into the atmosphere?',
        choices: ['No-till farming', 'Plowing', 'Planting trees', 'Adding organic matter'],
        correct: 1,
        asset: '/assets/svg/soil-carbon-release.svg',
      },
      {
        text: 'How does deforestation affect the carbon cycle?',
        choices: [
          'It stores more carbon in soil',
          'It releases stored carbon',
          'It has no effect',
          'It increases organic matter',
        ],
        correct: 1,
        asset: '/assets/svg/soil-carbon-release.svg',
      },
      {
        text: 'Which farming practice helps store carbon by reducing soil disturbance?',
        choices: ['Deep plowing', 'Burning fields', 'No-till farming', 'Removing crop residues'],
        correct: 2,
        asset: '/assets/svg/soil-carbon-store.svg',
      },
      {
        text: 'Adding organic matter to soil helps with carbon storage. What is organic matter?',
        choices: [
          'Rocks and minerals',
          'Decomposed plant and animal material',
          'Sand and gravel',
          'Synthetic fertilizer',
        ],
        correct: 1,
        asset: '/assets/svg/soil-carbon-store.svg',
      },
      {
        text: 'Livestock contribute to carbon release through which process?',
        choices: [
          'Grazing cover crops',
          'Methane emissions and soil compaction',
          'Spreading seeds',
          'Aerating the soil',
        ],
        correct: 1,
        asset: '/assets/svg/soil-carbon-release.svg',
      },
    ],
  },

  // ─── ROUND 7: Soil Art & Culture (6 Qs) ───
  {
    id: 'soil-art-culture',
    title: 'Soil Art & Culture',
    icon: '/assets/svg/soil and culture-mudcloth.svg',
    questions: [
      {
        text: 'Bògòlanfini (mudcloth) is a West African textile dyed with fermented mud. What natural element gives it its dark brown color?',
        choices: ['Charcoal', 'Iron-rich soil', 'Tree bark', 'Volcanic ash'],
        correct: 1,
        asset: '/assets/svg/soil and culture-mudcloth.svg',
      },
      {
        text: 'Ochre, one of the oldest art pigments used by humans, is made from what earth material?',
        choices: ['Calcium carbonate', 'Iron oxide-rich clay', 'Crushed quartz', 'Plant resins'],
        correct: 1,
        asset: '/assets/svg/soil and culture-ochre.svg',
      },
      {
        text: 'Ancient pottery is made primarily from which soil component that becomes moldable when wet?',
        choices: ['Sand', 'Silt', 'Clay', 'Gravel'],
        correct: 2,
        asset: '/assets/svg/soil and culture-pottery.svg',
      },
      {
        text: 'Which ancient civilization used ground minerals from the earth, including galena and malachite, for eye makeup (kohl)?',
        choices: ['Romans', 'Egyptians', 'Greeks', 'Mayans'],
        correct: 1,
        asset: '/assets/svg/soil and culture-makeup.svg',
      },
      {
        text: 'What property of clay makes it ideal for both pottery and building bricks?',
        choices: [
          'It dissolves in water',
          'It is moldable when wet and hardens when dried or fired',
          'It is always soft',
          'It repels water naturally',
        ],
        correct: 1,
        asset: '/assets/svg/soil and culture-pottery.svg',
      },
      {
        text: 'Many ancient textile dyeing traditions, like indigo and mudcloth, rely on soil-based materials. What do these traditions show about the relationship between soil and culture?',
        choices: [
          'Soil is only useful for farming',
          'Earth materials have been central to human art and identity for thousands of years',
          'Only modern societies use soil-based dyes',
          'Soil pigments are less durable than synthetic ones',
        ],
        correct: 1,
        asset: '/assets/svg/soil and culture-mudcloth.svg',
      },
    ],
  },

  // ─── ROUND 8: Climate Change (5 Qs) ───
  {
    id: 'climate-change',
    title: 'Climate Change',
    icon: '/assets/svg/CLORP-climate.svg',
    questions: [
      {
        text: 'Which soil region stores the most carbon but is at risk from thawing due to climate change?',
        choices: ['Desert', 'Prairie', 'Tundra (permafrost)', 'Tropical'],
        correct: 2,
        asset: '/assets/svg/soil-regions-tundra.svg',
      },
      {
        text: 'How does climate change affect soil organic matter?',
        choices: [
          'It has no effect',
          'It slows decomposition, increasing storage',
          'It accelerates decomposition, reducing carbon storage',
          'It turns organic matter into rock',
        ],
        correct: 2,
        asset: '/assets/svg/spheres - atmosphere.svg',
      },
      {
        text: 'Approximately what fraction of the world\'s arable (farmable) land is currently degraded?',
        choices: ['About one-tenth', 'Over one-third', 'About half', 'Less than 5%'],
        correct: 1,
        asset: '/assets/svg/ag productivity map png.svg',
      },
      {
        text: 'Which type of agriculture uses cover crops, no-till, and crop rotation to improve soil health while addressing climate change?',
        choices: ['Industrial agriculture', 'Conservation agriculture', 'Slash-and-burn', 'Monoculture farming'],
        correct: 1,
        asset: '/assets/svg/prek maze objects-watering.svg',
      },
      {
        text: 'Studies show conservation agriculture improves soil health by approximately what percentage compared to conventional farming?',
        choices: ['About 5%', 'About 20%', 'About 50%', 'About 75%'],
        correct: 1,
        asset: '/assets/svg/soil-functions-plant.svg',
      },
    ],
  },

  // ─── ROUND 9: Soil Regions (6 Qs) ───
  {
    id: 'soil-regions',
    title: 'Soil Regions',
    icon: '/assets/svg/soil regions-prairie.svg',
    questions: [
      {
        text: 'In which soil region does moisture from rain or snow evaporate faster than it replenishes? These can be in both warm and cool places.',
        choices: ['Wetland', 'Prairie', 'Desert', 'Tropical'],
        correct: 2,
        asset: '/assets/svg/soil regions-desert.svg',
      },
      {
        text: 'Which soils are very productive and make up the world\'s "breadbaskets" where many types of grains are grown?',
        choices: ['Tropical', 'Desert', 'Tundra', 'Prairie'],
        correct: 3,
        asset: '/assets/svg/soil regions-prairie.svg',
      },
      {
        text: 'Temperate forests store large amounts of carbon in trees and soil organic matter. What happens when they are cut down?',
        choices: [
          'Carbon storage increases',
          'Nothing changes',
          'They release the stored carbon',
          'New soil forms immediately',
        ],
        correct: 2,
        asset: '/assets/svg/soil regions-forests.svg',
      },
      {
        text: 'Which soils are found in all regions, protect against floods, and help clean out pollutants?',
        choices: ['Desert', 'Tundra', 'Prairie', 'Wetland'],
        correct: 3,
        asset: '/assets/svg/soil regions-wetland.svg',
      },
      {
        text: 'Tundra soils have a frozen layer that can prevent trees from growing deep roots. What is this layer called?',
        choices: ['Bedrock', 'Hardpan', 'Permafrost', 'Clay pan'],
        correct: 2,
        asset: '/assets/svg/soil regions-tundra.svg',
      },
      {
        text: 'Tropical soils are lush but break down minerals and organic matter quickly. What does this mean for their long-term fertility?',
        choices: [
          'They are the most fertile soils on Earth',
          'They are not very fertile despite looking lush',
          'They never lose fertility',
          'They only grow tropical fruits',
        ],
        correct: 1,
        asset: '/assets/svg/soil regions-tropical.svg',
      },
    ],
  },
]

export const INSTRUCTIONS = {
  intro: 'Welcome to Soil Health Trivia Blitz! Test your knowledge across 9 soil health & agriculture categories. Answer fast for bonus points!',
  topicMode: 'Answer questions in each category. You have 60 seconds per round — go!',
  endlessMode: 'Random questions from all categories. One wrong answer and it\'s game over! How far can you get?',
  completion: 'You conquered all 9 trivia categories! You\'re a true Soil Health expert!',
}
