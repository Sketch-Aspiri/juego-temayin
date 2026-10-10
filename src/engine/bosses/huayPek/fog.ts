import { GROUND, T, TAU, VH } from '../../constants';
import type { Ctx } from '../../render/drawUtils';
import { FOG_ALPHA, FOG_AMBIENT, FOG_LIGHT_RADIUS } from './tuning';

/**
 * Niebla propia de la arena del Huay Pek. Sus jirones se dibujan detrás del jugador;
 * `render/lighting.ts` proporciona la oscuridad compartida y el halo de Temayin.
 * El velo local queda como alternativa para vistas sin esa máscara global.
 */

const FOG_RGB = '26,36,58';
const WISP_RGB = '170,200,215';
const WISPS = 7;
const WISP_SPEED = 18;
const WISP_SPAN = 1100;
/** Parte interior del claro de luz que queda totalmente despejada. */
const CLEAR_CORE = 0.35;

/** Opacidad del velo según la densidad de la niebla (0..1). */
export const fogAlpha = (fog: number): number => Math.max(0, Math.min(1, fog)) * FOG_ALPHA;

export interface FogView {
  /** Bordes de la arena en pantalla (px). */
  readonly x0: number;
  readonly x1: number;
  /** Claro de luz alrededor del jugador (pantalla). */
  readonly lightX: number;
  readonly lightY: number;
  readonly fog: number;
  readonly clock: number;
  readonly globalDarkness?: boolean;
}

/** Jirones de niebla a ras de suelo: siempre presentes en el claro de la selva. */
function drawWisps(c: Ctx, v: FogView): void {
  const k = FOG_AMBIENT + v.fog * (1 - FOG_AMBIENT);
  const width = v.x1 - v.x0;
  for (let i = 0; i < WISPS; i++) {
    const drift = (v.clock * WISP_SPEED * (1 + (i % 3) * 0.4) + (i * WISP_SPAN) / WISPS) % WISP_SPAN;
    const x = v.x0 + (drift / WISP_SPAN) * width;
    const y = GROUND * T - 12 - (i % 3) * 22 - v.fog * (i % 4) * 40;
    c.fillStyle = `rgba(${WISP_RGB},${(k * (0.5 + (i % 2) * 0.3)).toFixed(3)})`;
    c.beginPath();
    c.ellipse(x, y, 90 + (i % 3) * 30, 14 + (i % 2) * 6, 0, 0, TAU);
    c.fill();
  }
}

/** Velo de la fase 2 con un claro de `FOG_LIGHT_RADIUS` px alrededor del jugador. */
function drawVeil(c: Ctx, v: FogView): void {
  const a = fogAlpha(v.fog);
  if (a <= 0) return;
  const g = c.createRadialGradient(v.lightX, v.lightY, FOG_LIGHT_RADIUS * CLEAR_CORE, v.lightX, v.lightY, FOG_LIGHT_RADIUS);
  g.addColorStop(0, `rgba(${FOG_RGB},0)`);
  g.addColorStop(1, `rgba(${FOG_RGB},${a.toFixed(3)})`);
  c.fillStyle = g;
  c.fillRect(v.x0, 0, v.x1 - v.x0, VH);
}

export function drawFog(c: Ctx, v: FogView): void {
  c.save();
  c.beginPath();
  c.rect(v.x0, 0, v.x1 - v.x0, VH);
  c.clip();
  if (!v.globalDarkness) drawVeil(c, v);
  drawWisps(c, v);
  c.restore();
}
