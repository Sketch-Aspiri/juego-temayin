import { ROWS, T } from '../constants';
import { overlap } from '../physics';
import type { Body, Rect } from '../types';
import type { World } from '../World';
import { makeParticle } from './particles';

/**
 * Plataformas de escombro que se derrumban (op `['crumble', x, y, largo]`).
 *
 * Cada tramo vive en la cuadrícula como bloques sólidos `CRUMBLE_TILE`, así la
 * física y las pruebas de coherencia los tratan como cualquier plataforma. Al
 * pisarlos tiemblan `CRUMBLE_SHAKE_TIME`; luego se vacían de la cuadrícula y caen
 * (solo visual) y, pasados `CRUMBLE_RESPAWN_TIME`, reaparecen si nadie ocupa su sitio.
 * Visualmente son relleno y estuco roto, nunca estelas ni glifos (AGENTS.md §9).
 */

/** Carácter de bloque del escombro (sólido, ver `tiles.ts`). */
export const CRUMBLE_TILE = 'D';
/** Segundos que tiembla antes de caer: aviso para el jugador. */
export const CRUMBLE_SHAKE_TIME = 0.55;
/** Segundos desde que cae hasta que reaparece. */
export const CRUMBLE_RESPAWN_TIME = 4;
const CRUMBLE_FALL_GRAVITY = 1800;
/** Tolerancia (px) para considerar que los pies del jugador descansan sobre el tramo. */
const FEET_EPSILON = 1;
const DUST_PER_TILE = 2;
const DUST_SPEED = 90;

/** Tramo declarado en el nivel: `len` bloques desde la columna `x` en la fila `y`. */
export interface CrumbleSpan {
  x: number;
  y: number;
  len: number;
}

export type CrumbleState = 'solid' | 'shaking' | 'falling';

export interface Crumble extends CrumbleSpan {
  state: CrumbleState;
  /** Segundos restantes del estado actual (temblor o espera para reaparecer). */
  timer: number;
  /** Desplazamiento vertical (px) de los bloques que caen; solo para el dibujo. */
  fallY: number;
  fallVy: number;
}

export const createCrumbles = (spans: readonly CrumbleSpan[]): Crumble[] =>
  spans.map((s) => ({ ...s, state: 'solid', timer: 0, fallY: 0, fallVy: 0 }));

/** Rectángulo en píxeles que ocupa el tramo. */
export const crumbleRect = (c: CrumbleSpan): Rect => ({ x: c.x * T, y: c.y * T, w: c.len * T, h: T });

/** El cuerpo está apoyado justo encima del tramo. */
export function standsOn(b: Body, c: CrumbleSpan): boolean {
  const r = crumbleRect(c);
  return b.onGround && Math.abs(b.y + b.h - r.y) <= FEET_EPSILON && b.x + b.w > r.x && b.x < r.x + r.w;
}

function setTiles(world: World, c: CrumbleSpan, tile: string): void {
  if (c.y < 0 || c.y >= ROWS) return;
  for (let i = 0; i < c.len; i++) {
    const tx = c.x + i;
    if (tx >= 0 && tx < world.width) world.grid[c.y][tx] = tile;
  }
}

function collapse(world: World, c: Crumble): void {
  setTiles(world, c, ' ');
  c.state = 'falling';
  c.timer = CRUMBLE_RESPAWN_TIME;
  c.fallY = 0;
  c.fallVy = 0;
  world.audio.play('brk');
  for (let i = 0; i < c.len * DUST_PER_TILE; i++) {
    const x = c.x * T + (i + 0.5) * (T / DUST_PER_TILE);
    world.particles.push(makeParticle('dust', x, (c.y + 1) * T, { vx: (Math.random() - 0.5) * DUST_SPEED, vy: DUST_SPEED / 2 }));
  }
}

/** Nadie (jugador ni enemigo vivo) ocupa el hueco: puede reaparecer sin atrapar a nadie. */
function isClear(world: World, c: Crumble): boolean {
  const r = crumbleRect(c);
  if (overlap(world.player, r)) return false;
  return !world.enemies.some((e) => e.alive && !e.dead && overlap(e, r));
}

function step(world: World, c: Crumble, dt: number): void {
  switch (c.state) {
    case 'solid':
      if (standsOn(world.player, c)) {
        c.state = 'shaking';
        c.timer = CRUMBLE_SHAKE_TIME;
      }
      return;
    case 'shaking':
      c.timer -= dt;
      if (c.timer <= 0) collapse(world, c);
      return;
    case 'falling':
      c.fallVy += CRUMBLE_FALL_GRAVITY * dt;
      c.fallY += c.fallVy * dt;
      c.timer -= dt;
      if (c.timer <= 0 && isClear(world, c)) {
        setTiles(world, c, CRUMBLE_TILE);
        c.state = 'solid';
        c.fallY = 0;
        c.fallVy = 0;
      }
  }
}

/** Avanza todos los tramos de escombro; se llama tras mover al jugador. */
export function updateCrumbles(world: World, dt: number): void {
  for (const c of world.crumbles) step(world, c, dt);
}
