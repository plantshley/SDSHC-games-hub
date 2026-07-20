/**
 * Farm World — Station Content
 *
 * Educational content for the 3D farm explorer. Nothing here is invented:
 * question pools are drawn directly from the Advanced Trivia Blitz rounds
 * (USDA Soil Health Lesson Plans PDF + upgraded kid content), and the
 * "Did You Know?" facts reuse the vetted IMPACT_MESSAGES from the existing
 * advanced games. Station lessons paraphrase the same sourced material
 * (NRCS five soil health principles, USDA lesson topics).
 */

import { ROUNDS, IMPACT_MESSAGES as TRIVIA_IMPACTS } from './trivia-blitz.js'
import { IMPACT_MESSAGES as SPIN_IMPACTS } from './spin-wheel.js'

function questionsFor(roundId) {
  const round = ROUNDS.find(r => r.id === roundId)
  return round ? round.questions : []
}

export const QUESTIONS_PER_STATION = 2

/**
 * The stations across the farm — the original ring island plus the trail
 * island reached by the bridge. `id` must match STATION_LAYOUT in
 * games/advanced/farm-world/world.js. Each station: a short lesson shown on
 * arrival, a pool of multiple-choice questions (sampled per run), and a
 * sourced fact shown after answering.
 */
export const STATIONS = [
  {
    id: 'crop-field',
    name: 'Cover Crop Field',
    tag: 'Soil Health Principles',
    lesson: 'Healthy farms follow five soil health principles: keep the soil covered, minimize disturbance, grow diverse plants, keep living roots in the ground year-round, and integrate livestock. Together they mimic the native prairie that built South Dakota’s deep, rich soils.',
    fact: SPIN_IMPACTS['cover-crops'],
    questions: questionsFor('soil-health-principles'),
    restoredLabel: 'Cover crops planted — the soil is armored!',
  },
  {
    id: 'farmstead',
    name: 'Machine Shed',
    tag: 'Tillage & Compaction',
    lesson: 'Every pass of heavy equipment squeezes the air space out of soil — that’s compaction, measured as bulk density. Compacted soil resists roots, water, and air. Reducing tillage and controlling field traffic keeps soil porous and alive.',
    fact: TRIVIA_IMPACTS['bulk-density'],
    questions: questionsFor('bulk-density'),
    restoredLabel: 'Switched to no-till — the soil structure is safe!',
  },
  {
    id: 'soil-pit',
    name: 'Soil Pit',
    tag: 'Texture & Structure',
    lesson: 'Soil texture is the mix of sand, silt, and clay particles; structure is how those particles clump into aggregates. Good structure creates pores where air, water, and roots can move — the difference between living soil and dead dirt.',
    fact: SPIN_IMPACTS['soil-biology'],
    questions: questionsFor('soil-texture-structure'),
    restoredLabel: 'Topsoil rebuilt — the soil profile is thriving!',
  },
  {
    id: 'pasture',
    name: 'Pasture',
    tag: 'Livestock & the Nitrogen Cycle',
    lesson: 'Grazing livestock cycle nutrients: manure returns nitrogen to the soil, where microbes convert it into forms plants can use. Managed grazing stimulates plant regrowth and feeds the underground food web instead of exhausting it.',
    fact: TRIVIA_IMPACTS['nitrogen-cycle'],
    questions: questionsFor('nitrogen-cycle'),
    restoredLabel: 'Managed grazing begun — the pasture is green again!',
  },
  {
    id: 'pond',
    name: 'Pond & Windbreak',
    tag: 'Water & Erosion',
    lesson: 'Healthy soil works like a sponge — rain soaks in instead of running off. Windbreaks and buffers slow the wind and water that strip topsoil away, keeping fields in place and streams clean.',
    fact: TRIVIA_IMPACTS['soil-infiltration'],
    questions: questionsFor('soil-infiltration'),
    restoredLabel: 'Windbreak planted — the bank has stopped eroding!',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    tag: 'Soil pH & Nutrients',
    lesson: 'Soil pH controls which nutrients plants can actually reach. Most crops and soil microbes do best near neutral pH — when soil turns too acidic or alkaline, nutrients lock up even though they’re still present. Lime raises acidic pH; sulfur lowers alkaline pH.',
    fact: 'Most plant nutrients reach peak availability near a soil pH of 6 to 7 — which is why a simple pH test is one of the most valuable measurements a farmer can take.',
    questions: questionsFor('soil-ph'),
    restoredLabel: 'pH balanced — the greenhouse is blooming!',
  },
  {
    id: 'heritage',
    name: 'Heritage Garden',
    tag: 'Indigenous Farming',
    lesson: 'Indigenous farmers of the Great Plains grew corn, beans, and squash together — the Three Sisters. Beans host bacteria that fix nitrogen from the air, corn gives the beans structure to climb, and squash shades the soil like living mulch.',
    fact: SPIN_IMPACTS['soil-regions'],
    questions: questionsFor('indigenous-farming'),
    restoredLabel: 'Three Sisters planted — the old wisdom lives on!',
  },

  // ── Second island (trail stations) ──
  {
    id: 'conservation-practices',
    name: 'Prairie Strips',
    tag: 'Conservation Practices',
    lesson: 'Conservation practices work with the land instead of against it: no-till keeps fungal networks and earthworms intact, contour farming and prairie strips slow runoff, and riparian buffers filter water before it reaches a stream. A few narrow bands of native plants can hold back most of a field’s lost soil.',
    fact: TRIVIA_IMPACTS['conservation-practices'],
    questions: questionsFor('conservation-practices'),
    restoredLabel: 'Prairie strips restored — the field holds its soil now!',
  },
  {
    id: 'phosphorus',
    name: 'Runoff Buffer',
    tag: 'Phosphorus & Water Quality',
    lesson: 'Phosphorus builds the ATP, DNA, and membranes every plant needs — but unlike nitrogen it has no gas phase, so it travels bound to soil. When it washes into water it feeds algae blooms that choke out life. Vegetated buffers and the “4R” approach — right source, rate, time, and place — keep it in the field.',
    fact: TRIVIA_IMPACTS['phosphorus'],
    questions: questionsFor('phosphorus'),
    restoredLabel: 'Buffers planted — the water runs clean again!',
  },
  {
    id: 'soil-art-culture',
    name: 'Soil Art Plaza',
    tag: 'Soil Art & Culture',
    lesson: 'Soil is one of humanity’s oldest art materials. Ochre pigments colored cave walls over 40,000 years ago, iron-rich mud dyes West African mudcloth, and Amazonian peoples engineered dark, fertile “terra preta” by adding charcoal and compost. Soil carries culture as well as crops.',
    fact: 'Terra preta — the “dark earth” Amazonian peoples made centuries ago from charcoal, bone, and compost — is still remarkably fertile today, far richer than the tropical soils around it.',
    questions: questionsFor('soil-art-culture'),
    restoredLabel: 'The soil art plaza is vibrant again!',
  },
  {
    id: 'agronomy-careers',
    name: 'Research Station',
    tag: 'Agronomy Careers',
    lesson: 'Understanding soil opens a world of careers. Certified Crop Advisors plan nutrients and pest control, NRCS soil scientists map land and write conservation plans, plant breeders develop hardier varieties, and precision-ag specialists guide equipment by GPS and data.',
    fact: 'Soil scientists with the NRCS map soils, judge what each parcel of land can support, and write the conservation plans that help farmers protect it — one of many careers built on understanding soil.',
    questions: questionsFor('agronomy-careers'),
    restoredLabel: 'Research station up and running — the future looks bright!',
  },
  {
    id: 'electrical-conductivity',
    name: 'Salinity Monitor',
    tag: 'Electrical Conductivity',
    lesson: 'Electrical conductivity (EC) measures the salt dissolved in soil. Too much salt causes “physiological drought” — plants can’t pull in water even when the soil is moist. EMI sensors map salty zones from a moving tractor, and leaching or gypsum can bring the soil back.',
    fact: 'Once a soil’s electrical conductivity climbs past about 4 dS/m it counts as saline — salty enough to stunt sensitive crops even when the ground looks perfectly normal.',
    questions: questionsFor('electrical-conductivity'),
    restoredLabel: 'Salts leached out — the crops are recovering!',
  },
]

export const INSTRUCTIONS = {
  intro: 'The old farm’s soil has gone tired. Wander the fields, learn what living soil needs, and restore every corner of the farm — one soil health principle at a time.',
  completion: 'Every field, pasture, and pond on this farm is healthier because of what you know about soil.',
}

export const RULES = [
  'Walk with the on-screen joystick or the WASD / arrow keys.',
  'Drag the view to look around and scroll or pinch to zoom — the ⊙ button resets the camera.',
  'Tap the ☺ button to customize your explorer, and the ☾ button to switch between day and night.',
  'Visit the glowing stations scattered across both islands — cross the bridge to reach the far trail.',
  'Each station teaches a soil health topic, then asks you 2 questions.',
  'A first-try correct answer earns 100 points; a second try earns 50.',
  'Answer the questions to restore that corner of the farm — restore every station to bring the whole farm back to life!',
  'Say hello to the folks wandering the farm — they have tips to share.',
]
