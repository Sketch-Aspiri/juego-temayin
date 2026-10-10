import { moveX, moveY } from '../../physics';
import { T } from '../../constants';
import type { World } from '../../World';
import type { Enemy } from '../types';
import type { EnemyMove } from './types';

const GRAVITY = 2000;
const MAX_FALL_SPEED = 900;
const FLY_AMPLITUDE = 28;
const FLY_FREQUENCY = 3;

/** Aplica gravedad y mueve en vertical (apoya al enemigo en el suelo). */
export function fall(e: Enemy, world: World, dt: number): void {
  e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL_SPEED);
  moveY(e, e.vy * dt, world.solidAt);
}

/** Camina con gravedad y da la vuelta al chocar con una pared. */
export const walk: EnemyMove = (e, world, dt) => {
  e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL_SPEED);
  if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
  moveY(e, e.vy * dt, world.solidAt);
};

/** Vuela en horizontal ondulando alrededor de `baseY`, sin gravedad. */
export const fly: EnemyMove = (e, world, dt) => {
  if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
  e.y = e.baseY + Math.sin(e.t * FLY_FREQUENCY) * FLY_AMPLITUDE;
};

/** Distancia horizontal y vertical del centro del enemigo al centro del jugador. */
export function toPlayer(e: Enemy, world: World): { dx: number; dy: number } {
  const p = world.player;
  return { dx: p.x + p.w / 2 - (e.x + e.w / 2), dy: p.y + p.h / 2 - (e.y + e.h / 2) };
}

/** Signo (1 / -1) hacia el jugador; útil para orientar con `vx`. */
export const sideOfPlayer = (e: Enemy, world: World): 1 | -1 => (toPlayer(e, world).dx >= 0 ? 1 : -1);

/** Cambia el estado de la máquina y reinicia su temporizador. */
export function setState(e: Enemy, state: number, timer: number): void {
  e.state = state;
  e.timer = timer;
}

/** Hay suelo justo delante del borde de avance (para no caerse de una cornisa). */
export function groundAhead(e: Enemy, world: World, dir: number): boolean {
  const edgeX = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  return world.solid(Math.floor(edgeX / T), Math.floor((e.y + e.h + 1) / T));
}
