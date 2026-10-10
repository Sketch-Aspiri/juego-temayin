import { ROWS, T } from '../constants';
import type { Rect } from '../types';

/**
 * Zonas del nivel que no son bloques: agua navegable, corrientes y burbujas.
 * Las produce `buildLevel` a partir de las ops `water`, `current` y `bubbles`; las consumen
 * la física de nado (`entities/swim.ts`) y el `Renderer`. Coordenadas en bloques.
 */

/** Agua desde la fila `surface` hasta el fondo, en las columnas x0..x1 (inclusive). */
export interface WaterZone {
  readonly x0: number;
  readonly x1: number;
  readonly surface: number;
}

/** Corriente en el rectángulo x0..x1 × y0..y1 (inclusive); velocidad en bloques/s. */
export interface CurrentZone {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly vx: number;
  readonly vy: number;
}

/** Zona de agua que contiene el punto (px, py) en píxeles, o `null`. */
export function waterAt(zones: readonly WaterZone[], px: number, py: number): WaterZone | null {
  const tx = Math.floor(px / T);
  for (const z of zones) {
    if (tx >= z.x0 && tx <= z.x1 && py >= z.surface * T) return z;
  }
  return null;
}

/** Corriente que contiene el punto (px, py) en píxeles, o `null`. */
export function currentAt(zones: readonly CurrentZone[], px: number, py: number): CurrentZone | null {
  const tx = Math.floor(px / T);
  const ty = Math.floor(py / T);
  for (const z of zones) {
    if (tx >= z.x0 && tx <= z.x1 && ty >= z.y0 && ty <= z.y1) return z;
  }
  return null;
}

/** Respiradero de burbujas en el bloque (x, y). */
export interface BubbleVent {
  readonly x: number;
  readonly y: number;
}

/** Ancho (px) de la columna de burbujas que recarga oxígeno. */
const BUBBLE_STREAM_W = 28;

/** Zona de agua que cubre la columna `tx` (sin mirar la profundidad), o `null`. */
export function waterColumn(zones: readonly WaterZone[], tx: number): WaterZone | null {
  for (const z of zones) if (tx >= z.x0 && tx <= z.x1) return z;
  return null;
}

/**
 * Columna de burbujas de un respiradero (px): sube desde el bloque del respiradero
 * hasta la superficie del agua que lo contiene (o hasta arriba si no hay agua).
 */
export function bubbleStream(vent: BubbleVent, zones: readonly WaterZone[]): Rect {
  const z = waterColumn(zones, vent.x);
  const top = z ? Math.min(z.surface, vent.y) * T : 0;
  const bottom = Math.min(vent.y + 1, ROWS) * T;
  return { x: vent.x * T + (T - BUBBLE_STREAM_W) / 2, y: top, w: BUBBLE_STREAM_W, h: bottom - top };
}
