import { moveX, moveY } from '../../physics';
import type { EnemyDef, EnemyMove } from './types';

/**
 * Rueda de henequén (AGENTS.md §4.5, hacienda): rueda de desfibradora suelta que
 * avanza dando botes, cae por los escalones y rebota en las paredes. Sus fibras
 * tensas no se pueden pisar: hay que saltarla o quemarla con fuego.
 */

/** Gravedad propia de la rueda (px/s²). */
const WHEEL_GRAVITY = 2000;
const WHEEL_MAX_FALL = 900;
/** Velocidad del bote al tocar el suelo (px/s): ~1 bloque de altura. */
export const WHEEL_HOP_SPEED = 420;
/** Velocidad de rodado (px/s). */
export const WHEEL_SPEED = 130;

const rollAndBounce: EnemyMove = (e, world, dt) => {
  e.vy = Math.min(e.vy + WHEEL_GRAVITY * dt, WHEEL_MAX_FALL);
  if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
  moveY(e, e.vy * dt, world.solidAt);
  // Al tocar el suelo rebota: así baja las escaleras dando tumbos.
  if (e.onGround) e.vy = -WHEEL_HOP_SPEED;
};

export const WHEEL: EnemyDef = {
  id: 'wheel',
  w: 36,
  h: 36,
  stompable: false,
  flying: false,
  speed: WHEEL_SPEED,
  score: 300,
  move: rollAndBounce,
};
