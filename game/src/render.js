// Everything the eye sees: the kitchen floor, the stations, the food, the
// chef, the order board and the screens. All art is drawn with canvas paths —
// no image files ship with the game — so the screenshots are the game's own
// drawing, and a small canvas reads clearly even shrunk to a contact sheet.

import { VIEW, HUD_HEIGHT, INGREDIENTS, RECIPES, recipeById, TARGET_COINS } from './config.js';
import { STATIONS, STATION_LIST } from './kitchen.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSE } from './world.js';

const FLOOR_A = '#e9c9a0';
const FLOOR_B = '#dfb98d';
const WALL = '#8a5a3b';
const COUNTER_TOP = '#a4713f';
const COUNTER_FRONT = '#7c4f2a';
const STEEL = '#b9c0c7';
const STEEL_DARK = '#8d949c';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || '700') + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn as a little piece of food. `size` is the icon's box.
export function drawIngredient(ctx, kind, x, y, size) {
  const info = INGREDIENTS[kind];
  if (!info) return;
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = info.dark;
    roundRect(ctx, -s * 0.48, -s * 0.08, s * 0.96, s * 0.42, s * 0.14);
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.06, s * 0.46, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * s * 0.2, -s * 0.28, s * 0.05, s * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'pattyRaw' || kind === 'pattyCooked' || kind === 'pattyBurnt') {
    ctx.fillStyle = info.dark;
    roundRect(ctx, -s * 0.5, -s * 0.22, s, s * 0.44, s * 0.2);
    ctx.fill();
    ctx.fillStyle = info.color;
    roundRect(ctx, -s * 0.46, -s * 0.26, s * 0.92, s * 0.36, s * 0.18);
    ctx.fill();
    if (kind === 'pattyCooked') {
      ctx.strokeStyle = '#3a2113';
      ctx.lineWidth = Math.max(1, s * 0.04);
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.24 - s * 0.08, -s * 0.2);
        ctx.lineTo(i * s * 0.24 + s * 0.08, s * 0.18);
        ctx.stroke();
      }
    }
  } else if (kind === 'tomato' || kind === 'tomatoChopped') {
    ctx.fillStyle = info.dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb3a7';
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.1, s * 0.13, 0, Math.PI * 2);
    ctx.arc(s * 0.14, s * 0.08, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    if (kind === 'tomatoChopped') {
      ctx.strokeStyle = info.dark;
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, 0);
      ctx.lineTo(s * 0.3, 0);
      ctx.stroke();
    }
  } else if (kind === 'lettuce' || kind === 'lettuceChopped') {
    ctx.fillStyle = info.dark;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.04, s * 0.44, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.05, 0, 0, s * 0.26);
    ctx.stroke();
  } else if (kind === 'cheese') {
    ctx.fillStyle = info.dark;
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, s * 0.3);
    ctx.lineTo(s * 0.46, s * 0.3);
    ctx.lineTo(0, -s * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.24);
    ctx.lineTo(s * 0.4, s * 0.24);
    ctx.lineTo(0, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = info.dark;
    ctx.beginPath();
    ctx.arc(-s * 0.1, s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.14, -s * 0.08, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'onion' || kind === 'onionChopped') {
    ctx.fillStyle = info.dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9b8dd';
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, size, contents) {
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.52, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (contents && contents.length) {
    const n = contents.length;
    contents.forEach((item, i) => {
      const ox = (i - (n - 1) / 2) * size * 0.22;
      const oy = -size * 0.06 - (n - 1 - i) * size * 0.05;
      drawIngredient(ctx, item, x + ox, y + oy, size * 0.42);
    });
  }
}

function drawProgressRing(ctx, x, y, radius, fraction, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
  ctx.stroke();
}

function drawFloor(ctx) {
  const tile = 64;
  for (let y = HUD_HEIGHT; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0 ? FLOOR_A : FLOOR_B);
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = HUD_HEIGHT; y < VIEW.height; y += tile) ctx.fillRect(0, y, VIEW.width, 2);
  for (let x = 0; x < VIEW.width; x += tile) ctx.fillRect(x, HUD_HEIGHT, 2, VIEW.height - HUD_HEIGHT);
}

function drawPantry(ctx, world, station) {
  ctx.fillStyle = '#6d4a2f';
  roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, station.h + 8, 10);
  ctx.fill();
  ctx.fillStyle = '#efe3c8';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  drawIngredient(ctx, station.item, station.x + 32, station.y + station.h / 2, 48);
  text(ctx, station.label, station.x + 62, station.y + 26, 13, '#5a3a22', '700');
  text(ctx, 'E: take', station.x + 62, station.y + 52, 12, '#8a6a4a', '600');
}

function drawBoard(ctx, world) {
  const station = STATIONS.board;
  ctx.fillStyle = COUNTER_FRONT;
  roundRect(ctx, station.x, station.y + 10, station.w, station.h - 6, 8);
  ctx.fill();
  ctx.fillStyle = COUNTER_TOP;
  roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#f6ead0';
  roundRect(ctx, station.x + 14, station.y + 18, station.w - 28, station.h - 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  roundRect(ctx, station.x + 14, station.y + 18, station.w - 28, station.h - 30, 8);
  ctx.stroke();
  const boardReady = world.board.item && world.board.progress >= 1;
  text(ctx, boardReady ? 'READY ✓' : 'CHOP', station.x + station.w / 2, station.y + 12, 12, boardReady ? '#b8f0a0' : '#fff', '800', 'center');
  if (world.board.item) {
    drawIngredient(ctx, world.board.item, station.x + station.w / 2, station.y + 54, 46);
    if (world.board.progress > 0 && world.board.progress < 1) {
      drawProgressRing(ctx, station.x + station.w / 2, station.y + 54, 34, world.board.progress, '#e07b39');
    }
  } else {
    text(ctx, 'tomato · lettuce · onion', station.x + station.w / 2, station.y + 56, 12, '#a98f6d', '600', 'center');
  }
}

function drawGrill(ctx, world) {
  const station = STATIONS.grill;
  ctx.fillStyle = COUNTER_FRONT;
  roundRect(ctx, station.x, station.y + 10, station.w, station.h - 6, 8);
  ctx.fill();
  ctx.fillStyle = STEEL_DARK;
  roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, station.h + 4, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3a3a';
  roundRect(ctx, station.x + 10, station.y + 14, station.w - 20, station.h - 30, 6);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(station.x + 10 + (i * (station.w - 20)) / 5, station.y + 16);
    ctx.lineTo(station.x + 10 + (i * (station.w - 20)) / 5, station.y + station.h - 18);
    ctx.stroke();
  }
  text(ctx, 'GRILL', station.x + station.w / 2, station.y + 12, 12, '#fff', '800', 'center');
  world.grill.forEach((slot, i) => {
    if (!slot.item) return;
    const cx = station.x + 55 + i * 90;
    const cy = station.y + 52;
    drawIngredient(ctx, slot.item, cx, cy, 52);
    if (slot.item === 'pattyRaw') {
      drawProgressRing(ctx, cx, cy, 34, Math.min(1, slot.progress / 6), '#e8a33d');
    } else if (slot.item === 'pattyCooked') {
      const burnLeft = Math.max(0, 1 - slot.progress / 7);
      ctx.fillStyle = burnLeft < 0.35 ? '#e5484d' : '#e8a33d';
      ctx.font = '800 11px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(burnLeft < 0.35 ? 'BURNING!' : 'READY', cx, cy + 40);
    } else if (slot.item === 'pattyBurnt') {
      text(ctx, 'BURNT', cx, cy + 40, 11, '#e5484d', '800', 'center');
    }
  });
}

function drawAssembly(ctx, world) {
  const station = STATIONS.assembly;
  ctx.fillStyle = COUNTER_FRONT;
  roundRect(ctx, station.x, station.y + 10, station.w, station.h - 6, 8);
  ctx.fill();
  ctx.fillStyle = COUNTER_TOP;
  roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#f2e7cf';
  roundRect(ctx, station.x + 10, station.y + 18, station.w - 20, station.h - 30, 8);
  ctx.fill();
  text(ctx, 'PLATE', station.x + station.w / 2, station.y + 12, 12, '#fff', '800', 'center');
  if (world.plateOnCounter) {
    drawPlate(ctx, station.x + station.w / 2, station.y + 56, 84, world.plate.contents);
    if (world.plate.contents.length === 0) {
      text(ctx, 'empty plate — add food', station.x + station.w / 2, station.y + station.h - 6, 11, '#a98f6d', '600', 'center');
    }
  }
}

function drawPass(ctx, world) {
  const station = STATIONS.pass;
  ctx.fillStyle = '#5a3a22';
  roundRect(ctx, station.x - 4, station.y - 4, station.w + 8, station.h + 8, 10);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = '#e07b39';
  roundRect(ctx, station.x, station.y, station.w, 26, 8);
  ctx.fill();
  text(ctx, '◆ SERVING PASS ◆', station.x + station.w / 2, station.y + 14, 14, '#fff', '800', 'center');
  text(ctx, 'serve the matching order', station.x + station.w / 2, station.y + 58, 13, '#8a6a4a', '600', 'center');
  text(ctx, 'E with a plate in hand', station.x + station.w / 2, station.y + 78, 12, '#b09a7c', '600', 'center');
}

function drawTrash(ctx) {
  const station = STATIONS.trash;
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#5d5d66';
  roundRect(ctx, station.x + 8, station.y + 8, station.w - 16, station.h - 16, 8);
  ctx.fill();
  text(ctx, 'TRASH', station.x + station.w / 2, station.y + station.h / 2 - 10, 15, '#cfcfd6', '800', 'center');
  text(ctx, 'E: bin it', station.x + station.w / 2, station.y + station.h / 2 + 14, 12, '#9a9aa5', '600', 'center');
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 24 - bob, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Apron body.
  ctx.fillStyle = '#f2f2f2';
  roundRect(ctx, -20, -8, 40, 34, 14);
  ctx.fill();
  ctx.fillStyle = '#e07b39';
  roundRect(ctx, -20, 12, 40, 8, 4);
  ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -20, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-9, -32, 9, 0, Math.PI * 2);
  ctx.arc(0, -36, 10, 0, Math.PI * 2);
  ctx.arc(9, -32, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -34, 28, 8);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(chef.facing * 4 - 5, -20, 2.2, 0, Math.PI * 2);
  ctx.arc(chef.facing * 4 + 5, -20, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // The tray: loose ingredients ride above the head, a plate rides in front.
  if (chef.plate) {
    drawPlate(ctx, chef.facing * 30, 6, 56, chef.plate.contents);
  } else if (chef.carry.length) {
    chef.carry.forEach((item, i) => {
      drawIngredient(ctx, item, (i - (chef.carry.length - 1) / 2) * 26, -52, 30);
    });
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const urgency = order.patience / order.patienceMax;
  const border = urgency < 0.3 ? '#e5484d' : urgency < 0.6 ? '#e8a33d' : '#7c9a5a';
  ctx.fillStyle = '#fffdf4';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, order.name, x + 12, y + 16, 15, '#3a2a1a', '800');
  const needs = Object.entries(order.needs);
  needs.forEach(([item, count], i) => {
    const ix = x + 22 + i * 44;
    drawIngredient(ctx, item, ix, y + 40, 30);
    if (count > 1) text(ctx, '×' + count, ix + 15, y + 52, 13, '#3a2a1a', '800');
  });
  ctx.fillStyle = '#e8e0d0';
  roundRect(ctx, x + 12, y + h - 11, w - 24, 6, 3);
  ctx.fill();
  ctx.fillStyle = border;
  roundRect(ctx, x + 12, y + h - 11, (w - 24) * urgency, 6, 3);
  ctx.fill();
  text(ctx, '$' + order.price, x + w - 12, y + 16, 15, '#7c5a1d', '800', 'right');
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(0, HUD_HEIGHT - 6, VIEW.width, 6);
  text(ctx, 'ORDERS', 16, 18, 13, '#e8c88a', '800');
  const ticketW = 218;
  const ticketH = 66;
  for (let i = 0; i < 3; i += 1) {
    const x = 16 + i * (ticketW + 10);
    const order = world.orders.active[i];
    if (order) drawOrderTicket(ctx, order, x, 24, ticketW, ticketH);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      roundRect(ctx, x, 24, ticketW, ticketH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, 24, ticketW, ticketH, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for orders…', x + ticketW / 2, 24 + ticketH / 2, 13, 'rgba(255,255,255,0.45)', '600', 'center');
    }
  }
  // Shift timer, coins and target on the right.
  const timeLeft = Math.ceil(world.timeLeft);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');
  const urgent = timeLeft <= 30;
  text(ctx, minutes + ':' + seconds, 760, 34, 34, urgent ? '#ff7a6b' : '#fff3d6', '800', 'center');
  text(ctx, 'SHIFT', 760, 66, 11, '#c9a86a', '700', 'center');
  const coinText = world.coins + ' / ' + TARGET_COINS + ' coins';
  text(ctx, coinText, 900, 34, 26, '#ffd76a', '800');
  text(ctx, 'COINS', 900, 66, 11, '#c9a86a', '700');
  text(ctx, 'combo ×' + world.combo, 1100, 34, 20, world.combo >= 3 ? '#ff9d5c' : '#d8c9a8', '800');
  text(ctx, 'served ' + world.orders.served, 1100, 66, 11, '#c9a86a', '700');
}

function drawMessages(ctx, world) {
  world.messages.forEach((message, i) => {
    const alpha = Math.min(1, message.life);
    const y = VIEW.height - 56 - i * 30;
    ctx.globalAlpha = alpha;
    ctx.font = '600 14px "Trebuchet MS", Verdana, sans-serif';
    const width = ctx.measureText(message.text).width + 28;
    ctx.fillStyle = message.kind === 'error' ? 'rgba(120,20,20,0.9)' : message.kind === 'good' ? 'rgba(30,90,40,0.9)' : 'rgba(40,30,20,0.9)';
    roundRect(ctx, 16, y - 15, Math.max(120, width), 30, 15);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(message.text, 30, y + 1);
    ctx.globalAlpha = 1;
  });
}

function drawHintBar(ctx, world) {
  const station = world.nearestStation || null;
  const hint = station
    ? station.label + ' — press E'
    : 'WASD / arrows to move · E to use a station · click a station to walk there';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, VIEW.width / 2 - 260, VIEW.height - 34, 520, 26, 13);
  ctx.fill();
  text(ctx, hint, VIEW.width / 2, VIEW.height - 20, 13, '#fff', '600', 'center');
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20,12,6,0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'EMBER & THYME', VIEW.width / 2, 210, 64, '#ffd76a', '800', 'center');
  text(ctx, '— BISTRO RUSH —', VIEW.width / 2, 262, 26, '#fff3d6', '700', 'center');
  text(ctx, 'A one-chef race against the dinner rush.', VIEW.width / 2, 310, 18, '#e8d9b8', '600', 'center');
  text(ctx, 'Chop it. Grill it. Plate it. Serve it before the order walks out.', VIEW.width / 2, 340, 18, '#e8d9b8', '600', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, VIEW.width / 2 - 300, 380, 600, 150, 12);
  ctx.fill();
  text(ctx, 'HOW TO PLAY', VIEW.width / 2, 404, 16, '#ffd76a', '800', 'center');
  text(ctx, 'WASD / arrows — move the chef      E — use a station (hold E to chop)', VIEW.width / 2, 436, 15, '#fff', '600', 'center');
  text(ctx, 'Mouse — click a station to walk there and use it', VIEW.width / 2, 462, 15, '#fff', '600', 'center');
  text(ctx, 'Take ingredients → chop & grill → build the plate → serve at the pass', VIEW.width / 2, 488, 15, '#fff', '600', 'center');
  text(ctx, 'Serve ' + TARGET_COINS + ' coins before the 3-minute shift ends to win.', VIEW.width / 2, 514, 15, '#ffe9a8', '700', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(world.titlePulse || 0);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER OR CLICK TO START', VIEW.width / 2, 590, 24, '#ffffff', '800', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'Five recipes · combos pay more · burnt patties go in the trash', VIEW.width / 2, 640, 14, '#c9b89a', '600', 'center');
}

function drawResult(ctx, world, won) {
  ctx.fillStyle = won ? 'rgba(20,50,20,0.72)' : 'rgba(50,16,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const result = world.result || { coins: world.coins, served: 0, lost: 0, bestCombo: 0, stars: 0 };
  text(ctx, won ? 'SHIFT COMPLETE!' : 'CLOSING TIME…', VIEW.width / 2, 200, 56, won ? '#ffd76a' : '#ff9d8a', '800', 'center');
  if (won) {
    const stars = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    text(ctx, stars, VIEW.width / 2, 268, 44, '#ffd76a', '800', 'center');
  }
  text(
    ctx,
    won ? 'The dining room is full and the pass is clear.' : 'The target was ' + TARGET_COINS + ' coins — the rush won this time.',
    VIEW.width / 2,
    322,
    19,
    '#fff3d6',
    '600',
    'center',
  );
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, VIEW.width / 2 - 260, 360, 520, 170, 12);
  ctx.fill();
  text(ctx, 'Coins earned   ' + result.coins, VIEW.width / 2, 392, 22, '#fff', '700', 'center');
  text(ctx, 'Dishes served   ' + result.served, VIEW.width / 2, 428, 18, '#e8d9b8', '600', 'center');
  text(ctx, 'Orders lost   ' + result.lost, VIEW.width / 2, 458, 18, '#e8d9b8', '600', 'center');
  text(ctx, 'Best combo   ×' + result.bestCombo, VIEW.width / 2, 488, 18, '#e8d9b8', '600', 'center');
  text(ctx, 'PRESS R TO COOK AGAIN', VIEW.width / 2, 590, 22, '#ffffff', '800', 'center');
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  for (const station of STATION_LIST) {
    if (station.kind === 'pantry') drawPantry(ctx, world, station);
  }
  drawBoard(ctx, world);
  drawGrill(ctx, world);
  drawAssembly(ctx, world);
  drawPass(ctx, world);
  drawTrash(ctx);
  // Highlight the station in reach so the player always knows what E does.
  if (world.nearestStation) {
    const station = world.nearestStation;
    ctx.strokeStyle = 'rgba(255,215,106,0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    roundRect(ctx, station.x - 6, station.y - 6, station.w + 12, station.h + 12, 12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawChef(ctx, world);
  drawHud(ctx, world);
  if (world.screen === SCREEN_PLAY) {
    drawMessages(ctx, world);
    drawHintBar(ctx, world);
  } else if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_WIN) {
    drawResult(ctx, world, true);
  } else if (world.screen === SCREEN_LOSE) {
    drawResult(ctx, world, false);
  }
}
