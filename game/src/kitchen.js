// The kitchen floor plan: where every station sits, what it is called, and
// how the chef bumps into it. Counters are rectangles the chef walks around;
// the pantry bins, the pass and the bin are wall fixtures the chef stands
// beside. `approach` is the spot the chef walks to when a station is picked.

import { HUD_HEIGHT } from './config.js';

export const STATIONS = {
  pantryBun: { id: 'pantryBun', kind: 'pantry', item: 'bun', label: 'Buns', x: 16, y: 132, w: 132, h: 84 },
  pantryPatty: { id: 'pantryPatty', kind: 'pantry', item: 'pattyRaw', label: 'Patties', x: 16, y: 232, w: 132, h: 84 },
  pantryTomato: { id: 'pantryTomato', kind: 'pantry', item: 'tomato', label: 'Tomatoes', x: 16, y: 332, w: 132, h: 84 },
  pantryLettuce: { id: 'pantryLettuce', kind: 'pantry', item: 'lettuce', label: 'Lettuce', x: 16, y: 432, w: 132, h: 84 },
  pantryCheese: { id: 'pantryCheese', kind: 'pantry', item: 'cheese', label: 'Cheese', x: 16, y: 532, w: 132, h: 84 },
  pantryOnion: { id: 'pantryOnion', kind: 'pantry', item: 'onion', label: 'Onions', x: 16, y: 632, w: 132, h: 84 },
  board: { id: 'board', kind: 'board', label: 'Chopping Board', x: 280, y: 320, w: 200, h: 96 },
  grill: { id: 'grill', kind: 'grill', label: 'Grill', x: 540, y: 320, w: 200, h: 96 },
  assembly: { id: 'assembly', kind: 'assembly', label: 'Assembly Counter', x: 800, y: 320, w: 200, h: 96 },
  pass: { id: 'pass', kind: 'pass', label: 'Serving Pass', x: 1020, y: 132, w: 244, h: 96 },
  trash: { id: 'trash', kind: 'trash', label: 'Trash', x: 1100, y: 640, w: 120, h: 96 },
};

export const STATION_LIST = Object.values(STATIONS);

// The solid counters the chef cannot walk through (the pantry, pass and
// trash hug the walls and the floor stays open around them).
export const SOLIDS = [STATIONS.board, STATIONS.grill, STATIONS.assembly];

export function stationById(id) {
  return STATIONS[id] || null;
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

// The nearest point on a station's edge to the chef, used to measure reach.
export function nearestPointOn(station, px, py) {
  const x = Math.max(station.x, Math.min(px, station.x + station.w));
  const y = Math.max(station.y, Math.min(py, station.y + station.h));
  return { x, y };
}

export function distanceToStation(station, px, py) {
  const point = nearestPointOn(station, px, py);
  return Math.hypot(px - point.x, py - point.y);
}

// A station is in reach when the chef stands close enough to touch it.
export function nearestStationInReach(px, py, reach) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATION_LIST) {
    const distance = distanceToStation(station, px, py);
    if (distance <= reach && distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }
  return best;
}

// Where the chef stands to work a station: just outside its edge, on the
// side facing the open floor.
export function approachPoint(station) {
  const center = stationCenter(station);
  if (station.kind === 'pantry') return { x: station.x + station.w + 44, y: center.y };
  if (station.kind === 'pass') return { x: center.x, y: station.y + station.h + 44 };
  if (station.kind === 'trash') return { x: station.x - 44, y: center.y };
  return { x: center.x, y: station.y + station.h + 48 };
}

// Keep the chef inside the kitchen floor and out of the solid counters.
export function clampToFloor(x, y, radius) {
  const minX = 152 + radius;
  const maxX = 1280 - 8 - radius;
  const minY = HUD_HEIGHT + 8 + radius;
  const maxY = 800 - 8 - radius;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export function resolveSolids(x, y, radius) {
  let px = x;
  let py = y;
  for (const solid of SOLIDS) {
    const nearestX = Math.max(solid.x, Math.min(px, solid.x + solid.w));
    const nearestY = Math.max(solid.y, Math.min(py, solid.y + solid.h));
    const dx = px - nearestX;
    const dy = py - nearestY;
    const distance = Math.hypot(dx, dy);
    if (distance < radius && distance > 0.001) {
      px = nearestX + (dx / distance) * radius;
      py = nearestY + (dy / distance) * radius;
    } else if (distance <= 0.001) {
      py = solid.y + solid.h + radius;
    }
  }
  return { x: px, y: py };
}
