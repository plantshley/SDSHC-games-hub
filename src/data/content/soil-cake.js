/**
 * Soil Cake game content
 * 4 soil horizons represented as cake layers.
 * Colors are "cake" themed browns matching soil horizon colors.
 */

export const HORIZONS = [
  {
    id: 'O',
    name: 'O Horizon',
    cakeName: 'Dark Chocolate Frosting',
    clue: 'This horizon is like a layer of dark chocolate frosting with sprinkles.',
    color: '#3b2314',
  },
  {
    id: 'A',
    name: 'A Horizon',
    cakeName: 'Dark Chocolate Cake',
    clue: 'This horizon is like a layer of dark chocolate cake.',
    color: '#5c3a1e',
  },
  {
    id: 'B',
    name: 'B Horizon',
    cakeName: 'Chocolate Fudge',
    clue: 'This horizon is like a layer of sticky chocolate fudge.',
    color: '#8b5e3c',
  },
  {
    id: 'C',
    name: 'C Horizon',
    cakeName: 'Marble Cake',
    clue: 'This horizon is like a layer of chocolate-vanilla marble cake with walnuts and almonds.',
    color: '#c4a882',
  },
]

export const INSTRUCTIONS = {
  intro: 'Welcome to the soil bakery! Enter to start building your cake ~',
  gameplay: 'Tap a color, then tap the matching layer on the cake to fill it!',
  complete: 'Great job! You built the soil cake!',
}
