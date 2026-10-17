import { GROUND, T, TAU, VW } from '../constants';
import type { BossId } from '../types';
import type { World } from '../World';
import { drawAtrium } from './arenas/atrium';
import { drawAkumal } from './arenas/akumal';
import { drawShip } from './arenas/ship';
import type { Ctx } from './drawUtils';
import { drawScenerySprite } from './scenerySprites';

const FLOOR = GROUND * T;
const TREE_HEIGHT = 350;
const REED_SPACING = 34;
const FIREFLIES = 18;
const LAIR_WIDTH_RATIO = 0.9;
const MANGROVE_WIDTH = 240;
const CEIBA_WIDTH = 400;
const VINE_WIDTH = 64;
type ArenaDraw = (c: Ctx, width: number, now: number, world: World) => void;

function drawLair(c: Ctx, width: number): void {
  if (drawScenerySprite(c, 'lair', width / 2, FLOOR, width * LAIR_WIDTH_RATIO)) return;
  const rock = c.createLinearGradient(0, FLOOR - 310, 0, FLOOR);
  rock.addColorStop(0, '#6c5260'); rock.addColorStop(1, '#302936');
  c.fillStyle = rock;
  c.beginPath(); c.ellipse(width / 2, FLOOR, width * 0.48, 310, 0, Math.PI, TAU); c.fill();
  const cave = c.createRadialGradient(width / 2, FLOOR, 20, width / 2, FLOOR, width * 0.35);
  cave.addColorStop(0, '#10151f'); cave.addColorStop(1, '#30283a');
  c.fillStyle = cave;
  c.beginPath(); c.ellipse(width / 2, FLOOR, width * 0.29, 220, 0, Math.PI, TAU); c.fill();
  c.strokeStyle = '#6e5260'; c.lineWidth = 8;
  for (const side of [T, width - T]) {
    c.beginPath(); c.moveTo(side, FLOOR); c.lineTo(side + T / 2, FLOOR - 160);
    c.lineTo(side, FLOOR - 220); c.stroke();
  }
  c.fillStyle = '#a37853';
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(width / 2 - 65 + i * 32, FLOOR - 8, 24, 12, i * 0.2, 0, TAU); c.fill();
  }
}

const HERONS: readonly (readonly [number, number])[] = [[0.3, -1], [0.72, 1]];
const HERON_FLIGHT = 2.6;
const LILY_PADS = 7;
const MOSS_STRANDS = 5;
const MOSS_CANOPY_Y = 294;
/** Momento (ms) en que cada pelea despertó al jefe: las garzas alzan el vuelo desde ahí. */
const heronTakeoff = new WeakMap<World, number>();

/** Garza blanca: de pie en el agua, o volando hacia fuera de la arena. */
function drawHeron(c: Ctx, x: number, y: number, dir: number, flying: boolean, now: number): void {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  c.strokeStyle = '#f4f1e6'; c.fillStyle = '#f4f1e6'; c.lineWidth = 3;
  if (flying) {
    const flap = Math.sin(now / 70) * 14;
    c.beginPath(); c.ellipse(0, 0, 16, 6, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-4, 0); c.lineTo(-14, -12 - flap); c.lineTo(6, -2); c.fill();
    c.beginPath(); c.moveTo(14, -2); c.lineTo(26, -6); c.stroke();
    c.strokeStyle = '#2b2b2b'; c.beginPath(); c.moveTo(-14, 2); c.lineTo(-30, 4); c.stroke();
  } else {
    c.beginPath(); c.ellipse(0, -34, 13, 9, -0.3, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(8, -38); c.quadraticCurveTo(16, -56, 6, -62); c.stroke();
    c.beginPath(); c.arc(6, -64, 4, 0, TAU); c.fill();
    c.strokeStyle = '#e8b030'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(9, -64); c.lineTo(22, -62); c.stroke();
    c.strokeStyle = '#2b2b2b';
    c.beginPath(); c.moveTo(-2, -26); c.lineTo(-2, 0); c.moveTo(3, -26); c.lineTo(5, 0); c.stroke();
  }
  c.restore();
}

/** Garzas: esperan en el agua hasta que despierta el jefe y entonces huyen volando. */
function drawHerons(c: Ctx, width: number, now: number, world: World): void {
  const boss = world.boss;
  const awake = !!boss && (boss.lockCamera || boss.hp <= 0);
  if (awake && !heronTakeoff.has(world)) heronTakeoff.set(world, now);
  const since = awake ? (now - (heronTakeoff.get(world) ?? now)) / 1000 : 0;
  if (since > HERON_FLIGHT) return;
  for (const [fx, dir] of HERONS) {
    const x = width * fx + dir * since * 260;
    const y = FLOOR - 30 - since * since * 70;
    drawHeron(c, x, y, dir, awake, now);
  }
}

/** Heno (barba de viejo) colgando de las ramas altas del mangle. */
function drawMoss(c: Ctx, width: number, now: number): void {
  c.strokeStyle = 'rgba(160,178,140,.75)'; c.lineWidth = 2;
  for (const tree of [T * 2, width - T * 2]) {
    for (let i = 0; i < MOSS_STRANDS; i++) {
      const x = tree - 48 + i * 24;
      const y = MOSS_CANOPY_Y + Math.abs(i - 2) * 8;
      const len = 22 + (i * 17) % 30;
      const sway = Math.sin(now / 1500 + i) * 4;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y + len / 2, x + sway * 1.5, y + len);
      c.moveTo(x + sway, y + len / 2); c.lineTo(x + sway - 4, y + len - 3); c.stroke();
    }
  }
}

/** Nenúfares que flotan sobre la superficie real del agua (suben con la crecida). */
function drawLilyPads(c: Ctx, width: number, now: number, world: World, x0: number): void {
  for (let i = 0; i < LILY_PADS; i++) {
    const x = (i + 0.5) * width / LILY_PADS + Math.sin(now / 2100 + i * 1.7) * 10;
    const zone = world.level.water.find((z) => (x0 + x) / T >= z.x0 && (x0 + x) / T <= z.x1 + 1);
    if (!zone) continue;
    const y = zone.surface * T + Math.sin(now / 700 + i) * 1.5;
    c.fillStyle = i % 3 ? '#4f8f3a' : '#5ea548';
    c.beginPath(); c.ellipse(x, y, 16, 5, 0, 0.25, TAU - 0.25); c.lineTo(x, y); c.fill();
    if (i % 3 === 1) {
      c.fillStyle = '#f7d9ec';
      c.beginPath(); c.arc(x + 4, y - 3, 4, 0, TAU); c.fill();
    }
  }
}

/** Nubarrones de la fase 3: el cielo del pantano se cierra sobre la arena. */
function drawStormClouds(c: Ctx, width: number, now: number): void {
  const g = c.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, 'rgba(20,26,44,.75)'); g.addColorStop(0.6, 'rgba(30,40,60,.25)'); g.addColorStop(1, 'rgba(30,40,60,0)');
  c.fillStyle = g; c.fillRect(0, 0, width, FLOOR);
  c.fillStyle = 'rgba(48,56,78,.85)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 157 + now / 40) % (width + 200)) - 100;
    c.beginPath(); c.ellipse(x, 30 + (i % 3) * 18, 90, 34, 0, 0, TAU); c.fill();
  }
}

function drawSwamp(c: Ctx, width: number, now: number, world: World): void {
  const stage = world.boss && world.boss.hp > 0 ? world.boss.stage ?? 1 : 1;
  if (stage >= 3) drawStormClouds(c, width, now);
  c.fillStyle = stage >= 3 ? 'rgba(38,70,66,.8)' : 'rgba(57,100,87,.75)';
  c.beginPath(); c.ellipse(width / 2, FLOOR - 12, width / 2, 95, 0, 0, TAU); c.fill();
  c.strokeStyle = '#65543b'; c.lineWidth = 18;
  for (const x of [T * 2, width - T * 2]) {
    if (drawScenerySprite(c, 'mangrove', x, FLOOR, MANGROVE_WIDTH)) continue;
    c.beginPath(); c.moveTo(x, FLOOR); c.bezierCurveTo(x - 90, FLOOR - 70, x + 60, 300, x, 180); c.stroke();
    c.lineWidth = 6;
    for (const offset of [-55, 55]) {
      c.beginPath(); c.moveTo(x, FLOOR - 100); c.lineTo(x + offset, FLOOR); c.stroke();
    }
    c.lineWidth = 18;
  }
  drawMoss(c, width, now);
  c.strokeStyle = '#9aab60'; c.lineWidth = 3;
  const wind = stage >= 3 ? 4 : 1;
  for (let x = T / 2; x < width; x += REED_SPACING) {
    const h = 22 + (x % 53);
    c.beginPath(); c.moveTo(x, FLOOR); c.quadraticCurveTo(x - 5, FLOOR - h / 2, x + Math.sin(now * wind / 1300 + x) * 5 * wind, FLOOR - h); c.stroke();
  }
  c.strokeStyle = 'rgba(193,231,200,.4)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(width * (i + 1) / 6, FLOOR - 38, 30, 5, 0, 0, TAU); c.stroke();
  }
  drawHerons(c, width, now, world);
  const config = world.def.boss;
  if (config) drawLilyPads(c, width, now, world, config.arena[0] * T);
}

function drawNightClearing(c: Ctx, width: number, now: number): void {
  c.strokeStyle = '#223c40'; c.lineWidth = 28;
  for (const x of [T * 1.5, width - T * 1.5]) {
    c.save(); c.filter = 'brightness(0.55) saturate(0.6)';
    const painted = drawScenerySprite(c, 'ceiba', x, FLOOR, CEIBA_WIDTH);
    if (painted) drawScenerySprite(c, 'vines', x, FLOOR - TREE_HEIGHT, VINE_WIDTH);
    c.restore();
    if (painted) continue;
    c.beginPath(); c.moveTo(x, FLOOR); c.quadraticCurveTo(x - 30, 270, x + 25, FLOOR - TREE_HEIGHT); c.stroke();
    c.lineWidth = 12;
    c.beginPath(); c.moveTo(x, 275); c.lineTo(x + (x < width / 2 ? 110 : -110), 210); c.stroke();
    c.lineWidth = 28;
  }
  c.strokeStyle = '#40636a'; c.lineWidth = 6;
  c.beginPath(); c.ellipse(width / 2, FLOOR, width * 0.38, 48, 0, Math.PI, TAU); c.stroke();
  c.fillStyle = 'rgba(180,255,214,.8)';
  for (let i = 0; i < FIREFLIES; i++) {
    const x = (i + 1) * width / (FIREFLIES + 1) + Math.sin(now / 1600 + i) * 14;
    const y = FLOOR - 40 - (i % 5) * 35 + Math.cos(now / 1100 + i) * 8;
    c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill();
  }
}

/** Decorado propio por jefe, anclado a su arena, detrás de todos los bloques y entidades. */
export const BOSS_ARENA_SCENERY: Readonly<Record<BossId, ArenaDraw>> = {
  puas: drawLair, kaiman: drawSwamp, huayChivo: drawAtrium, huayPek: drawNightClearing,
  sargazo: drawAkumal, lorencillo: drawShip,
};

export function drawBossArena(c: Ctx, world: World, now: number): void {
  const config = world.def.boss;
  if (!config) return;
  const x = config.arena[0] * T - world.camX;
  const width = (config.arena[1] - config.arena[0] + 1) * T;
  if (x > VW || x + width < 0) return;
  c.save(); c.beginPath(); c.rect(x, 0, width, FLOOR); c.clip(); c.translate(x, 0);
  BOSS_ARENA_SCENERY[config.id](c, width, now, world);
  c.restore();
}
