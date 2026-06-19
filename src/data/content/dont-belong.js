/**
 * Things That Don't Belong — content data
 *
 * 4 levels: each presents 4 items, tap the one that doesn't belong.
 * Pre-K to 2nd grade — simple, untimed, visual with word labels.
 */

export const LEVELS = [
  // ── Level 1: Animals vs Plant ──
  {
    id: 'animals-vs-plant',
    items: [
      { id: 'fox', label: 'Fox', asset: '/assets/gifs/fox-gif.gif' },
      { id: 'cow', label: 'Cow', asset: '/assets/gifs/cow-gif2.gif' },
      { id: 'frog', label: 'Frog', asset: '/assets/gifs/frog.gif' },
      { id: 'flower', label: 'Flower', asset: '/assets/gifs/flowers-gif.gif' },
    ],
    answer: 'flower',
    categoryReveal: "They're all animals! 🦊🐄🐸",
  },

  // ── Level 2: Soil Parts vs Organic ──
  {
    id: 'soil-vs-organic',
    items: [
      { id: 'sand', label: 'Sand', asset: '/assets/field-guide/soil-types/sandy-loam.webp' },
      { id: 'clay', label: 'Clay', asset: '/assets/field-guide/soil-types/clay-soil.webp' },
      { id: 'silt', label: 'Silt', asset: '/assets/field-guide/soil-types/loess.webp' },
      { id: 'leaf', label: 'Leaf', asset: '/assets/field-guide/native-plants/bur-oak.webp' },
    ],
    answer: 'leaf',
    categoryReveal: "They're all parts of soil! 🌱🪨",
  },

  // ── Level 3: Animals vs Celestial ──
  {
    id: 'animals-vs-sun',
    items: [
      { id: 'bunny', label: 'Bunny', asset: '/assets/svg/bunny.svg' },
      { id: 'sun', label: 'Sun', asset: '/assets/svg/prek maze objects-sun.svg' },
      { id: 'pig', label: 'Pig', asset: '/assets/svg/pig.svg' },
      { id: 'duck', label: 'Duck', asset: '/assets/svg/duck.svg' },
    ],
    answer: 'sun',
    categoryReveal: "They're all animals! 🐰🐷🦆",
  },

  // ── Level 4: Nature vs Snack ──
  {
    id: 'elements-vs-concrete',
    items: [
      { id: 'grape', label: 'Grape', asset: '/assets/sprites/grape-pixel.png' },
      { id: 'water', label: 'Water', asset: '/assets/gifs/water-gif.gif' },
      { id: 'earth', label: 'Earth', asset: '/assets/sprites/Basic_Grass_Biom_things_rock.png' },
      { id: 'wind', label: 'Wind', asset: '/assets/sprites/wind-pixel.png' },
    ],
    answer: 'grape',
    categoryReveal: "The rest are parts of nature! 💧🌍💨 The grape is a yummy snack.",
  },
]

export const INSTRUCTIONS = {
  intro: 'Can you find the one that doesn\'t belong? Tap it!',
  gameplay: 'Tap the one that doesn\'t belong!',
  correct: ['Great job!', 'You got it!', 'Amazing!', 'Way to go!'],
  tryAgain: 'Try again!',
  complete: 'You found them all! Great work!',
}
