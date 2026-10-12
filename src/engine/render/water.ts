import { STROKE_FX_TIME, T, TAU, VW } from '../constants';
import { headUnderwater } from '../entities/swim';
import type { Item, Player } from '../entities/types';
import { bubbleStream, type CurrentZone } from '../level/zones';
import type { World } from '../World';
import { bakedFrame, type Frame } from './artCache';
import type { Ctx } from './drawUtils';
import { objectSprite } from './props';
import type { WaterStyle } from './themes';
import { WaterSurfaceRenderer } from './waterSurface';

/**
 * Dibujo de las zonas de agua (AGENTS.md §5.1/§5.2): cuerpo translúcido con
 * superficie animada, corrientes, respiraderos de burbujas y efectos del nado.
 * Todo es visual y sin estado: las animaciones dependen solo del tiempo.
 */

const DEFAULT_WATER: WaterStyle = { fill: '#1aa7c9', foam: '#7fe6f0' };
const waterSurface = new WaterSurfaceRenderer();

// Atlas de mecánicas (3×3): racimo de burbujas respirables, medido por caja de alfa.
const MECHANICS_FILE = 'mecanicas/mecanicas.webp';
const BUBBLES_FRAME: Frame = [1138, 426, 266, 238];
const VENT_ART_H = 34;
// Atlas de efectos (4×3, celdas de 362 px): fila 2 = brazada bajo el agua.
const EFFECTS_FILE = 'mecanicas/efectos.webp';
const FX_CELL = 362;
const STROKE_FRAMES: readonly Frame[] = [0, 1, 2, 3].map((i) => [i * FX_CELL, FX_CELL, FX_CELL, FX_CELL] as const);
const STROKE_FX_H = 76;

const STREAM_BUBBLES = 6;
const BUBBLE_RISE = 70;
const STREAK_SPACING = 80;
const STREAK_LEN = 18;
const BREATH_CYCLE = 1.2;
const BREATH_RISE = 45;
const SNORKEL_H = 34;

/** Estelas que fluyen en la dirección de la corriente, recortadas a su rectángulo. */
function drawCurrent(c: Ctx, z: CurrentZone, camX: number, t: number): void {
  const x = z.x0 * T - camX;
  const y = z.y0 * T;
  const w = (z.x1 - z.x0 + 1) * T;
  const h = (z.y1 - z.y0 + 1) * T;
  const speed = Math.hypot(z.vx, z.vy);
  if (speed === 0 || x + w < 0 || x > VW) return;
  const dx = z.vx / speed;
  const dy = z.vy / speed;
  const shift = t * speed * T;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = 'rgba(255,255,255,.35)';
  c.lineWidth = 2;
  c.beginPath();
  for (let gx = 0; gx < w; gx += STREAK_SPACING / 2) {
    for (let gy = 0; gy < h; gy += STREAK_SPACING / 2) {
      const stagger = ((gx + gy) / (STREAK_SPACING / 2)) % 2 ? STREAK_SPACING / 4 : 0;
      const px = x + ((((gx + stagger + dx * shift) % w) + w) % w);
      const py = y + ((((gy + dy * shift) % h) + h) % h);
      c.moveTo(px, py);
      c.lineTo(px - dx * STREAK_LEN, py - dy * STREAK_LEN);
    }
  }
  c.stroke();
  c.restore();
}

function bubble(c: Ctx, x: number, y: number, r: number): void {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.stroke();
}

function drawVents(c: Ctx, world: World, t: number): void {
  const art = bakedFrame(MECHANICS_FILE, BUBBLES_FRAME, VENT_ART_H / BUBBLES_FRAME[3]);
  c.strokeStyle = 'rgba(220,250,255,.85)';
  c.lineWidth = 1.5;
  for (const v of world.level.bubbles) {
    const s = bubbleStream(v, world.level.water);
    const cx = s.x + s.w / 2 - world.camX;
    if (cx < -T || cx > VW + T) continue;
    for (let k = 0; k < STREAM_BUBBLES; k++) {
      const rise = (t * BUBBLE_RISE + (k * s.h) / STREAM_BUBBLES) % s.h;
      bubble(c, cx + Math.sin(t * 3 + k) * 5, s.y + s.h - rise, 3 + (k % 3) * 1.5);
    }
    if (art) c.drawImage(art, Math.round(cx - art.width / 2), Math.round(s.y + s.h - art.height));
  }
}

/** Burbujas que suelta el jugador al bucear y salpicadura de la brazada. */
function drawSwimmer(c: Ctx, world: World, p: Player, t: number): void {
  const cx = p.x + p.w / 2 - world.camX;
  if (world.phase === 'play' && headUnderwater(world.level.water, p)) {
    c.strokeStyle = 'rgba(230,252,255,.8)';
    c.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      const age = (t + (k * BREATH_CYCLE) / 3) % BREATH_CYCLE;
      bubble(c, cx + p.face * 12 + Math.sin(age * 6) * 3, p.y + 10 - age * BREATH_RISE, 2 + k);
    }
  }
  if (!p.swimming || p.strokeT <= 0) return;
  const idx = Math.min(3, Math.floor((1 - p.strokeT / STROKE_FX_TIME) * 4));
  const fx = bakedFrame(EFFECTS_FILE, STROKE_FRAMES[idx], STROKE_FX_H / FX_CELL);
  if (fx) c.drawImage(fx, Math.round(cx - fx.width / 2), Math.round(p.y + p.h - fx.height / 2));
}

/** Agua de las zonas `water` (encima de las entidades: así se ven sumergidas). */
export function drawWaterLayer(c: Ctx, world: World, style: WaterStyle | undefined, now: number): void {
  const t = now / 1000;
  const zones = world.level.water;
  if (!zones.length && !world.level.bubbles.length) return;
  waterSurface.draw(c, zones, style ?? DEFAULT_WATER, world.camX, t, world.grid);
  for (const z of world.level.currents) drawCurrent(c, z, world.camX, t);
  drawVents(c, world, t);
  drawSwimmer(c, world, world.player, t);
}

/** Snorkel que sale de un bloque `S`; devuelve false si no es un snorkel. */
export function drawSnorkelItem(c: Ctx, it: Item, camX: number, now: number): boolean {
  if (it.kind !== 'snorkel') return false;
  const x = it.x + it.w / 2 - camX;
  const y = it.y + it.h / 2 + Math.sin(now / 150) * 1.5;
  const img = objectSprite('snorkel', SNORKEL_H);
  if (img) {
    c.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
    return true;
  }
  // Respaldo procedural: visor amarillo con tubo.
  c.fillStyle = '#ffd23f';
  c.fillRect(x - 12, y - 6, 24, 12);
  c.fillStyle = '#7fe6f0';
  c.fillRect(x - 9, y - 4, 18, 8);
  c.fillStyle = '#ff7a1a';
  c.fillRect(x + 10, y - 18, 4, 16);
  return true;
}
