import { T } from './constants';
import type { Body, Rect } from './types';

export type SolidFn = (tx: number, ty: number) => boolean;
export type TileHit = readonly [number, number];

export function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Mueve el cuerpo en X y lo recoloca contra el bloque que choque. Devuelve true si chocó. */
export function moveX(e: Body, dx: number, solid: SolidFn): boolean {
  e.x += dx;
  const t0 = Math.floor(e.y / T);
  const t1 = Math.floor((e.y + e.h - 1) / T);
  if (dx > 0) {
    const tx = Math.floor((e.x + e.w - 1) / T);
    for (let ty = t0; ty <= t1; ty++) {
      if (solid(tx, ty)) {
        e.x = tx * T - e.w;
        return true;
      }
    }
  } else if (dx < 0) {
    const tx = Math.floor(e.x / T);
    for (let ty = t0; ty <= t1; ty++) {
      if (solid(tx, ty)) {
        e.x = (tx + 1) * T;
        return true;
      }
    }
  }
  return false;
}

/**
 * Mueve el cuerpo en Y. Al caer sobre un bloque lo apoya (onGround);
 * al subir y golpear un bloque con la cabeza devuelve sus coordenadas.
 */
export function moveY(e: Body, dy: number, solid: SolidFn): TileHit | null {
  e.y += dy;
  const l = Math.floor(e.x / T);
  const r = Math.floor((e.x + e.w - 1) / T);
  e.onGround = false;
  if (dy > 0) {
    const ty = Math.floor((e.y + e.h) / T);
    for (let tx = l; tx <= r; tx++) {
      if (solid(tx, ty) && !solid(tx, ty - 1)) {
        e.y = ty * T - e.h;
        e.vy = 0;
        e.onGround = true;
        return null;
      }
    }
  } else if (dy < 0) {
    const ty = Math.floor(e.y / T);
    const cx = Math.floor((e.x + e.w / 2) / T);
    // El bloque central tiene prioridad al golpear con la cabeza.
    const order = [cx, ...[l, r].filter((t) => t !== cx)];
    for (const tx of order) {
      if (tx >= l && tx <= r && solid(tx, ty)) {
        e.y = (ty + 1) * T;
        e.vy = 0;
        return [tx, ty];
      }
    }
  }
  return null;
}
