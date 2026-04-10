/**
 * Planting Simulation game content
 * 3 levels: Three Sisters, Year in Bloom, Pollinator Garden
 */

export const LEVELS = [
  {
    id: 'three-sisters',
    title: 'Three Sisters Garden',
    background: '/assets/gifs/pixel-garden4.gif',
    diagram: '/assets/svg/three sisters v3.svg',
    plants: [
      {
        id: 'corn',
        name: 'Corn (selu)',
        cherokee: 'selu',
        clue: 'Grows tall and gives the beans a place to climb to reach the sunlight',
        asset: '/assets/sprites/corn-pixel.png',
        assetType: 'sprite',
        snapX: 50,  // center (percentage)
        snapY: 85,
      },
      {
        id: 'beans',
        name: 'Beans (tuya)',
        cherokee: 'tuya',
        clue: 'Helps the soil stay healthy by putting nutrients back into it',
        asset: '/assets/sprites/beans-pixel.png',
        assetType: 'sprite',
        snapX: 75,  // right
        snapY: 85,
      },
      {
        id: 'squash',
        name: 'Squash (iya)',
        cherokee: 'iya',
        clue: 'Spreads out big leaves to cover the ground, keeps soil moist and stops weeds',
        asset: '/assets/sprites/squash-pixel3.png',
        assetType: 'sprite',
        snapX: 25,  // left
        snapY: 85,
      },
    ],
  },
  {
    id: 'year-in-bloom',
    title: 'Year in Bloom',
    background: '/assets/gifs/pixel-garden2.gif',
    // 6 unique draggable flowers (unlimited re-drags like pollinator)
    flowers: [
      { id: 'golden-alexander',   name: 'Golden Alexander',   asset: '/assets/svg/medium-native-yellow-april-may_golden-alexander.svg',   fillColor: '#f0c040' },
      { id: 'scarlet-globemallow', name: 'Scarlet Globemallow', asset: '/assets/svg/short-native-red-may-june_scarlet-globemallow.svg',   fillColor: '#d04030' },
      { id: 'prairie-rose',       name: 'Prairie Rose',        asset: '/assets/svg/medium-native-pink-june_prairie-rose.svg',              fillColor: '#c060a0' },
      { id: 'butterfly-milkweed', name: 'Butterfly Milkweed',  asset: '/assets/svg/short-native-orange-june-july_butterfly-milkweed.svg',  fillColor: '#e08030' },
      { id: 'stiff-sunflower',    name: 'Stiff Sunflower',     asset: '/assets/svg/tall-native-yellow-aug-sep_stiff-sunflower.svg',        fillColor: '#e0b020' },
      { id: 'new-england-aster',  name: 'New England Aster',   asset: '/assets/svg/medium-native-blue-sep-oct_new-england-aster.svg',      fillColor: '#4050a0' },
    ],
    // Each month lists which flower IDs it accepts; some months have multiple, some flowers span months
    months: [
      { id: 'april',     month: 'April',     accepts: ['golden-alexander'],                                         required: 1 },
      { id: 'may',       month: 'May',       accepts: ['golden-alexander', 'scarlet-globemallow'],                   required: 2 },
      { id: 'june',      month: 'June',      accepts: ['scarlet-globemallow', 'prairie-rose', 'butterfly-milkweed'], required: 3 },
      { id: 'july',      month: 'July',      accepts: ['butterfly-milkweed'],                                        required: 1 },
      { id: 'august',    month: 'August',    accepts: ['stiff-sunflower'],                                           required: 1 },
      { id: 'september', month: 'September', accepts: ['stiff-sunflower', 'new-england-aster'],                      required: 2 },
      { id: 'october',   month: 'October',   accepts: ['new-england-aster'],                                         required: 1 },
    ],
    // Clues per flower (shown when player needs to place this flower somewhere)
    clues: {
      'golden-alexander':   'First to bloom in spring, with clusters of tiny yellow flowers that attract early pollinators',
      'scarlet-globemallow': 'Bright red-orange flowers that bloom as the weather warms up in late spring',
      'prairie-rose':       'Soft pink petals that open wide during the longest days of the year',
      'butterfly-milkweed': 'Orange flowers that monarch butterflies love to visit in the heat of summer',
      'stiff-sunflower':    'Tall yellow blooms that stand stiff and strong as summer turns to fall',
      'new-england-aster':  'Deep purple-blue flowers that are one of the last to bloom before winter',
    },
  },
  {
    id: 'pollinator-garden',
    title: 'Pollinator Garden',
    background: '/assets/gifs/pixel-garden3.gif',
    zones: [
      { id: 'tall-flower-1', label: 'Tall Native\nFlower', plantType: 'tall-flower', required: 1 },
      { id: 'tall-grass-1',  label: 'Tall Native\nGrass',  plantType: 'tall-grass',  required: 1 },
      { id: 'tall-flower-2', label: 'Tall Native\nFlower', plantType: 'tall-flower', required: 1 },
      { id: 'tall-grass-2',  label: 'Tall Native\nGrass',  plantType: 'tall-grass',  required: 1 },
      { id: 'tall-flower-3', label: 'Tall Native\nFlower', plantType: 'tall-flower', required: 1 },
      { id: 'puddle',        label: 'Puddle\nArea',        plantType: 'puddle',      required: 1 },
      { id: 'short-flower',  label: 'Short Native Flower', plantType: 'short-flower', required: 2 },
      { id: 'stones',        label: 'Stones',             plantType: 'stones',      required: 2 },
      { id: 'medium-flower', label: 'Medium Native Flower', plantType: 'medium-flower', required: 3 },
    ],
    // Ring layout — clockwise from right, center in the middle
    // Points on ellipse: cx=50%, cy=50%, rx=32%, ry=28%
    zonePositions: [
      { id: 'tall-flower-1', top: 38, left: 75, width: 14, height: 24 }, // right (3 o'clock)
      { id: 'tall-grass-1',  top: 11, left: 66, width: 14, height: 26 }, // upper-right (1:30)
      { id: 'tall-flower-2', top:  4, left: 43, width: 14, height: 24 }, // top (12 o'clock) — centered
      { id: 'tall-grass-2',  top: 11, left: 20, width: 14, height: 26 }, // upper-left (10:30)
      { id: 'tall-flower-3', top: 38, left: 11, width: 14, height: 24 }, // left (9 o'clock)
      { id: 'stones',        top: 64, left: 18, width: 14, height: 26 }, // lower-left (7:30) — swapped
      { id: 'short-flower',  top: 68, left: 32.5, width: 35, height: 26 }, // bottom (6 o'clock) — slightly larger
      { id: 'puddle',        top: 64, left: 68, width: 14, height: 26 }, // lower-right (4:30) — swapped
      { id: 'medium-flower', top: 31, left: 32.5, width: 35, height: 35 }, // center — slightly smaller
    ],
    // Each item is a distinct draggable; zoneType maps it to the matching drop zone
    items: [
      { id: 'tall-grass-item',    name: 'Tall Native Grass',     zoneType: 'tall-grass',    asset: '/assets/svg/tall-native-grass.svg',                                      assetType: 'svg' },
      { id: 'stiff-sunflower',    name: 'Stiff Sunflower',       zoneType: 'tall-flower',   asset: '/assets/svg/tall-native-yellow-aug-sep_stiff-sunflower.svg',             assetType: 'svg' },
      { id: 'golden-alexander',   name: 'Golden Alexander',      zoneType: 'medium-flower', asset: '/assets/svg/medium-native-yellow-april-may_golden-alexander.svg',        assetType: 'svg' },
      { id: 'prairie-rose',       name: 'Prairie Rose',          zoneType: 'medium-flower', asset: '/assets/svg/medium-native-pink-june_prairie-rose.svg',                   assetType: 'svg' },
      { id: 'new-england-aster',  name: 'New England Aster',     zoneType: 'medium-flower', asset: '/assets/svg/medium-native-blue-sep-oct_new-england-aster.svg',           assetType: 'svg' },
      { id: 'stone-sm',           name: 'Stones',                zoneType: 'stones',        asset: '/assets/sprites/Basic_Grass_Biom_things_rock-sm.png',                    assetType: 'sprite' },
      { id: 'stone-lg',           name: 'Stones',                zoneType: 'stones',        asset: '/assets/sprites/Basic_Grass_Biom_things_rock.png',                       assetType: 'sprite' },
      { id: 'scarlet-globemallow', name: 'Scarlet Globemallow',  zoneType: 'short-flower',  asset: '/assets/svg/short-native-red-may-june_scarlet-globemallow.svg',          assetType: 'svg' },
      { id: 'butterfly-milkweed', name: 'Butterfly Milkweed',    zoneType: 'short-flower',  asset: '/assets/svg/short-native-orange-june-july_butterfly-milkweed.svg',       assetType: 'svg' },
      { id: 'puddle-item',        name: 'Puddle',                zoneType: 'puddle',        asset: '/assets/sprites/puddle.png',                                             assetType: 'sprite' },
    ],
  },
]

export const INSTRUCTIONS = {
  intro: 'Choose a level to plant a garden!',
  threeSisters: {
    gameplay: 'Read the clue, pick the right plant, and drag it onto the garden!',
    complete: 'The Three Sisters are planted! Corn, beans, and squash grow in harmony ♡ ',
  },
  pollinator: {
    gameplay: 'Drag plants from the panel into the matching garden zones!',
    complete: 'Beautiful! Your pollinator garden is ready for butterflies and bees!',
  },
  yearInBloom: {
    gameplay: 'Read the clue and drag the right flower to the correct month!',
    complete: 'Watch the garden bloom all year long!',
  },
}
