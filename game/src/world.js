// The world: everything the game is, and the one step that moves it forward.
// The chopping board holds one item and chops it while the chef holds the
// key; the grill cooks up to two patties and burns them if forgotten; the
// assembly counter holds the plate being built; the pass takes the plate.

import {
  CHOP_SECONDS,
  GRILL_SECONDS,
  BURN_SECONDS,
  SHIFT_SECONDS,
  TARGET_COINS,
  INGREDIENTS,
  CHOPPABLE,
  WRONG_SERVE_PENALTY,
  LOST_ORDER_PENALTY,
} from './config.js';
import { makeRng } from './random.js';
import { createChef, moveChef, steerToward, chefAt, chefCanCarry, REACH } from './chef.js';
import {
  STATIONS,
  nearestStationInReach,
  approachPoint,
} from './kitchen.js';
import { createOrders, updateOrders, findMatchingOrder, serveOrder } from './orders.js';
import {
  playPickup,
  playPlace,
  playChop,
  playServe,
  playError,
  playOrder,
  playWin,
  playLose,
  setSizzle,
} from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

export function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    screen: SCREEN_TITLE,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    chef: createChef(),
    orders: createOrders(rng),
    board: { item: null, progress: 0, chopping: false },
    grill: [
      { item: null, progress: 0 },
      { item: null, progress: 0 },
    ],
    plate: { contents: [] },
    plateOnCounter: true,
    messages: [],
    toasts: [],
    interactHeld: false,
    chopSoundAt: 0,
    result: null,
    muted: false,
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
}

export function addMessage(world, text, kind) {
  world.messages.push({ text, kind: kind || 'info', life: 2.2 });
}

export function startShift(world) {
  world.screen = SCREEN_PLAY;
  world.elapsed = 0;
  world.timeLeft = SHIFT_SECONDS;
  world.coins = 0;
  world.combo = 0;
  addMessage(world, 'Shift started — serve ' + TARGET_COINS + ' coins worth before closing!', 'info');
}

export function finishShift(world) {
  const won = world.coins >= TARGET_COINS;
  world.screen = won ? SCREEN_WIN : SCREEN_LOSE;
  const stars = world.coins >= 260 ? 3 : world.coins >= 200 ? 2 : won ? 1 : 0;
  world.result = { won, stars, coins: world.coins, served: world.orders.served, lost: world.orders.lost, bestCombo: world.bestCombo };
  if (won) playWin();
  else playLose();
  setSizzle(false);
}

function topCarry(chef) {
  return chef.carry.length ? chef.carry[chef.carry.length - 1] : null;
}

function plateContents(world) {
  return world.plate.contents;
}

// The one context action: what E (or a click) does depends on the station in
// reach and what the chef is holding. Every branch answers at once with a
// sound and a floating message, so the game never feels dead.
export function interact(world) {
  const chef = world.chef;
  const station = nearestStationInReach(chef.x, chef.y, REACH + 30);
  if (!station) return;
  if (station.kind === 'pantry') {
    if (chef.plate) {
      addMessage(world, 'Both hands are full with the plate!', 'error');
      playError();
      return;
    }
    if (!chefCanCarry(chef)) {
      addMessage(world, 'Tray is full — use what you carry first', 'error');
      playError();
      return;
    }
    chef.carry.push(station.item);
    playPickup();
    addMessage(world, 'Picked up ' + INGREDIENTS[station.item].label, 'info');
    return;
  }
  if (station.kind === 'board') {
    const board = world.board;
    if (board.item && board.progress >= 1) {
      if (chef.carry.length >= 3) {
        addMessage(world, 'Tray is full — use what you carry first', 'error');
        playError();
        return;
      }
      chef.carry.push(board.item);
      board.item = null;
      board.progress = 0;
      playPickup();
      addMessage(world, 'Picked up ' + INGREDIENTS[chef.carry[chef.carry.length - 1]].label, 'info');
      return;
    }
    if (board.item) {
      addMessage(world, 'Hold E to chop it…', 'info');
      return;
    }
    const item = topCarry(chef);
    if (item && CHOPPABLE.includes(item)) {
      chef.carry.pop();
      board.item = item;
      board.progress = 0;
      playPlace();
      addMessage(world, INGREDIENTS[item].label + ' on the board — hold E to chop', 'info');
      return;
    }
    if (item) {
      addMessage(world, INGREDIENTS[item].label + ' does not need chopping', 'error');
      playError();
      return;
    }
    addMessage(world, 'Bring something to chop: tomato, lettuce or onion', 'info');
    return;
  }
  if (station.kind === 'grill') {
    const slot = world.grill.find((s) => s.item === null);
    const cooked = world.grill.find((s) => s.item === 'pattyCooked' || s.item === 'pattyBurnt');
    const item = topCarry(chef);
    if (item === 'pattyRaw' && slot) {
      chef.carry.pop();
      slot.item = 'pattyRaw';
      slot.progress = 0;
      playPlace();
      addMessage(world, 'Patty on the grill — watch it sizzle', 'info');
      return;
    }
    if (cooked && !chef.plate) {
      if (chef.carry.length >= 3) {
        addMessage(world, 'Tray is full', 'error');
        playError();
        return;
      }
      const got = cooked.item;
      cooked.item = null;
      cooked.progress = 0;
      if (got === 'pattyBurnt') {
        addMessage(world, 'Burnt! That patty goes in the trash', 'error');
        playError();
        chef.carry.push(got);
      } else {
        chef.carry.push(got);
        playPickup();
        addMessage(world, 'Grilled patty — hot off the grill', 'info');
      }
      return;
    }
    if (item === 'pattyRaw' && !slot) {
      addMessage(world, 'The grill is full', 'error');
      playError();
      return;
    }
    addMessage(world, 'The grill only takes raw patties', 'info');
    return;
  }
  if (station.kind === 'assembly') {
    if (chef.plate) {
      world.plateOnCounter = true;
      chef.plate = null;
      playPlace();
      addMessage(world, 'Plate back on the counter', 'info');
      return;
    }
    if (!world.plateOnCounter) {
      world.plateOnCounter = true;
      playPlace();
      addMessage(world, 'Fresh plate on the counter', 'info');
      return;
    }
    const item = topCarry(chef);
    if (item) {
      if (world.plate.contents.length >= 6) {
        addMessage(world, 'The plate is full', 'error');
        playError();
        return;
      }
      chef.carry.pop();
      world.plate.contents.push(item);
      playPlace();
      addMessage(world, INGREDIENTS[item].label + ' on the plate', 'info');
      return;
    }
    if (world.plate.contents.length > 0) {
      chef.plate = { contents: world.plate.contents };
      world.plate.contents = [];
      world.plateOnCounter = false;
      playPickup();
      addMessage(world, 'Plate in hand — to the pass!', 'info');
      return;
    }
    addMessage(world, 'Add ingredients to build a dish', 'info');
    return;
  }
  if (station.kind === 'pass') {
    if (!chef.plate) {
      addMessage(world, 'Bring a finished plate to serve', 'info');
      return;
    }
    const contents = chef.plate.contents;
    const order = findMatchingOrder(world.orders, contents);
    if (order) {
      const served = serveOrder(world.orders, order, world.combo);
      world.combo += 1;
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      world.coins += served.earned;
      chef.plate = null;
      playServe();
      addMessage(world, 'Served ' + order.name + ' — +' + served.earned + ' coins (tip ' + served.tip + ')', 'good');
    } else {
      world.coins = Math.max(0, world.coins - WRONG_SERVE_PENALTY);
      world.combo = 0;
      chef.plate = null;
      playError();
      addMessage(world, 'No order wants that dish — −' + WRONG_SERVE_PENALTY + ' coins', 'error');
    }
    return;
  }
  if (station.kind === 'trash') {
    if (chef.plate) {
      chef.plate = null;
      playPlace();
      addMessage(world, 'Plate cleared', 'info');
      return;
    }
    const item = chef.carry.pop();
    if (item) {
      playPlace();
      addMessage(world, INGREDIENTS[item].label + ' binned', 'info');
    } else {
      addMessage(world, 'Nothing to throw away', 'info');
    }
  }
}

// Hold-to-chop: while the key stays down beside the board, the knife works.
export function holdInteract(world, dt) {
  const chef = world.chef;
  const station = nearestStationInReach(chef.x, chef.y, REACH + 30);
  if (!station || station.kind !== 'board') return;
  const board = world.board;
  if (!board.item || board.progress >= 1) return;
  board.chopping = true;
  board.progress += dt / CHOP_SECONDS;
  if (world.elapsed - world.chopSoundAt > 0.22) {
    world.chopSoundAt = world.elapsed;
    playChop();
  }
  if (board.progress >= 1) {
    board.progress = 1;
    board.item = INGREDIENTS[board.item].chop;
    playPlace();
    addMessage(world, 'Chopped — pick it up', 'good');
  }
}

export function updateWorld(world, input, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (world.timeLeft <= 0) {
    finishShift(world);
    return;
  }
  updateOrders(
    world.orders,
    world.elapsed,
    dt,
    (order) => {
      world.coins = Math.max(0, world.coins - LOST_ORDER_PENALTY);
      world.combo = 0;
      addMessage(world, 'Order walked out: ' + order.name + ' — −' + LOST_ORDER_PENALTY + ' coins', 'error');
      playError();
    },
    () => playOrder(),
  );
  // The grill cooks on its own clock.
  let cooking = false;
  for (const slot of world.grill) {
    if (slot.item === 'pattyRaw' || slot.item === 'pattyCooked') {
      cooking = true;
      slot.progress += dt;
      if (slot.item === 'pattyRaw' && slot.progress >= GRILL_SECONDS) {
        slot.item = 'pattyCooked';
        slot.progress = 0;
        addMessage(world, 'Patty is grilled — grab it before it burns!', 'good');
        playOrder();
      } else if (slot.item === 'pattyCooked' && slot.progress >= BURN_SECONDS) {
        slot.item = 'pattyBurnt';
        slot.progress = 0;
        addMessage(world, 'A patty burnt on the grill!', 'error');
        playError();
      }
    }
  }
  setSizzle(cooking);
  // Movement: keys first, then a click-to-walk target.
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx !== 0 || dy !== 0) {
    world.clickTarget = null;
    moveChef(world.chef, dx, dy, dt);
  } else if (world.clickTarget) {
    const target = world.clickTarget;
    if (chefAt(world.chef, target, 14)) {
      world.clickTarget = null;
    } else {
      steerToward(world.chef, target, dt);
    }
  } else {
    world.chef.moving = false;
  }
  if (world.interactHeld) holdInteract(world, dt);
  else world.board.chopping = false;
  for (let i = world.messages.length - 1; i >= 0; i -= 1) {
    world.messages[i].life -= dt;
    if (world.messages[i].life <= 0) world.messages.splice(i, 1);
  }
}

// One fixed step of the simulation, used by the live loop and by the
// screenshot scenes, which play the real rules forward.
export const STEP = 1 / 60;
export function stepWorld(world, input, dt) {
  updateWorld(world, input, dt || STEP);
}
