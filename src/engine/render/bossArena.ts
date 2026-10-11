import { GROUND, T, TAU, VW } from '../constants';
import type { BossId } from '../types';
import type { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawScenerySprite } from './scenerySprites';

const FLOOR = GROUND * T;
const ARCH_RADIUS = 60;
const TREE_HEIGHT = 350;
const REED_SPACING = 34;
const FIREFLIES = 18;
const LAIR_WIDTH_RATIO = 0.9;
const ARCADE_WIDTH_RATIO = 0.9;
const MANGROVE_WIDTH = 240;
const CEIBA_WIDTH = 400;
const VINE_WIDTH = 64;
type ArenaDraw = (c: Ctx, width: number, now: number) => void;

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

function drawSwamp(c: Ctx, width: number, now: number): void {
  c.fillStyle = 'rgba(57,100,87,.75)';
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
  c.strokeStyle = '#9aab60'; c.lineWidth = 3;
  for (let x = T / 2; x < width; x += REED_SPACING) {
    const h = 22 + (x % 53);
    c.beginPath(); c.moveTo(x, FLOOR); c.quadraticCurveTo(x - 5, FLOOR - h / 2, x + Math.sin(now / 1300 + x) * 5, FLOOR - h); c.stroke();
  }
  c.strokeStyle = 'rgba(193,231,200,.4)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(width * (i + 1) / 6, FLOOR - 38, 30, 5, 0, 0, TAU); c.stroke();
  }
}

function drawAtrium(c: Ctx, width: number): void {
  // El zócalo tapa el margen transparente bajo los vanos y asienta la arcada sobre el pavimento.
  c.fillStyle = '#493c2e';
  c.fillRect(width * (1 - ARCADE_WIDTH_RATIO) / 2, FLOOR - T, width * ARCADE_WIDTH_RATIO, T);
  if (drawScenerySprite(c, 'arcade', width / 2, FLOOR, width * ARCADE_WIDTH_RATIO)) return;
  const top = FLOOR - 240;
  c.fillStyle = '#b78425'; c.fillRect(0, top - 45, width, 45);
  c.fillStyle = '#ffe6a0'; c.fillRect(0, top - 50, width, 8);
  const wall = c.createLinearGradient(0, top, 0, FLOOR);
  wall.addColorStop(0, '#ffe18a'); wall.addColorStop(1, '#dca82c');
  c.fillStyle = wall; c.fillRect(0, top, width, 240);
  for (const fraction of [0.18, 0.5, 0.82]) {
    const x = width * fraction;
    const shade = c.createLinearGradient(x - ARCH_RADIUS, 0, x + ARCH_RADIUS, 0);
    shade.addColorStop(0, '#7d5738'); shade.addColorStop(0.5, '#463e36'); shade.addColorStop(1, '#7d5738');
    c.fillStyle = shade;
    c.beginPath(); c.moveTo(x - ARCH_RADIUS, FLOOR);
    c.lineTo(x - ARCH_RADIUS, top + ARCH_RADIUS);
    c.arc(x, top + ARCH_RADIUS, ARCH_RADIUS, Math.PI, 0);
    c.lineTo(x + ARCH_RADIUS, FLOOR); c.fill();
    c.strokeStyle = '#fff0bb'; c.lineWidth = 10; c.stroke();
    c.fillStyle = '#f7d47d';
    for (const side of [-1, 1]) c.fillRect(x + side * (ARCH_RADIUS + 9) - 8, top + ARCH_RADIUS, 16, FLOOR - top - ARCH_RADIUS);
  }
  c.fillStyle = '#fae7b6'; c.fillRect(0, FLOOR - 14, width, 14);
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
};

export function drawBossArena(c: Ctx, world: World, now: number): void {
  const config = world.def.boss;
  if (!config) return;
  const x = config.arena[0] * T - world.camX;
  const width = (config.arena[1] - config.arena[0] + 1) * T;
  if (x > VW || x + width < 0) return;
  c.save(); c.beginPath(); c.rect(x, 0, width, FLOOR); c.clip(); c.translate(x, 0);
  BOSS_ARENA_SCENERY[config.id](c, width, now);
  c.restore();
}
