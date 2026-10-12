import { T, TAU, VW } from '../constants';
import type { SlowZone } from '../level/slowZones';
import { hash, type Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';

/**
 * Dibujo de las zonas que frenan (AGENTS.md §5.5): resina de chicle (ámbar brillante
 * que gotea) y sargazo (marañas pardas con vesículas doradas). Usa el atlas de
 * mecánicas, con respaldo procedural; solo pinta columnas visibles, sin mutarlas.
 */

const RESIN_H = 11;
const RESIN_FILL = '#c98a2b';
const RESIN_DARK = '#7a4a12';
const RESIN_SHINE = 'rgba(255, 236, 170, 0.55)';
const DRIP_CHANCE = 0.45;
const DRIP_LEN = 7;
const DRIP_SPEED = 0.8;

const SARGASSUM_H = 14;
const SARGASSUM_FILL = '#7a5f22';
const SARGASSUM_DARK = '#4d3c14';
const SARGASSUM_FLOAT = '#c9a23a';
const STRANDS_PER_TILE = 4;
const FLOATS_PER_TILE = 3;
const SWAY_SPEED = 1.6;
const SWAY_AMP = 2;

/** Columnas visibles de una zona (o null si está fuera de cámara). */
function visibleRange(z: SlowZone, camX: number): readonly [number, number] | null {
  const a = Math.max(z.x0, Math.floor(camX / T));
  const b = Math.min(z.x1, Math.floor((camX + VW) / T));
  return a <= b ? [a, b] : null;
}

/** Resina: lámina ámbar con borde ondulado, brillo que se desliza y gotas sobre el suelo. */
function drawResin(c: Ctx, z: SlowZone, camX: number, t: number): void {
  const range = visibleRange(z, camX);
  if (!range) return;
  const base = (z.y + 1) * T;
  const left = range[0] * T - camX;
  const width = (range[1] - range[0] + 1) * T;
  c.fillStyle = RESIN_DARK;
  c.fillRect(left, base - RESIN_H - 1, width, RESIN_H + 3);
  c.fillStyle = RESIN_FILL;
  c.beginPath();
  c.moveTo(left, base);
  for (let tx = range[0]; tx <= range[1] + 1; tx++) {
    c.lineTo(tx * T - camX, base - RESIN_H + hash(tx) * 3);
  }
  c.lineTo(left + width, base);
  c.fill();
  c.fillStyle = RESIN_SHINE;
  for (let tx = range[0]; tx <= range[1]; tx++) {
    const sx = tx * T - camX;
    const glint = ((t * 0.3 + hash(tx + 7)) % 1) * T;
    c.fillRect(sx + glint, base - RESIN_H + 3, 8, 2);
    if (hash(tx + 3) < DRIP_CHANCE) {
      const k = (t * DRIP_SPEED + hash(tx)) % 1;
      c.fillStyle = RESIN_FILL;
      c.beginPath();
      c.ellipse(sx + T * hash(tx + 11), base + 2 + k * DRIP_LEN, 2.2, 2 + k * 2, 0, 0, TAU);
      c.fill();
      c.fillStyle = RESIN_SHINE;
    }
  }
}

/** Sargazo: maraña de tallos que se mecen, con vesículas de aire doradas. */
function drawSargassum(c: Ctx, z: SlowZone, camX: number, t: number): void {
  const range = visibleRange(z, camX);
  if (!range) return;
  const base = (z.y + 1) * T;
  c.fillStyle = SARGASSUM_DARK;
  c.fillRect(range[0] * T - camX, base - 5, (range[1] - range[0] + 1) * T, 5);
  c.lineCap = 'round';
  c.lineWidth = 3;
  for (let tx = range[0]; tx <= range[1]; tx++) {
    const sx = tx * T - camX;
    for (let i = 0; i < STRANDS_PER_TILE; i++) {
      const x = sx + (i + hash(tx * 4 + i)) * (T / STRANDS_PER_TILE);
      const sway = Math.sin(t * SWAY_SPEED + tx + i) * SWAY_AMP;
      c.strokeStyle = i % 2 ? SARGASSUM_FILL : SARGASSUM_DARK;
      c.beginPath();
      c.moveTo(x - 6, base - 2);
      c.quadraticCurveTo(x + sway, base - SARGASSUM_H - 2, x + 7, base - 3);
      c.stroke();
    }
    c.fillStyle = SARGASSUM_FLOAT;
    for (let i = 0; i < FLOATS_PER_TILE; i++) {
      const x = sx + hash(tx * 3 + i + 50) * T;
      const y = base - 4 - hash(tx * 3 + i + 90) * (SARGASSUM_H - 6);
      c.beginPath();
      c.arc(x, y, 2.4, 0, TAU);
      c.fill();
    }
  }
}

/** Dibuja todas las zonas que frenan visibles en pantalla. */
export function drawSlowZones(c: Ctx, zones: readonly SlowZone[], camX: number, now: number): void {
  if (zones.length === 0) return;
  const t = now / 1000;
  c.save();
  for (const z of zones) {
    if (drawPaintedZone(c, z, camX, t)) continue;
    if (z.kind === 'resin') drawResin(c, z, camX, t);
    else drawSargassum(c, z, camX, t);
  }
  c.restore();
}

/** Repite piezas cortas: una zona larga no estira una única ilustración. */
function drawPaintedZone(c: Ctx, z: SlowZone, camX: number, t: number): boolean {
  const range = visibleRange(z, camX);
  if (!range) return true;
  const height = z.kind === 'resin' ? RESIN_H + 3 : SARGASSUM_H + 5;
  for (let tx = range[0]; tx <= range[1]; tx++) {
    const sway = z.kind === 'resin' ? 0 : Math.sin(t * SWAY_SPEED + tx) * SWAY_AMP;
    if (!drawGameplaySprite(c, z.kind, tx * T - camX, (z.y + 1) * T, T, height + sway)) return false;
  }
  return true;
}
