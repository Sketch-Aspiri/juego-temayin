import { GROUND, T, VW } from '../constants';
import { STONE_HEIGHT, STONE_WRONG_TIME, type Riddle, type Stone } from '../entities/riddles';
import type { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawTerm, NUMERAL_FONT, termSize, type Size } from './numerals';

const PANEL_PAD = 14;
const PANEL_RADIUS = 10;
const PANEL_LINE = 3;
const TERM_GAP = 10;
const LEGEND = 'punto = 1 · raya = 5 · concha = 0';
const LEGEND_FONT = `15px ${NUMERAL_FONT}`;
const LEGEND_H = 26;
const LEGEND_BASELINE = 8;
const STELA_SCALE = 1.1;
const STONE_SCALE = 1.05;
const PLAQUE_PAD = 8;
const PLAQUE_MIN_W = T - 6;
const PLAQUE_RADIUS = 8;
const PLAQUE_LINE = 2.5;
const PEDESTAL_H = 16;
const PEDESTAL_INSET = 2;
const PEDESTAL_RADIUS = 5;
const PEDESTAL_LINE = 2;
const SHAKE_PX = 4;
const SHAKE_RATE = 1 / 25;
const INACTIVE_ALPHA = 0.55;
const GATE_LINE = 3;
const GATE_INSET = 2;
const GATE_SEAL_Y = 0.45;
const GATE_SEAL_R = 11;
const SEAL_PULSE_RATE = 1 / 400;
const SEAL_MIN_ALPHA = 0.6;
const SEAL_PULSE = 0.4;

const COLORS = {
  stela: '#f3e6c4', stelaSolved: '#cfe6d0', stelaLine: '#8a5a1c', legend: '#6b4a1c',
  pedestal: '#7b8f86', pedestalLine: '#3d5148', plaqueWrong: '#e9c4b8', plaqueWrongLine: '#a23a2a',
  gate: 'rgba(26,128,102,0.82)', gateLine: '#c4f2d6', seal: '#fff1c8',
} as const;

interface StelaLayout {
  readonly sizes: readonly Size[];
  readonly content: number;
  readonly w: number;
  readonly h: number;
  readonly glyphH: number;
}

/** Medidas por estela y por piedra: se calculan al dibujarlas por primera vez y no cambian después. */
const stelaLayouts = new WeakMap<Riddle, StelaLayout>();
const stoneSizes = new WeakMap<Stone, Size>();

let measureCtx: Ctx | null = null;
function measure(text: string, font: string): number {
  if (!measureCtx) return 0;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

function stelaLayout(c: Ctx, riddle: Riddle): StelaLayout {
  const cached = stelaLayouts.get(riddle);
  if (cached) return cached;
  measureCtx = c;
  const sizes = riddle.terms.map(t => termSize(t, STELA_SCALE, measure));
  const content = sizes.reduce((sum, s) => sum + s.w, 0) + TERM_GAP * (sizes.length - 1);
  const glyphH = sizes.reduce((tallest, s) => Math.max(tallest, s.h), 0);
  c.font = LEGEND_FONT;
  const w = Math.max(content, c.measureText(LEGEND).width) + PANEL_PAD * 2;
  const layout = { sizes, content, w, h: glyphH + LEGEND_H + PANEL_PAD * 2, glyphH };
  stelaLayouts.set(riddle, layout);
  return layout;
}

function drawStela(c: Ctx, riddle: Riddle, camX: number, solved: boolean): void {
  const x = riddle.cx - camX;
  const { sizes, content, w, h, glyphH } = stelaLayout(c, riddle);
  if (x < -w || x > VW + w) return;
  const top = riddle.base - h;
  c.save();
  c.fillStyle = solved ? COLORS.stelaSolved : COLORS.stela; c.strokeStyle = COLORS.stelaLine; c.lineWidth = PANEL_LINE;
  c.beginPath(); c.roundRect(x - w / 2, top, w, h, PANEL_RADIUS); c.fill(); c.stroke();
  let cursor = x - content / 2;
  for (let i = 0; i < riddle.terms.length; i++) {
    drawTerm(c, riddle.terms[i], cursor + sizes[i].w / 2, top + PANEL_PAD + glyphH, STELA_SCALE);
    cursor += sizes[i].w + TERM_GAP;
  }
  c.fillStyle = COLORS.legend; c.font = LEGEND_FONT; c.textAlign = 'center';
  c.fillText(LEGEND, x, riddle.base - LEGEND_BASELINE);
  c.restore();
}

function stoneSize(c: Ctx, stone: Stone): Size {
  const cached = stoneSizes.get(stone);
  if (cached) return cached;
  measureCtx = c;
  const size = termSize(stone.term, STONE_SCALE, measure);
  stoneSizes.set(stone, size);
  return size;
}

function drawStone(c: Ctx, stone: Stone, camX: number, state: 'idle' | 'wrong' | 'solved', now: number, left: number): void {
  const x = stone.x + stone.w / 2 - camX;
  if (x < -T || x > VW + T) return;
  const size = stoneSize(c, stone);
  const shake = state === 'wrong' ? Math.sin(now * SHAKE_RATE) * SHAKE_PX * (left / STONE_WRONG_TIME) : 0;
  const bottom = stone.y + STONE_HEIGHT;
  c.save();
  c.globalAlpha = state === 'idle' ? 1 : INACTIVE_ALPHA;
  c.translate(x + shake, 0);
  c.fillStyle = COLORS.pedestal; c.strokeStyle = COLORS.pedestalLine; c.lineWidth = PEDESTAL_LINE;
  c.beginPath(); c.roundRect(-T / 2 + PEDESTAL_INSET, bottom - PEDESTAL_H, T - 2 * PEDESTAL_INSET, PEDESTAL_H, PEDESTAL_RADIUS);
  c.fill(); c.stroke();
  const plaqueW = Math.max(size.w + PLAQUE_PAD * 2, PLAQUE_MIN_W);
  const plaqueH = size.h + PLAQUE_PAD * 2;
  const plaqueTop = bottom - PEDESTAL_H - plaqueH;
  c.fillStyle = state === 'wrong' ? COLORS.plaqueWrong : COLORS.stela;
  c.strokeStyle = state === 'idle' ? COLORS.stelaLine : COLORS.plaqueWrongLine; c.lineWidth = PLAQUE_LINE;
  c.beginPath(); c.roundRect(-plaqueW / 2, plaqueTop, plaqueW, plaqueH, PLAQUE_RADIUS); c.fill(); c.stroke();
  drawTerm(c, stone.term, 0, plaqueTop + plaqueH - PLAQUE_PAD, STONE_SCALE);
  c.restore();
}

function drawGate(c: Ctx, x: number, now: number): void {
  c.save();
  c.fillStyle = COLORS.gate; c.fillRect(x, 0, T, GROUND * T);
  c.strokeStyle = COLORS.gateLine; c.lineWidth = GATE_LINE;
  c.strokeRect(x + GATE_INSET, GATE_INSET, T - 2 * GATE_INSET, GROUND * T - 2 * GATE_INSET);
  // El sello respira con la opacidad global, sin armar un color nuevo en cada fotograma.
  c.globalAlpha = SEAL_MIN_ALPHA + SEAL_PULSE * Math.sin(now * SEAL_PULSE_RATE);
  c.fillStyle = COLORS.seal;
  c.beginPath(); c.arc(x + T / 2, GROUND * T * GATE_SEAL_Y, GATE_SEAL_R, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** Estelas: van detrás del jugador y los enemigos, que las cruzan sin quedar tapados. */
export function drawRiddleStelae(c: Ctx, world: World): void {
  const { riddles } = world.level;
  for (let i = 0; i < riddles.length; i++) drawStela(c, riddles[i], world.camX, world.riddlesSolved.includes(riddles[i].id));
}

/** Piedras de respuesta y puertas de jade aún cerradas. */
export function drawRiddles(c: Ctx, world: World, now: number): void {
  const { stones, gates } = world.level;
  for (let index = 0; index < stones.length; index++) {
    const left = world.stoneCooldown.get(index) ?? 0;
    const solved = world.riddlesSolved.includes(stones[index].riddleId);
    drawStone(c, stones[index], world.camX, solved ? 'solved' : left > 0 ? 'wrong' : 'idle', now, left);
  }
  for (const gate of gates) {
    const x = gate.x * T - world.camX;
    if (!world.riddlesSolved.includes(gate.riddleId) && x > -T && x < VW) drawGate(c, x, now);
  }
}
