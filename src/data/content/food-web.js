/**
 * Soil Food Web Builder — content data
 *
 * 12 organisms to place on the arrows-only diagram.
 * Positions are PLACEHOLDER estimates — will be replaced with exact
 * coordinates once mapped via the dot-placer tool.
 */

export const ORGANISMS = [
  {
    id: 'plants',
    name: 'Plants',
    asset: '/assets/svg/plants.svg',
    snapX: 18, snapY: 35, displaySize: 192,
    fact: 'Plants capture sunlight and convert it to energy through photosynthesis. Their roots release sugars that feed billions of soil organisms.',
    hint: 'These are producers — they form the base of the food web.',
  },
  {
    id: 'organic-matter',
    name: 'Organic Matter',
    asset: '/assets/svg/organic matter.svg',
    snapX: 22, snapY: 56, displaySize: 136,
    fact: 'Organic matter is dead plant and animal material. It is the primary food source for decomposers like bacteria and fungi.',
    hint: 'This is not alive — it is what remains after organisms die and decay.',
  },
  {
    id: 'earthworms',
    name: 'Earthworms',
    asset: '/assets/svg/worm-food-web.svg',
    snapX: 16, snapY: 71, displaySize: 188,
    fact: 'Earthworms mix and aerate soil as they burrow, creating channels for water and roots. They can eat their body weight in organic matter each day.',
    hint: 'These tunnel through soil and break down dead material at the bottom of the web.',
  },
  {
    id: 'bacteria',
    name: 'Bacteria',
    asset: '/assets/svg/bacteria2.svg',
    snapX: 39, snapY: 76, displaySize: 107,
    fact: 'A single teaspoon of healthy soil contains up to 1 billion bacteria. They decompose organic matter and convert nitrogen into forms plants can use.',
    hint: 'These are microscopic decomposers found on the right side of the web.',
  },
  {
    id: 'protozoa',
    name: 'Protozoa',
    asset: '/assets/svg/protozoa.svg',
    snapX: 57, snapY: 69, displaySize: 98,
    fact: 'Protozoa are single-celled organisms that eat bacteria, releasing excess nitrogen that plants absorb as fertilizer.',
    hint: 'These single-celled predators eat bacteria — look for them near the bacteria.',
  },
  {
    id: 'nematode-predators',
    name: 'Nematodes\n(predators)',
    asset: '/assets/svg/nematode-predator.svg',
    snapX: 74, snapY: 63, displaySize: 136,
    fact: 'Predatory nematodes hunt other nematodes and small soil organisms, keeping their populations in check — a form of natural pest control.',
    hint: 'These are predators that eat other nematodes — they sit higher in the web.',
  },
  {
    id: 'nematode-fungi-bacteria',
    name: 'Nematodes\n(fungi & bacteria eaters)',
    asset: '/assets/svg/nematode.svg',
    snapX: 41, snapY: 64, displaySize: 142,
    fact: 'These nematodes graze on fungi and bacteria, releasing nutrients locked inside microbial cells back into the soil for plants.',
    hint: 'These tiny roundworms feed on fungi and bacteria — they sit in the middle of the web.',
  },
  {
    id: 'nematode-root-eaters',
    name: 'Nematodes\n(root eaters)',
    asset: '/assets/svg/nematode-fungi-eater.svg',
    snapX: 43, snapY: 34, displaySize: 142,
    fact: 'Root-feeding nematodes pierce plant roots with a needle-like mouth part called a stylet. In large numbers, they can damage crops.',
    hint: 'These feed directly on plant roots — look for them on the left, near the plants.',
  },
  {
    id: 'fungi',
    name: 'Fungi',
    asset: '/assets/svg/fungi.svg',
    snapX: 43, snapY: 47, displaySize: 123,
    fact: 'Fungal networks called mycorrhizae extend plant root systems by up to 1,000 times, trading nutrients for the sugars plants produce.',
    hint: 'These decomposers form underground networks — they sit in the center-left of the web.',
  },
  {
    id: 'arthropod-shredders',
    name: 'Arthropods\n(shredders)',
    asset: '/assets/svg/arthropod.svg',
    snapX: 68, snapY: 34, displaySize: 110,
    fact: 'Shredder arthropods like millipedes and woodlice physically break apart dead leaves and wood, increasing surface area for bacteria and fungi.',
    hint: 'These shred dead plant material — they sit on the left side of the web.',
  },
  {
    id: 'arthropod-predators',
    name: 'Arthropods\n(predators)',
    asset: '/assets/svg/mite.svg',
    snapX: 63, snapY: 52, displaySize: 110,
    fact: 'Predatory arthropods like centipedes and predatory mites hunt smaller organisms, helping regulate soil food web populations.',
    hint: 'These are predators — they sit higher in the web, above the organisms they hunt.',
  },
  {
    id: 'birds-animals',
    name: 'Birds &\nAnimals',
    asset: '/assets/svg/birb.svg',
    snapX: 87, snapY: 38, displaySize: 171,
    fact: 'Birds and small mammals are the top predators of the soil food web. They eat arthropods, worms, and other soil organisms.',
    hint: 'These are the top predators — they belong at the very top of the food web.',
  },
]

export const QUIZ_QUESTIONS = [
  {
    question: 'What would happen to the soil food web if all fungi disappeared?',
    highlightOrganisms: ['fungi', 'organic-matter', 'nematode-fungi-bacteria', 'plants'],
    choices: [
      { text: 'Organic matter would build up because it cannot be broken down efficiently', correct: true },
      { text: 'Plants would grow faster without fungi competing for nutrients', correct: false },
      { text: 'Nothing would change — bacteria do the same job', correct: false },
      { text: 'Birds and animals would have more food', correct: false },
    ],
    explanation: 'Fungi are uniquely able to break down tough materials like lignin in wood. Without them, organic matter accumulates and nutrient cycling slows dramatically. Plants also lose their mycorrhizal networks.',
  },
  {
    question: 'Why are nematodes found at three different levels of the food web?',
    highlightOrganisms: ['nematode-root-eaters', 'nematode-fungi-bacteria', 'nematode-predators'],
    choices: [
      { text: 'Different nematode species have evolved to eat different food sources', correct: true },
      { text: 'Nematodes move between levels depending on the season', correct: false },
      { text: 'They are the most important organisms in the soil', correct: false },
      { text: 'Nematodes eat everything, so they appear everywhere', correct: false },
    ],
    explanation: 'There are over 20,000 nematode species! Some eat plant roots, others graze on fungi and bacteria, and predatory species hunt other nematodes. This diversity of diets places them at multiple trophic levels.',
  },
  {
    question: 'How do protozoa help plants grow, even though they don\'t interact with plants directly?',
    highlightOrganisms: ['protozoa', 'bacteria', 'plants'],
    choices: [
      { text: 'They eat bacteria and release excess nitrogen that plants absorb', correct: true },
      { text: 'They produce oxygen that plant roots need', correct: false },
      { text: 'They kill harmful fungi that attack plant roots', correct: false },
      { text: 'They carry seeds to new locations', correct: false },
    ],
    explanation: 'Protozoa consume bacteria that are rich in nitrogen. Since protozoa need less nitrogen than they eat, they release the excess into the soil in a form plants can absorb — this is called the "microbial loop."',
  },
  {
    question: 'Which organisms are the primary decomposers that break down dead organic matter?',
    highlightOrganisms: ['bacteria', 'fungi', 'organic-matter'],
    choices: [
      { text: 'Bacteria and fungi', correct: true },
      { text: 'Earthworms and arthropods', correct: false },
      { text: 'Nematodes and protozoa', correct: false },
      { text: 'Birds and animals', correct: false },
    ],
    explanation: 'Bacteria and fungi are the primary decomposers. Earthworms and arthropods help by physically shredding material into smaller pieces, but bacteria and fungi do the chemical work of breaking down complex molecules.',
  },
  {
    question: 'A farmer notices their soil has very few earthworms. What is the most likely consequence?',
    highlightOrganisms: ['earthworms', 'organic-matter', 'birds-animals'],
    choices: [
      { text: 'Poor soil aeration and slower organic matter breakdown', correct: true },
      { text: 'More bacteria because there is less competition', correct: false },
      { text: 'Plants grow better because worms damage roots', correct: false },
      { text: 'No effect — earthworms are not important to soil health', correct: false },
    ],
    explanation: 'Earthworms are ecosystem engineers. Their tunnels create channels for air and water, and their digestion breaks down organic matter faster. Without them, soil becomes compacted and nutrient cycling slows.',
  },
]

export const INSTRUCTIONS = {
  intro: 'Soil is alive! Billions of tiny organisms live underground, forming a food web. Can you build it?',
  gameplay: 'Drag each organism to its correct position in the soil food web!',
  quizIntro: 'Great work! Now let\'s test what you\'ve learned about how these organisms are connected.',
  complete: 'You built the soil food web! Healthy soil depends on every organism doing its part.',
}
