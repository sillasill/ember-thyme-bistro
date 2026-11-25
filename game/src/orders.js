// The order board: orders arrive on a timer, wait with a shrinking patience
// bar, and pay out when the matching plate is served. A served order pays its
// menu price plus a tip for the patience still on it, times the combo streak.

import {
  MAX_ORDERS,
  RECIPES,
  patienceFor,
  spawnIntervalFor,
  tipFor,
  comboMultiplier,
} from './config.js';

let nextOrderId = 1;

export function createOrders(rng) {
  return {
    active: [],
    spawnIn: 1.5,
    rng,
    served: 0,
    lost: 0,
  };
}

function pickRecipe(rng, elapsed) {
  // Early orders are the easy ones; the double-decker only shows up once the
  // kitchen is warm.
  const pool = elapsed < 45 ? RECIPES.slice(0, 3) : RECIPES;
  return rng.pick(pool);
}

export function spawnOrder(orders, elapsed) {
  const recipe = pickRecipe(orders.rng, elapsed);
  const patience = patienceFor(elapsed);
  orders.active.push({
    id: nextOrderId,
    recipeId: recipe.id,
    name: recipe.name,
    needs: recipe.needs,
    price: recipe.price,
    patience,
    patienceMax: patience,
    flash: 0,
  });
  nextOrderId += 1;
}

export function updateOrders(orders, elapsed, dt, onExpired, onSpawned) {
  orders.spawnIn -= dt;
  if (orders.spawnIn <= 0 && orders.active.length < MAX_ORDERS) {
    spawnOrder(orders, elapsed);
    orders.spawnIn = spawnIntervalFor(elapsed);
    if (onSpawned) onSpawned();
  }
  for (let i = orders.active.length - 1; i >= 0; i -= 1) {
    const order = orders.active[i];
    order.patience -= dt;
    if (order.flash > 0) order.flash -= dt;
    if (order.patience <= 0) {
      orders.active.splice(i, 1);
      orders.lost += 1;
      if (onExpired) onExpired(order);
    }
  }
}

// The plate's items as a sorted count map, compared against a recipe's needs.
export function plateMatches(plateContents, needs) {
  const counts = {};
  for (const item of plateContents) counts[item] = (counts[item] || 0) + 1;
  const keys = new Set([...Object.keys(counts), ...Object.keys(needs)]);
  for (const key of keys) {
    if ((counts[key] || 0) !== (needs[key] || 0)) return false;
  }
  return true;
}

export function findMatchingOrder(orders, plateContents) {
  for (const order of orders.active) {
    if (plateMatches(plateContents, order.needs)) return order;
  }
  return null;
}

export function serveOrder(orders, order, combo) {
  const index = orders.active.indexOf(order);
  if (index >= 0) orders.active.splice(index, 1);
  const tip = tipFor(order);
  const earned = Math.round((order.price + tip) * comboMultiplier(combo));
  orders.served += 1;
  return { earned, tip };
}
