// The screenshot scenes behind ?shot=start|cover|serve|end. Each one plays
// the real rules forward from a fresh world for a fixed script of moves —
// walk to a station, use it, hold to chop, wait for the grill — so the frame
// is what a short game really looks like, and the same seed always gives the
// same frame. The `end` scene plays a whole shift with a planner that cooks
// the oldest order first, and shows the shift's real result screen.

import { STEP, SCREEN_TITLE, createWorld, startShift, interact, stepWorld } from './world.js';
import { createInput, consumeActionPress } from './input.js';
import { approachPoint, stationById } from './kitchen.js';
import { chefAt, steerDirection } from './chef.js';
import { CHOPPABLE } from './config.js';

const PANTRY_FOR = {
  bun: 'pantryBun',
  pattyRaw: 'pantryPatty',
  tomato: 'pantryTomato',
  lettuce: 'pantryLettuce',
  cheese: 'pantryCheese',
  onion: 'pantryOnion',
};

function chopTarget(item) {
  return { bun: 'bun', tomato: 'tomatoChopped', lettuce: 'lettuceChopped', onion: 'onionChopped' }[item] || item;
}

// Run a plan of primitive steps through the live world update. A step is one
// of {go: stationId}, {use: true}, {hold: seconds}, {wait: seconds} or
// {waitFor: (world) => boolean, timeout: seconds}.
function runPlan(world, plan, maxSeconds) {
  const input = createInput();
  let index = 0;
  let timer = 0;
  const limit = Math.ceil(maxSeconds / STEP);
  for (let i = 0; i < limit && index < plan.length; i += 1) {
    const step = plan[index];
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.action = false;
    world.interactHeld = false;
    if (step.go) {
      const target = approachPoint(stationById(step.go));
      if (chefAt(world.chef, target, 18)) {
        index += 1;
      } else {
        const direction = steerDirection(world.chef, target);
        input.left = direction.dx < 0;
        input.right = direction.dx > 0;
        input.up = direction.dy < 0;
        input.down = direction.dy > 0;
      }
    } else if (step.use) {
      interact(world);
      index += 1;
    } else if (step.hold) {
      world.interactHeld = true;
      timer += STEP;
      if (timer >= step.hold) {
        timer = 0;
        index += 1;
      }
    } else if (step.wait) {
      timer += STEP;
      if (timer >= step.wait) {
        timer = 0;
        index += 1;
      }
    } else if (step.waitFor) {
      timer += STEP;
      if (step.waitFor(world) || timer >= (step.timeout || 20)) {
        timer = 0;
        index += 1;
      }
    } else {
      index += 1;
    }
    stepWorld(world, input, STEP);
    if (world.screen !== 'play') break;
  }
  world.interactHeld = false;
}

function go(stationId) {
  return { go: stationId };
}

function use() {
  return { use: true };
}

// Fetch one ingredient from its pantry bin and drop it on the plate.
function fetchToPlate(item) {
  return [go(PANTRY_FOR[item]), use(), go('assembly'), use()];
}

// Fetch one choppable, chop it on the board, and carry the chopped result.
function fetchChopped(item) {
  return [go(PANTRY_FOR[item]), use(), go('board'), use(), { hold: 1.8 }, use()];
}

// Start one patty grilling.
function startPatty() {
  return [go('pantryPatty'), use(), go('grill'), use()];
}

// The cover scene: a dish mid-assembly — bun, grilled patty and chopped
// lettuce already on the plate, a chopped tomato waiting on the board, and
// cheese in the chef's hand.
function coverPlan() {
  return [
    go('assembly'), use(),
    ...fetchToPlate('bun'),
    ...startPatty(),
    ...fetchChopped('lettuce'),
    go('assembly'), use(),
    { waitFor: (w) => w.grill.some((s) => s.item === 'pattyCooked'), timeout: 14 },
    go('grill'), use(),
    go('assembly'), use(),
    go('pantryCheese'), use(),
    go('pantryTomato'), use(),
    go('board'), use(),
    { hold: 1.8 },
    go('assembly'),
  ];
}

// The serve scene: the cover's dish finished, the plate in hand at the pass.
function servePlan() {
  return [
    ...coverPlan().slice(0, -1),
    use(),
    go('assembly'), use(),
    go('trash'), use(),
    go('assembly'), use(),
    go('pass'),
  ];
}

// Build a plan that cooks the oldest open order from scratch: chop first,
// then grill so the patty cooks while the chef fetches the rest — a patty
// left on the grill burns, so it goes on last and comes off the moment it
// is ready.
function planForOrder(world) {
  const order = world.orders.active[0];
  if (!order) return null;
  const needs = order.needs;
  const plan = [];
  if (!world.plateOnCounter) {
    plan.push(go('assembly'), use());
  }
  // Clear any burnt patty a previous round left on the grill first.
  for (const slot of world.grill) {
    if (slot.item === 'pattyBurnt') {
      plan.push(go('grill'), use(), go('trash'), use());
    }
  }
  let chopped = 0;
  for (const item of CHOPPABLE) {
    const wanted = needs[chopTarget(item)] || 0;
    for (let i = 0; i < wanted; i += 1) {
      plan.push(...fetchChopped(item));
      chopped += 1;
    }
  }
  const patties = needs.pattyCooked || 0;
  for (let i = 0; i < patties; i += 1) plan.push(...startPatty());
  for (const item of ['bun', 'cheese']) {
    const wanted = needs[item] || 0;
    for (let i = 0; i < wanted; i += 1) plan.push(...fetchToPlate(item));
  }
  // The chopped items are still in hand: drop exactly that many on the plate.
  plan.push(go('assembly'));
  for (let i = 0; i < chopped; i += 1) plan.push(use());
  if (patties > 0) {
    plan.push({ waitFor: (w) => w.grill.filter((s) => s.item === 'pattyCooked').length >= patties, timeout: 16 });
    for (let i = 0; i < patties; i += 1) {
      plan.push(go('grill'), use(), go('assembly'), use());
    }
  }
  plan.push(go('assembly'), use(), go('pass'), use());
  return plan;
}

// Play a whole shift the way a hurried cook would: always the oldest order,
// and never stand still while the grill works.
function playShift(world) {
  const input = createInput();
  void input;
  void consumeActionPress;
  let guard = 0;
  while (world.screen === 'play' && guard < 40) {
    guard += 1;
    if (world.orders.active.length === 0) {
      runPlan(world, [{ wait: 3 }], 5);
      continue;
    }
    const plan = planForOrder(world);
    if (!plan) break;
    runPlan(world, plan, 90);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the title scene.
 */
export function stageShot(name, world) {
  const fresh = createWorld(world.seed);
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
  if (name === 'cover') {
    startShift(world);
    runPlan(world, coverPlan(), 120);
    return { screen: 'play' };
  }
  if (name === 'serve') {
    startShift(world);
    runPlan(world, servePlan(), 150);
    return { screen: 'play' };
  }
  if (name === 'end') {
    startShift(world);
    playShift(world);
    return { screen: world.screen };
  }
  // Title: let the kitchen run a few seconds behind the title card.
  startShift(world);
  runPlan(world, [{ wait: 6 }], 8);
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
