import { T, TAU, VH, VW } from '../constants';
import type { WaterZone } from '../level/zones';
import { makeCanvas } from './artCache';
import type { Ctx } from './drawUtils';
import type { WaterStyle } from './themes';
import { isSolidTile } from '../tiles';

const WATER_ALPHA = 0.32;
const SHORE_BLEND = 32;
const DEPTH_BLEND = 48;
const FOAM_ALPHA = 0.5;
const FOAM_WIDTH = 1.5;
const REFLECTION_ALPHA = 0.1;
const REFLECTION_DEPTH = 16;
const WAVE_AMP = 2;
const WAVE_LEN = 64;
const WAVE_SPEED = 1.8;
const WAVE_STEP = 8;

interface WaterSpan extends WaterZone {
  readonly fadeLeft: boolean;
  readonly fadeRight: boolean;
}

/** Unión visual: los solapes usan la superficie más alta, sin oscurecer dos veces el agua. */
export function waterRenderSpans(zones: readonly WaterZone[]): readonly WaterSpan[] {
  const edges = [...new Set(zones.flatMap(z => [z.x0, z.x1 + 1]))].sort((a, b) => a - b);
  const spans: WaterZone[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const x0 = edges[i], x1 = edges[i + 1] - 1;
    const covering = zones.filter(z => z.x0 <= x0 && z.x1 >= x1);
    if (!covering.length) continue;
    const surface = Math.min(...covering.map(z => z.surface));
    const previous = spans.at(-1);
    if (previous && previous.x1 + 1 === x0 && previous.surface === surface) {
      spans[spans.length - 1] = { ...previous, x1 };
    } else spans.push({ x0, x1, surface });
  }
  return spans.map((span, i) => ({ ...span,
    fadeLeft: spans[i - 1]?.x1 !== span.x0 - 1,
    fadeRight: spans[i + 1]?.x0 !== span.x1 + 1,
  }));
}

/** Degradado lateral dentro del agua; nunca extiende la zona nadable hacia tierra. */
function shoreMask(c: Ctx, span: WaterSpan, x0: number, x1: number): void {
  const width = x1 - x0;
  const blend = Math.min(SHORE_BLEND, width / 2) / width;
  const mask = c.createLinearGradient(x0, 0, x1, 0);
  mask.addColorStop(0, span.fadeLeft ? 'transparent' : '#fff');
  mask.addColorStop(blend, '#fff');
  mask.addColorStop(1 - blend, '#fff');
  mask.addColorStop(1, span.fadeRight ? 'transparent' : '#fff');
  c.save();
  c.beginPath(); c.rect(x0, 0, width, VH); c.clip();
  c.globalCompositeOperation = 'destination-in';
  c.fillStyle = mask; c.fillRect(x0, 0, width, VH);
  c.restore();
}

/** Espuma fina y reflejo difuso; la fase de la onda depende del mundo, no de la cámara. */
function drawSurface(c: Ctx, x0: number, x1: number, top: number, style: WaterStyle, camX: number, t: number): void {
  const reflection = c.createLinearGradient(0, top, 0, top + REFLECTION_DEPTH);
  reflection.addColorStop(0, style.foam); reflection.addColorStop(1, 'transparent');
  c.globalAlpha = REFLECTION_ALPHA;
  c.fillStyle = reflection; c.fillRect(x0, top, x1 - x0, REFLECTION_DEPTH);
  c.globalAlpha = FOAM_ALPHA; c.strokeStyle = style.foam; c.lineWidth = FOAM_WIDTH;
  c.beginPath();
  const wave = (x: number) => top + Math.sin((x + camX) / WAVE_LEN * TAU + t * WAVE_SPEED) * WAVE_AMP;
  const start = Math.max(0, x0), end = Math.min(VW, x1);
  c.moveTo(start, wave(start));
  for (let x = start + WAVE_STEP; x < end; x += WAVE_STEP) c.lineTo(x, wave(x));
  c.lineTo(end, wave(end)); c.stroke();
  c.globalAlpha = 1;
}

function drawSpan(c: Ctx, span: WaterSpan, style: WaterStyle, camX: number, t: number): void {
  const x0 = span.x0 * T - camX, x1 = (span.x1 + 1) * T - camX;
  if (x1 <= 0 || x0 >= VW) return;
  const top = span.surface * T;
  const depth = c.createLinearGradient(0, top - WAVE_AMP, 0, top + DEPTH_BLEND);
  depth.addColorStop(0, 'transparent'); depth.addColorStop(1, style.fill);
  c.globalAlpha = WATER_ALPHA;
  c.fillStyle = depth; c.fillRect(x0, top - WAVE_AMP, x1 - x0, VH - top + WAVE_AMP);
  drawSurface(c, x0, x1, top, style, camX, t);
  shoreMask(c, span, x0, x1);
}

/** Lienzo reutilizado: la máscara solo afecta al agua, nunca borra terreno ni personajes. */
export class WaterSurfaceRenderer {
  private canvas: HTMLCanvasElement | null = null;

  draw(c: Ctx, zones: readonly WaterZone[], style: WaterStyle, camX: number, t: number, grid: readonly (readonly string[])[] = []): void {
    if (!zones.length || typeof document === 'undefined') return;
    this.canvas ??= makeCanvas(VW, VH);
    const layer = this.canvas.getContext('2d');
    if (!layer) return;
    layer.clearRect(0, 0, VW, VH);
    for (const span of waterRenderSpans(zones)) drawSpan(layer, span, style, camX, t);
    clearSolidTerrain(layer, grid, camX);
    c.drawImage(this.canvas, 0, 0);
  }
}

/** El líquido ocupa huecos libres: no atraviesa roca, arena, muelles ni otros bloques sólidos. */
function clearSolidTerrain(c: Ctx, grid: readonly (readonly string[])[], camX: number): void {
  const start = Math.max(0, Math.floor(camX / T));
  const end = Math.ceil((camX + VW) / T);
  for (let y = 0; y < grid.length; y++) {
    for (let x = start; x < Math.min(end, grid[y].length); x++) {
      if (isSolidTile(grid[y][x])) c.clearRect(Math.round(x * T - camX), y * T, T, T);
    }
  }
}
