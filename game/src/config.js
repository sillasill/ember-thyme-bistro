// Ember & Thyme — Bistro Rush: every tunable number of the game in one place.
// The kitchen, the recipes, the prices and the shift clock all live here so the
// rest of the game reads like a recipe book, not a bag of magic numbers.

export const VIEW = { width: 1280, height: 800 };
export const HUD_HEIGHT = 96;
export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 150;
export const MAX_CARRY = 3;
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 6;
export const BURN_SECONDS = 12;
export const MAX_ORDERS = 3;
export const WRONG_SERVE_PENALTY = 5;
export const LOST_ORDER_PENALTY = 10;

// One entry per ingredient. `chop` names the item chopping produces, `grill`
// the item grilling produces; `burns` says a grilled item can burn.
export const INGREDIENTS = {
  bun: { label: 'Bun', color: '#e8b06a', dark: '#b97f3e', price: 0 },
  pattyRaw: { label: 'Raw Patty', color: '#c98a7a', dark: '#8f4f42', grill: 'pattyCooked', price: 0 },
  pattyCooked: { label: 'Grilled Patty', color: '#7a4a2e', dark: '#4e2c18', burns: true, price: 0 },
  pattyBurnt: { label: 'Burnt Patty', color: '#2b2b2b', dark: '#111111', price: 0 },
  tomato: { label: 'Tomato', color: '#e5484d', dark: '#a92c31', chop: 'tomatoChopped', price: 0 },
  tomatoChopped: { label: 'Chopped Tomato', color: '#f06a5e', dark: '#c23a34', price: 0 },
  lettuce: { label: 'Lettuce', color: '#58b368', dark: '#2f7d3d', chop: 'lettuceChopped', price: 0 },
  lettuceChopped: { label: 'Chopped Lettuce', color: '#7fce8a', dark: '#4a9a58', price: 0 },
  cheese: { label: 'Cheese', color: '#f6c945', dark: '#c99a1d', price: 0 },
  onion: { label: 'Onion', color: '#e8e0f0', dark: '#9a8fb0', chop: 'onionChopped', price: 0 },
  onionChopped: { label: 'Chopped Onion', color: '#f4eefc', dark: '#b3a6c8', price: 0 },
};

export const CHOPPABLE = ['tomato', 'lettuce', 'onion'];

// A recipe is a multiset of items: the plate matches when it holds exactly
// these, no more and no less. `needs` maps item kind to count.
export const RECIPES = [
  {
    id: 'ember-classic',
    name: 'Ember Classic',
    needs: { bun: 1, pattyCooked: 1, lettuceChopped: 1, tomatoChopped: 1 },
    price: 22,
    blurb: 'The house burger',
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    needs: { bun: 1, pattyCooked: 1, cheese: 1 },
    price: 16,
    blurb: 'Simple and golden',
  },
  {
    id: 'garden-bowl',
    name: 'Garden Bowl',
    needs: { lettuceChopped: 1, tomatoChopped: 1, onionChopped: 1 },
    price: 15,
    blurb: 'Crisp and fresh',
  },
  {
    id: 'sunrise-bun',
    name: 'Sunrise Bun',
    needs: { bun: 1, pattyCooked: 1, cheese: 1, onionChopped: 1 },
    price: 20,
    blurb: 'A sharp little bite',
  },
  {
    id: 'double-trouble',
    name: 'Double Trouble',
    needs: { bun: 1, pattyCooked: 2, cheese: 1, tomatoChopped: 1 },
    price: 28,
    blurb: 'Two patties, no mercy',
  },
];

export function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return null;
}

// How long a fresh order waits before it walks out, and how fast new orders
// arrive as the shift wears on.
export function patienceFor(elapsed) {
  return Math.max(55, 85 - elapsed * 0.15);
}

export function spawnIntervalFor(elapsed) {
  return Math.max(8, 15 - elapsed * 0.04);
}

// A dish's tip shrinks with the order's remaining patience: serve fast and
// the customer pays up to 8 coins over the menu price.
export function tipFor(order) {
  return Math.round(8 * (order.patience / order.patienceMax));
}

// A streak of clean serves multiplies the payout, up to 1.5x.
export function comboMultiplier(combo) {
  return Math.min(1.5, 1 + 0.1 * Math.max(0, combo - 1));
}
