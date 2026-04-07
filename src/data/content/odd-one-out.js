/**
 * Odd One Out — content data
 *
 * 4 levels × 5 rounds each: fast-paced classification.
 * 3rd-5th grade — timed rounds with explanations.
 */

export const LEVELS = [
  // ── Level 1: Plant Parts ──
  {
    id: 'plant-parts',
    title: 'Plant Parts',
    rounds: [
      {
        items: [
          { id: 'carrot', label: 'Carrot', asset: '/assets/sprites/carrot-pixel.png' },
          { id: 'radish', label: 'Radish', asset: '/assets/sprites/radish-pixel.png' },
          { id: 'onion', label: 'Onion', asset: '/assets/sprites/onion-pixel.png' },
          { id: 'lettuce', label: 'Lettuce', asset: '/assets/sprites/lettuce-pixel2.png' },
        ],
        answer: 'lettuce',
        explanation: 'The rest are all roots! Lettuce is a leaf.',
      },
      {
        items: [
          { id: 'broccoli', label: 'Broccoli', asset: '/assets/sprites/artichoke-pixel.png' },
          { id: 'artichoke', label: 'Artichoke', asset: '/assets/sprites/artichoke-pixel.png' },
          { id: 'coconut', label: 'Coconut', asset: '/assets/sprites/coconut-pixel.png' },
          { id: 'squash', label: 'Squash', asset: '/assets/sprites/squash-pixel.png' },
        ],
        answer: 'squash',
        explanation: 'The rest are flowers, buds, or seeds! Squash is a fruit.',
      },
      {
        items: [
          { id: 'banana', label: 'Banana', asset: '/assets/sprites/banana-pixel.png' },
          { id: 'tomato', label: 'Tomato', asset: '/assets/sprites/tomato-pixel.png' },
          { id: 'sugarcane', label: 'Sugarcane', asset: '/assets/sprites/sugarcane-pixel.png' },
          { id: 'grape', label: 'Grape', asset: '/assets/sprites/grape-pixel.png' },
        ],
        answer: 'sugarcane',
        explanation: 'The rest are all fruits! Sugarcane is a stem.',
      },
      {
        items: [
          { id: 'lettuce2', label: 'Lettuce', asset: '/assets/sprites/lettuce-pixel.png' },
          { id: 'wheat', label: 'Wheat', asset: '/assets/sprites/wheat-pixel.png' },
          { id: 'beans', label: 'Beans', asset: '/assets/sprites/beans-pixel.png' },
          { id: 'coconut2', label: 'Coconut', asset: '/assets/sprites/coconut-pixel.png' },
        ],
        answer: 'lettuce2',
        explanation: 'The rest are all seeds! Lettuce is a leaf.',
      },
      {
        items: [
          { id: 'carrot2', label: 'Carrot', asset: '/assets/sprites/carrot-pixel.png' },
          { id: 'onion2', label: 'Onion', asset: '/assets/sprites/onion-pixel.png' },
          { id: 'radish2', label: 'Radish', asset: '/assets/sprites/radish-pixel.png' },
          { id: 'barley', label: 'Barley', asset: '/assets/sprites/Barley-pixel.png' },
        ],
        answer: 'barley',
        explanation: 'The rest grow underground! Barley is a grain that grows above ground.',
      },
    ],
  },

  // ── Level 2: Soil Organisms ──
  {
    id: 'soil-organisms',
    title: 'Soil Organisms',
    rounds: [
      {
        items: [
          { id: 'bacteria', label: 'Bacteria', asset: '/assets/svg/bacteria1.svg' },
          { id: 'fungi', label: 'Fungi', asset: '/assets/svg/fungi.svg' },
          { id: 'protozoa', label: 'Protozoa', asset: '/assets/svg/protozoa.svg' },
          { id: 'granite', label: 'Granite', asset: '/assets/sprites/Basic_Grass_Biom_things_rock.png' },
        ],
        answer: 'granite',
        explanation: 'The rest are living soil organisms! Granite is a rock.',
      },
      {
        items: [
          { id: 'earthworm', label: 'Earthworm', asset: '/assets/svg/worm.svg' },
          { id: 'nematode', label: 'Nematode', asset: '/assets/svg/nematode.svg' },
          { id: 'corn', label: 'Corn', asset: '/assets/svg/corn.svg' },
          { id: 'mite', label: 'Mite', asset: '/assets/svg/mite.svg' },
        ],
        answer: 'corn',
        explanation: 'The rest are soil organisms! Corn is a plant.',
      },
      {
        items: [
          { id: 'springtail', label: 'Springtail', asset: '/assets/svg/springtail.svg' },
          { id: 'mite2', label: 'Mite', asset: '/assets/svg/mite.svg' },
          { id: 'rotifer', label: 'Rotifer', asset: '/assets/svg/rotifer.svg' },
          { id: 'mushroom', label: 'Mushroom', asset: '/assets/sprites/Basic_Grass_Biom_things_mushroom.png' },
        ],
        answer: 'mushroom',
        explanation: 'The rest are soil animals! A mushroom is a fungus.',
      },
      {
        items: [
          { id: 'bacteria2', label: 'Bacteria', asset: '/assets/svg/bacteria2.svg' },
          { id: 'protozoa2', label: 'Protozoa', asset: '/assets/svg/protozoa.svg' },
          { id: 'rotifer2', label: 'Rotifer', asset: '/assets/svg/rotifer.svg' },
          { id: 'arthropod', label: 'Arthropod', asset: '/assets/svg/arthropod.svg' },
        ],
        answer: 'arthropod',
        explanation: 'The rest are microscopic! Arthropods can be seen with the naked eye.',
      },
      {
        items: [
          { id: 'nematode2', label: 'Nematode', asset: '/assets/svg/nematode.svg' },
          { id: 'earthworm2', label: 'Earthworm', asset: '/assets/svg/worm-food-web.svg' },
          { id: 'bird', label: 'Bird', asset: '/assets/svg/birb.svg' },
          { id: 'springtail2', label: 'Springtail', asset: '/assets/svg/springtail.svg' },
        ],
        answer: 'bird',
        explanation: 'The rest live IN the soil! Birds live above ground.',
      },
    ],
  },

  // ── Level 3: Soil Health Principles ──
  {
    id: 'soil-health',
    title: 'Soil Health',
    rounds: [
      {
        items: [
          { id: 'cover-crops', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
          { id: 'prairie-strips', label: 'Prairie Strips', asset: '/assets/svg/cons practices-prairie-strip.png' },
          { id: 'wetlands', label: 'Wetlands', asset: '/assets/svg/cons practices-wetland.png' },
          { id: 'plowing', label: 'Plowing', asset: '/assets/svg/tillage.svg' },
        ],
        answer: 'plowing',
        explanation: 'The rest protect soil! Plowing disturbs it.',
      },
      {
        items: [
          { id: 'living-roots', label: 'Living Roots', asset: '/assets/svg/soil-functions-plant.svg' },
          { id: 'soil-cover', label: 'Soil Cover', asset: '/assets/svg/principals-soil-cover.svg' },
          { id: 'diversity', label: 'Plant Diversity', asset: '/assets/svg/principals-diversity.svg' },
          { id: 'deforestation', label: 'Deforestation', asset: '/assets/svg/soil & carbon - release.svg' },
        ],
        answer: 'deforestation',
        explanation: 'The rest are soil health principles! Deforestation harms soil.',
      },
      {
        items: [
          { id: 'no-till', label: 'No-Till', asset: '/assets/svg/soil-carbon-store.svg' },
          { id: 'cover-crops2', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
          { id: 'living-roots2', label: 'Living Roots', asset: '/assets/svg/soil-functions-plant.svg' },
          { id: 'burning', label: 'Burning', asset: '/assets/svg/soil & carbon - release.svg' },
        ],
        answer: 'burning',
        explanation: 'The rest keep soil healthy! Burning releases carbon.',
      },
      {
        items: [
          { id: 'bioreactors', label: 'Bioreactors', asset: '/assets/svg/cons practices-bioreactor.png' },
          { id: 'sat-buffers', label: 'Saturated Buffers', asset: '/assets/svg/cons practices-buffer.png' },
          { id: 'prairie-strips2', label: 'Prairie Strips', asset: '/assets/svg/cons practices-prairie-strip.png' },
          { id: 'overgrazing', label: 'Overgrazing', asset: '/assets/svg/CLORP-organisms.svg' },
        ],
        answer: 'overgrazing',
        explanation: 'The rest are conservation practices! Overgrazing damages soil.',
      },
      {
        items: [
          { id: 'diversity2', label: 'Plant Diversity', asset: '/assets/svg/principals-diversity.svg' },
          { id: 'living-roots3', label: 'Living Roots', asset: '/assets/svg/soil-functions-plant.svg' },
          { id: 'limited-disturbance', label: 'Limited Disturbance', asset: '/assets/svg/soil-carbon-store.svg' },
          { id: 'monoculture', label: 'Monoculture', asset: '/assets/svg/corn.svg' },
        ],
        answer: 'monoculture',
        explanation: 'The rest are soil health principles! Monoculture reduces diversity.',
      },
    ],
  },

  // ── Level 4: Conservation Practices ──
  {
    id: 'conservation',
    title: 'Conservation',
    rounds: [
      {
        items: [
          { id: 'cc3', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
          { id: 'dwm', label: 'Drainage Water Mgmt', asset: '/assets/svg/cons practices-DWM.png' },
          { id: 'sb', label: 'Saturated Buffers', asset: '/assets/svg/cons practices-buffer.png' },
          { id: 'crop-dusting', label: 'Crop Dusting', asset: '/assets/svg/CLORP-climate.svg' },
        ],
        answer: 'crop-dusting',
        explanation: 'The rest are real conservation practices! Crop dusting is not.',
      },
      {
        items: [
          { id: 'ps3', label: 'Prairie Strips', asset: '/assets/svg/cons practices-prairie-strip.png' },
          { id: 'bio2', label: 'Bioreactors', asset: '/assets/svg/cons practices-bioreactor.png' },
          { id: 'wet2', label: 'Wetlands', asset: '/assets/svg/cons practices-wetland.png' },
          { id: 'pesticide', label: 'Pesticide Spraying', asset: '/assets/svg/CLORP-climate.svg' },
        ],
        answer: 'pesticide',
        explanation: 'The rest filter or reduce nutrients! Pesticide spraying adds chemicals.',
      },
      {
        items: [
          { id: 'cc4', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
          { id: 'ps4', label: 'Prairie Strips', asset: '/assets/svg/cons practices-prairie-strip.png' },
          { id: 'bio3', label: 'Bioreactors', asset: '/assets/svg/cons practices-bioreactor.png' },
          { id: 'wet3', label: 'Wetlands', asset: '/assets/svg/cons practices-wetland.png' },
        ],
        answer: 'bio3',
        explanation: 'The rest use living plants! Bioreactors use wood chips.',
      },
      {
        items: [
          { id: 'sb2', label: 'Saturated Buffers', asset: '/assets/svg/cons practices-buffer.png' },
          { id: 'wet4', label: 'Wetlands', asset: '/assets/svg/cons practices-wetland.png' },
          { id: 'dwm2', label: 'Drainage Water Mgmt', asset: '/assets/svg/cons practices-DWM.png' },
          { id: 'cc5', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
        ],
        answer: 'cc5',
        explanation: 'The rest manage water flow! Cover crops protect soil directly.',
      },
      {
        items: [
          { id: 'ps5', label: 'Prairie Strips', asset: '/assets/svg/cons practices-prairie-strip.png' },
          { id: 'cc6', label: 'Cover Crops', asset: '/assets/svg/cons practices-CC.png' },
          { id: 'wet5', label: 'Wetlands', asset: '/assets/svg/cons practices-wetland.png' },
          { id: 'sb3', label: 'Saturated Buffers', asset: '/assets/svg/cons practices-buffer.png' },
        ],
        answer: 'sb3',
        explanation: 'The rest can be seen above ground! Saturated buffers work underground.',
      },
    ],
  },
]

export const ROUND_TIME = 20 // seconds per round

export const INSTRUCTIONS = {
  intro: 'Find the odd one out! Be quick \u2014 speed earns bonus points!',
  gameplay: 'Tap the one that doesn\'t belong!',
  timeUp: 'Time\'s up!',
  complete: 'You\'re a soil science superstar!',
}
