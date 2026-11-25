// Boot and the live loop: read the seed and the screenshot scene from the
// URL, wire the input to the world, and draw every animation frame. A
// `?shot=` scene stages itself once at load and then sits still for the
// screenshot; a normal load opens the title screen and waits for the player.

import { VIEW } from './config.js';
import {
  createWorld,
  startShift,
  interact,
  updateWorld,
  resetWorld,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_WIN,
  SCREEN_LOSE,
} from './world.js';
import { render } from './render.js';
import { createInput, attachInput, consumeActionPress, consumeClick } from './input.js';
import { nearestStationInReach, stationById, approachPoint } from './kitchen.js';
import { REACH, chefAt } from './chef.js';
import { stageShot } from './shots.js';
import { unlockAudio, setSizzle } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;
const shotName = params.get('shot');
const world = createWorld(seed);
const input = createInput();

let shotScreen = null;
if (shotName) {
  const staged = stageShot(shotName, world);
  shotScreen = staged.screen;
  world.screen = shotScreen;
}

attachInput(input, canvas, {
  onEnter: () => {
    unlockAudio();
    if (world.screen === SCREEN_TITLE) startShift(world);
  },
  onRestart: () => {
    if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
      resetWorld(world);
      startShift(world);
    }
  },
  onMute: () => {
    world.muted = !world.muted;
    setSizzle(false);
  },
});

function handleClick(click) {
  unlockAudio();
  if (world.screen === SCREEN_TITLE) {
    startShift(world);
    return;
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
    resetWorld(world);
    startShift(world);
    return;
  }
  // A click on a station in reach uses it at once; a click elsewhere walks
  // the chef there (or to the station's approach point when it is a station).
  let targetStation = null;
  for (const id of ['pantryBun', 'pantryPatty', 'pantryTomato', 'pantryLettuce', 'pantryCheese', 'pantryOnion', 'board', 'grill', 'assembly', 'pass', 'trash']) {
    const candidate = stationById(id);
    if (click.x >= candidate.x && click.x <= candidate.x + candidate.w &&
        click.y >= candidate.y && click.y <= candidate.y + candidate.h) {
      targetStation = candidate;
      break;
    }
  }
  if (targetStation) {
    const near = nearestStationInReach(world.chef.x, world.chef.y, REACH + 30);
    if (near && near.id === targetStation.id) {
      interact(world);
    } else {
      world.clickTarget = approachPoint(targetStation);
      world.clickStation = targetStation.id;
    }
    return;
  }
  world.clickTarget = { x: click.x, y: click.y };
  world.clickStation = null;
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  world.titlePulse = (world.titlePulse || 0) + dt * 2.4;
  world.nearestStation = world.screen === SCREEN_PLAY
    ? nearestStationInReach(world.chef.x, world.chef.y, REACH + 30)
    : null;
  if (!shotName) {
    if (consumeActionPress(input) && world.screen === SCREEN_PLAY) interact(world);
    world.interactHeld = input.action && world.screen === SCREEN_PLAY;
    const click = consumeClick(input);
    if (click) handleClick(click);
    // Walking into a station the chef was sent to uses it on arrival.
    if (world.clickStation && world.clickTarget && chefAt(world.chef, world.clickTarget, 16)) {
      const station = stationById(world.clickStation);
      if (station && nearestStationInReach(world.chef.x, world.chef.y, REACH + 30) === station) {
        interact(world);
      }
      world.clickTarget = null;
      world.clickStation = null;
    }
    updateWorld(world, input, dt);
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// A hook for the play-test: the page reports its own errors into the title,
// where a headless run can read them back.
window.addEventListener('error', (event) => {
  document.title = 'ERROR: ' + event.message;
});
