// The chef: where they stand, which way they face, what their hands hold.
// The chef carries loose ingredients in a tray (up to three) and can also
// carry one finished plate, which takes both hands: no loose items ride along.

import { MAX_CARRY } from './config.js';
import { clampToFloor, resolveSolids } from './kitchen.js';

export const CHEF_SPEED = 285;
export const CHEF_RADIUS = 26;
export const REACH = 78;

export function createChef() {
  return {
    x: 640,
    y: 560,
    facing: -1,
    moving: false,
    carry: [],
    plate: null,
    walkPhase: 0,
  };
}

export function chefCanCarry(chef) {
  return chef.plate === null && chef.carry.length < MAX_CARRY;
}

export function chefHasPlate(chef) {
  return chef.plate !== null;
}

export function moveChef(chef, dx, dy, dt) {
  const length = Math.hypot(dx, dy);
  if (length < 0.001) {
    chef.moving = false;
    return;
  }
  const step = CHEF_SPEED * dt;
  let next = { x: chef.x + (dx / length) * step, y: chef.y + (dy / length) * step };
  next = resolveSolids(next.x, next.y, CHEF_RADIUS);
  next = clampToFloor(next.x, next.y, CHEF_RADIUS);
  chef.x = next.x;
  chef.y = next.y;
  chef.facing = dx < -0.1 ? -1 : dx > 0.1 ? 1 : chef.facing;
  chef.moving = true;
  chef.walkPhase += dt * 11;
}

// Which way to walk toward a point without cutting through counters. The
// three counters sit in one horizontal band (y 320..416, plus the chef's
// radius), so the kitchen has two clear corridors — north of the band and
// south of it — and two clear gap columns at the sides. The route is a
// waypoint, recomputed on every call: leave the band's rows first, cross it
// only in a gap column, and move one axis at a time so the chef never clips
// a counter's corner. The route is a waypoint list, recomputed on every
// call from where the chef stands: leave the band's rows first when the
// target is not in the same gap column, cross the band only in a gap column,
// and move one axis at a time. Returns a unit direction toward the waypoint.
function route(chef, target) {
  const inBandY = (y) => y >= 294 && y <= 442;
  const inGapX = (x) => x < 214 || x > 986;
  // Step out of the band's rows toward the target's side: picking the exit
  // by the chef's own row fights the route and the chef bounces on the
  // boundary, so the target's side decides.
  const exitY = target.y < 294 ? 250 : target.y > 442 ? 560 : target.y < 368 ? 250 : 560;
  // Inside the band's rows and between the counters: step out vertically.
  if (inBandY(chef.y) && !inGapX(chef.x)) {
    return [{ x: chef.x, y: exitY }];
  }
  // Inside the band's rows but in a gap column: only the same gap is direct.
  if (inBandY(chef.y)) {
    const sameGap = (chef.x < 214 && target.x < 214) || (chef.x > 986 && target.x > 986);
    if (!sameGap) return [{ x: chef.x, y: exitY }];
    return [target];
  }
  // Out of the band's rows: a target in a gap column is reached along it.
  if (target.x < 214) {
    if (Math.abs(chef.x - 192) > 40) return [{ x: 192, y: chef.y }, target];
    return [target];
  }
  if (target.x > 986) {
    if (Math.abs(chef.x - 1100) > 40) return [{ x: 1100, y: chef.y }, target];
    return [target];
  }
  // Opposite sides of the band: cross in the gap nearest the target.
  const chefNorth = chef.y < 294;
  const targetNorth = target.y < 294;
  if (chefNorth !== targetNorth) {
    const gapX = target.x <= 640 ? 192 : 1100;
    if (Math.abs(chef.x - gapX) > 40) return [{ x: gapX, y: chef.y }, { x: gapX, y: target.y }, target];
    return [{ x: gapX, y: target.y }, target];
  }
  return [target];
}

export function steerDirection(chef, target) {
  const waypoint = route(chef, target)[0];
  const dx = waypoint.x - chef.x;
  const dy = waypoint.y - chef.y;
  if (Math.abs(dx) > 10) return { dx, dy: 0 };
  if (Math.abs(dy) > 10) return { dx: 0, dy };
  return { dx: 0, dy: 0 };
}

export function steerToward(chef, target, dt) {
  const direction = steerDirection(chef, target);
  if (direction.dx !== 0 || direction.dy !== 0) moveChef(chef, direction.dx, direction.dy, dt);
}

export function chefAt(chef, target, slack = 16) {
  return Math.abs(chef.x - target.x) <= slack && Math.abs(chef.y - target.y) <= slack;
}
