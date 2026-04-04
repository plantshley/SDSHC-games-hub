/**
 * Drag & Drop Match — content data
 *
 * 6 levels in two modes:
 *   Mode A (word-to-image): Levels 1, 2, 3, 4
 *   Mode B (word-to-position): Levels 5, 6
 */

export const LEVELS = [
  // ── Level 1: Soil Functions ──
  {
    id: 'soil-functions',
    title: 'Soil Functions',
    mode: 'word-to-image',
    items: [
      {
        id: 'organisms',
        label: 'ORGANISMS',
        image: '/assets/svg/CLORP-organisms.svg',
        clue: 'Sustains soil _____',
        fact: 'Soil is home to about 25% of all species on Earth! From tiny bacteria to earthworms, healthy soil teems with life.',
      },
      {
        id: 'plant',
        label: 'PLANT',
        image: '/assets/svg/soil-functions-plant.svg',
        clue: 'Sustains _____ life',
        fact: 'Soil provides plants with water, nutrients, and a place to anchor their roots. Without soil, most plants could not survive.',
      },
      {
        id: 'nutrients',
        label: 'NUTRIENTS',
        image: '/assets/svg/soil-functions-nutrient.svg',
        clue: 'Stores and cycles _____',
        fact: 'Soil stores essential nutrients like nitrogen, phosphorus, and potassium, then releases them slowly for plants to use.',
      },
      {
        id: 'atmospheric',
        label: 'ATMOSPHERIC',
        image: '/assets/svg/CLORP-climate.svg',
        clue: 'Buffers _____ pollutants',
        fact: 'Soil acts like a filter, trapping and breaking down air pollutants before they can reach groundwater or streams.',
      },
      {
        id: 'water',
        label: 'WATER',
        image: '/assets/svg/soil-functions-watercycle.svg',
        clue: 'Filters and cleans _____',
        fact: 'As water moves through soil, particles and microbes remove contaminants — soil is nature\'s water purifier!',
      },
    ],
  },

  // ── Level 2: Earth Spheres ──
  {
    id: 'earth-spheres',
    title: 'Earth Spheres',
    mode: 'word-to-image',
    items: [
      {
        id: 'pedosphere',
        label: 'PEDOSPHERE',
        image: '/assets/svg/spheres - pedo.svg',
        clue: 'The soil sphere',
        fact: 'The pedosphere is the outermost layer of Earth made up of soil. It is where the other four spheres interact and overlap.',
      },
      {
        id: 'geosphere',
        label: 'GEOSPHERE',
        image: '/assets/svg/spheres - geo.svg',
        clue: 'The rock and land sphere',
        fact: 'The geosphere includes all of Earth\'s rocks, minerals, and landforms — from mountain peaks to the deep inner core.',
      },
      {
        id: 'atmosphere',
        label: 'ATMOSPHERE',
        image: '/assets/svg/spheres - atmosphere.svg',
        clue: 'The air sphere',
        fact: 'The atmosphere is the blanket of gases surrounding Earth. It provides the oxygen we breathe and protects us from the Sun\'s harmful rays.',
      },
      {
        id: 'hydrosphere',
        label: 'HYDROSPHERE',
        image: '/assets/svg/spheres - hydro.svg',
        clue: 'The water sphere',
        fact: 'The hydrosphere includes all water on Earth — oceans, rivers, glaciers, and even water vapor in the air.',
      },
      {
        id: 'biosphere',
        label: 'BIOSPHERE',
        image: '/assets/svg/spheres - bio.svg',
        clue: 'The living things sphere',
        fact: 'The biosphere includes every living organism on Earth, from microscopic bacteria in the soil to giant whales in the ocean.',
      },
    ],
  },

  // ── Level 3: Soil, Art, & Culture ──
  {
    id: 'soil-culture',
    title: 'Soil, Art, & Culture',
    mode: 'word-to-image',
    items: [
      {
        id: 'mudcloth',
        label: 'MUDCLOTH',
        image: '/assets/svg/soil and culture-mudcloth.svg',
        clue: 'Traditional West African fabric dyed with fermented mud',
        fact: 'Mudcloth (bògolan) is a centuries-old West African textile tradition. Artists paint patterns with fermented river mud that permanently dyes the cotton fabric.',
      },
      {
        id: 'ochre',
        label: 'OCHRE',
        image: '/assets/svg/soil and culture-ochre.svg',
        clue: 'Natural earth pigment used in ancient cave paintings',
        fact: 'Ochre is a natural clay pigment that has been used by humans for over 100,000 years — it is one of the oldest art materials known.',
      },
      {
        id: 'pottery',
        label: 'POTTERY',
        image: '/assets/svg/soil and culture-pottery.svg',
        clue: 'Vessels and art shaped from clay and fired in kilns',
        fact: 'Pottery is made from clay found in soil. The oldest known pottery dates back over 20,000 years and was used to store food and water.',
      },
      {
        id: 'code',
        label: 'CODE',
        image: '/assets/svg/soil and culture-code.svg',
        clue: 'Digital tools that help scientists study and map soils',
        fact: 'Soil scientists use computer code to analyze soil data, create digital maps, and predict how soils will respond to climate change.',
      },
      {
        id: 'makeup',
        label: 'MAKEUP',
        image: '/assets/svg/soil and culture-makeup.svg',
        clue: 'Cosmetics made from minerals found in soil',
        fact: 'Many cosmetics contain minerals mined from soil, like iron oxide for red lipstick and mica for shimmery eyeshadow.',
      },
    ],
  },

  // ── Level 4: Indigenous Farming Practices ──
  {
    id: 'indigenous-farming',
    title: 'Indigenous Farming',
    mode: 'word-to-image',
    items: [
      {
        id: 'terrace',
        label: 'TERRACE FARMING',
        image: '/assets/svg/indigenous farming-terrace.svg',
        clue: 'Stepped hillside agriculture in mountainous regions',
        fact: 'Indigenous peoples in the Andes Mountains built terraces along steep slopes to create flat areas for growing crops — a technique over 6,000 years old.',
      },
      {
        id: 'milpa',
        label: 'MILPA AGRICULTURE',
        image: '/assets/svg/indigenous farming-3sisters.svg',
        clue: 'Intercropping the three sisters: maize, beans, and squash',
        fact: 'Milpa is a Mesoamerican farming system where corn, beans, and squash grow together. Each plant helps the others — beans fix nitrogen, corn gives support, and squash shades the soil.',
      },
      {
        id: 'polyculture',
        label: 'POLYCULTURE',
        image: '/assets/svg/polyculture.svg',
        clue: 'Growing multiple crops together in the same area',
        fact: 'In the Amazon Rainforest, Indigenous peoples grow fruit trees, medicinal plants, and root vegetables together — mimicking the natural forest ecosystem.',
      },
      {
        id: 'chinampa',
        label: 'CHINAMPA',
        image: '/assets/svg/indigenous farming-chinampa.svg',
        clue: 'Floating gardens built on shallow lakes by the Aztecs',
        fact: 'Chinampas are artificial islands built on shallow lakes. The Aztec civilization used them to grow food year-round on the water.',
      },
      {
        id: 'stone-wall',
        label: 'DRY STONE WALLING',
        image: '/assets/svg/indigenous farming-stone-wall.svg',
        clue: 'Stone walls on hilly terrain to retain soil',
        fact: 'Mediterranean farmers built stone walls on rocky hillsides without mortar. These walls prevent soil erosion and create microclimates for growing grapes and olives.',
      },
      {
        id: 'floating-rice',
        label: 'FLOATING RICE',
        image: '/assets/svg/indigenous farming-floating.svg',
        clue: 'Traditional rice cultivation adapted to Southeast Asian waterways',
        fact: 'In Southeast Asia, farmers grow rice varieties that can grow in deep water by elongating their stems — adapting agriculture to natural flooding patterns.',
      },
    ],
  },

  // ── Level 5: Ways We Store Carbon ──
  {
    id: 'carbon-store',
    title: 'Ways We Store Carbon',
    mode: 'word-to-position',
    diagram: '/assets/svg/soil-carbon-store.svg',
    items: [
      {
        id: 'trees',
        label: 'Trees',
        snapX: 30, snapY: 23,
        fact: 'Trees absorb carbon dioxide from the air and store it in their wood, leaves, and roots. A single tree can store hundreds of pounds of carbon!',
      },
      {
        id: 'no-till',
        label: 'No-till',
        snapX: 61, snapY: 55,
        fact: 'No-till farming leaves the soil undisturbed, keeping carbon locked underground instead of releasing it into the atmosphere.',
      },
      {
        id: 'healthy-air',
        label: 'Healthy Air',
        snapX: 68, snapY: 24,
        fact: 'When we store more carbon in soil and plants, the air stays healthier because less carbon dioxide enters the atmosphere.',
      },
      {
        id: 'roots',
        label: 'Roots',
        snapX: 19, snapY: 61,
        fact: 'Plant roots pump carbon deep into the soil. Some root carbon can stay stored underground for thousands of years.',
      },
      {
        id: 'organic-matter',
        label: 'Organic Matter',
        snapX: 52, snapY: 84,
        fact: 'Organic matter in soil — decomposing leaves, roots, and microbes — is one of the largest carbon stores on Earth.',
      },
    ],
  },

  // ── Level 6: Ways We Release Carbon ──
  {
    id: 'carbon-release',
    title: 'Ways We Release Carbon',
    mode: 'word-to-position',
    diagram: '/assets/svg/soil carbon2 - release.svg',
    items: [
      {
        id: 'plowing',
        label: 'Plowing',
        snapX: 80, snapY: 40,
        fact: 'Plowing breaks apart soil, exposing stored carbon to oxygen. This causes carbon to escape into the atmosphere as CO₂.',
      },
      {
        id: 'deforestation',
        label: 'Deforestation',
        snapX: 23, snapY: 86,
        fact: 'Cutting down forests releases the carbon stored in trees and soil. Deforestation is one of the largest sources of carbon emissions worldwide.',
      },
      {
        id: 'burning',
        label: 'Burning',
        snapX: 55, snapY: 29,
        fact: 'Burning crop residues or fossil fuels releases stored carbon directly into the air as carbon dioxide and other greenhouse gases.',
      },
      {
        id: 'livestock',
        label: 'Livestock',
        snapX: 25, snapY: 32,
        fact: 'Livestock release carbon through digestion and manure. Managing grazing carefully can help reduce these emissions.',
      },
    ],
  },
]

export const INSTRUCTIONS = {
  intro: 'Can you match each word to the right picture? Drag and drop to discover how soil works!',
  gameplayMatch: 'Drag each word to the matching image!',
  gameplayDiagram: 'Drag each label to the correct spot on the diagram!',
  complete: 'Amazing work! You matched them all!',
}
