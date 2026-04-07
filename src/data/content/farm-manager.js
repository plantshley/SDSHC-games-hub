/**
 * Farm Manager Simulator — content data
 *
 * 9 levels: each presents a farm crisis scenario.
 * Player selects the correct conservation practice from 4 options.
 */

export const LEVELS = [
  // ── Level 1: Nutrient Runoff ──
  {
    id: 'nutrient-runoff',
    title: 'Nutrient Runoff',
    scenario: 'Your field is losing nutrients into the local river!',
    correctId: 'saturated-buffers',
    image: '/assets/svg/cons practices-buffer.png',
    revealImage: '/assets/fms-saturated-buffer.webp',
    description: 'A technology that allows farmers to pass drainage tile water through perennial vegetation to reduce nutrient loss to local waterbodies.',
    options: [
      { id: 'saturated-buffers', label: 'Saturated Buffers' },
      { id: 'cover-crops', label: 'Cover Crops' },
      { id: 'bioreactors', label: 'Bioreactors' },
      { id: 'prairie-strips', label: 'Prairie Strips' },
    ],
    fact: 'Saturated buffers redirect drainage tile water into a perforated pipe beneath a vegetated strip along a field\'s edge. Instead of flowing straight into a ditch, water seeps through soil where roots and microbes absorb nitrogen. Research across Midwest sites found this removes 30\u201385% of nitrates from diverted drainage water.',
    source: 'USDA ARS, NRCS Practice 604',
  },

  // ── Level 2: Hillside Erosion ──
  {
    id: 'hillside-erosion',
    title: 'Hillside Erosion',
    scenario: 'Erosion is destroying your hillside crops!',
    correctId: 'prairie-strips',
    image: '/assets/svg/cons practices-prairie-strip.png',
    revealImage: '/assets/fms-prairie-strip.png',
    description: 'A line of prairie plants planted in-between row crop or along streams and waterbodies that aids in reducing erosion and nutrient runoff.',
    options: [
      { id: 'prairie-strips', label: 'Prairie Strips' },
      { id: 'wetlands', label: 'Wetlands' },
      { id: 'drainage-water-mgmt', label: 'Drainage Water Management' },
      { id: 'saturated-buffers', label: 'Saturated Buffers' },
    ],
    fact: 'Native, deep-rooted prairie grasses and wildflowers planted in contoured bands replace about 10% of a crop field. The STRIPS project at Iowa State found fields with prairie strips experienced 95% less soil erosion during heavy rain. The strips also support pollinators, grassland birds, and beneficial insects.',
    source: 'USDA Forest Service, STRIPS Project',
  },

  // ── Level 3: High Water Table ──
  {
    id: 'high-water-table',
    title: 'High Water Table',
    scenario: 'Your water table is too high after heavy rain!',
    correctId: 'drainage-water-mgmt',
    image: '/assets/svg/cons practices-DWM.png',
    revealImage: '/assets/fms-dwm.JPG',
    description: 'A technology where water control structures are added to existing tile networks to raise or lower the water table to a desired elevation.',
    options: [
      { id: 'drainage-water-mgmt', label: 'Drainage Water Management' },
      { id: 'cover-crops', label: 'Cover Crops' },
      { id: 'prairie-strips', label: 'Prairie Strips' },
      { id: 'bioreactors', label: 'Bioreactors' },
    ],
    fact: 'Adjustable water control structures on tile networks raise or lower the water table by season. Studies found this reduces annual drainage volume by 20\u201340% and cuts nitrogen loading by up to 22 lbs per acre per year. Retaining moisture during dry stretches also reduces crop stress and improves yields.',
    source: 'NRCS Practice 554',
  },

  // ── Level 4: Creek Runoff ──
  {
    id: 'creek-runoff',
    title: 'Creek Runoff',
    scenario: 'You need to filter runoff before it hits the creek!',
    correctId: 'bioreactors',
    image: '/assets/svg/cons practices-bioreactor.png',
    revealImage: '/assets/fms-bioreactor.jpg',
    description: 'An edge of field practice that filters drainage tile water through woodchips to remove nutrients and protect water quality.',
    options: [
      { id: 'bioreactors', label: 'Bioreactors' },
      { id: 'wetlands', label: 'Wetlands' },
      { id: 'saturated-buffers', label: 'Saturated Buffers' },
      { id: 'cover-crops', label: 'Cover Crops' },
    ],
    fact: 'A buried trench filled with wood chips where microorganisms use nitrate as an energy source, releasing it harmlessly as nitrogen gas. On average, bioreactors remove 35\u201350% of nitrates from tile drainage water. The microbial community is self-sustaining, powered by slow decomposition of wood chips over 10\u201315 years.',
    source: 'USDA, NRCS Practice 605',
  },

  // ── Level 5: Depleted Soil ──
  {
    id: 'depleted-soil',
    title: 'Depleted Soil',
    scenario: 'Your soil is depleted after harvest season!',
    correctId: 'cover-crops',
    image: '/assets/svg/cons practices-CC.png',
    revealImage: '/assets/fms-cover-crop.jpg',
    description: 'A practice that provides living roots throughout much of the year which absorbs nutrients and prevents loss. They are planted in addition to a cash crop.',
    options: [
      { id: 'cover-crops', label: 'Cover Crops' },
      { id: 'prairie-strips', label: 'Prairie Strips' },
      { id: 'drainage-water-mgmt', label: 'Drainage Water Management' },
      { id: 'wetlands', label: 'Wetlands' },
    ],
    fact: 'Planted after harvest to keep living roots in the soil during months when fields would sit bare. Roots absorb excess nitrogen that would leach into groundwater. Plant cover intercepts raindrops before they dislodge soil particles, directly reducing erosion. Over time, cover crops build organic matter by feeding soil microbes through root exudates.',
    source: 'NRCS Practice 340, USDA Climate Hubs, SARE',
  },

  // ── Level 6: Flooding ──
  {
    id: 'flooding',
    title: 'Flooding',
    scenario: 'Flooding threatens your lowland fields!',
    correctId: 'wetlands',
    image: '/assets/svg/cons practices-wetland.png',
    revealImage: '/assets/fms-wetland.JPG',
    description: 'Shallow pools that filter sediment, nitrate, and other nutrients and also provide flood mitigation and habitat benefits.',
    options: [
      { id: 'wetlands', label: 'Wetlands' },
      { id: 'bioreactors', label: 'Bioreactors' },
      { id: 'cover-crops', label: 'Cover Crops' },
      { id: 'prairie-strips', label: 'Prairie Strips' },
    ],
    fact: 'A wetland representing just 6% of adjacent farmland can reduce nitrate levels by 39\u201349% and retain 53\u201381% of dissolved phosphorus. Beyond water quality, wetlands store floodwater during storms, sequester atmospheric carbon, and create habitat for amphibians, waterfowl, and pollinators.',
    source: 'NRCS CEAP Wetlands 2023',
  },

  // ── Level 7: Soil Compaction ──
  {
    id: 'soil-compaction',
    title: 'Soil Structure',
    scenario: 'Your soil has no structure and compacts easily!',
    correctId: 'living-roots',
    image: '/assets/svg/soil-functions-plant.svg',
    revealImage: '/assets/fms-living-roots.jpg',
    description: 'A practice that holds soil particles together, improving structure and preventing compaction while feeding beneficial soil organisms.',
    options: [
      { id: 'living-roots', label: 'Cover Crops / Living Roots' },
      { id: 'bioreactors', label: 'Bioreactors' },
      { id: 'wetlands', label: 'Wetlands' },
      { id: 'prairie-strips', label: 'Prairie Strips' },
    ],
    fact: 'Fibrous-rooted cover crops build aggregate stability so soil particles clump together, creating pore space for air and water. Tap-rooted species like tillage radish punch through compacted layers. Research found cover-cropped soils averaged 4% lower bulk density, 33% more macropores, and water infiltration rates up to 629% higher than bare fields.',
    source: 'SARE, Haruna et al. 2020',
  },

  // ── Level 8: Monoculture Pests ──
  {
    id: 'monoculture-pests',
    title: 'Monoculture',
    scenario: 'Pests are taking over \u2014 monoculture is failing!',
    correctId: 'plant-diversity',
    image: '/assets/svg/polyculture.png',
    revealImage: '/assets/fms-polyculture.jpg',
    description: 'Growing different crops breaks pest cycles and builds healthier soil ecosystems through diverse root systems and nutrient cycling.',
    options: [
      { id: 'plant-diversity', label: 'Plant Diversity / Crop Rotation' },
      { id: 'drainage-water-mgmt', label: 'Drainage Water Management' },
      { id: 'saturated-buffers', label: 'Saturated Buffers' },
      { id: 'wetlands', label: 'Wetlands' },
    ],
    fact: 'Rotating crops removes the host plant pests depend on, starving out populations. Research showed corn rootworm infestations drop by over 90% in corn-soybean rotations compared to continuous corn. Diverse rotations feed a wider variety of soil organisms, improving nutrient cycling and long-term fertility.',
    source: 'NRCS Soil Health Principle 3, Purdue University',
  },

  // ── Level 9: Soil Carbon Loss ──
  {
    id: 'carbon-loss',
    title: 'Carbon Loss',
    scenario: 'Your tilled fields are releasing carbon into the atmosphere!',
    correctId: 'no-till',
    image: '/assets/svg/soil-carbon-store.svg',
    revealImage: '/assets/fms-no-till.webp',
    description: 'A farming method that leaves the soil undisturbed, keeping carbon locked underground instead of releasing it into the atmosphere.',
    options: [
      { id: 'no-till', label: 'Conservation Tillage / No-Till' },
      { id: 'bioreactors', label: 'Bioreactors' },
      { id: 'saturated-buffers', label: 'Saturated Buffers' },
      { id: 'drainage-water-mgmt', label: 'Drainage Water Management' },
    ],
    fact: 'No-till farming leaves the soil undisturbed, keeping carbon locked underground. Conventional tillage exposes soil organic matter to oxygen, releasing stored carbon as CO\u2082. USDA research found that no-till fields can sequester 0.1\u20130.5 tons of carbon per acre per year while also reducing erosion by up to 90% and improving water infiltration.',
    source: 'USDA NRCS, Soil Health Division',
  },
]

export const INSTRUCTIONS = {
  intro: 'Welcome to Farm Manager! Your farm is in trouble. Can you pick the right conservation practice to save it?',
  gameplay: 'Read the crisis and select the correct conservation practice!',
  complete: 'Great job! You saved the farm!',
  wrongHint: 'Not quite \u2014 think about what each practice actually does.',
}
