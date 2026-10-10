import { T } from '../../constants';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { fall, setState, sideOfPlayer, toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados del saraguato (`Enemy.state`). El dibujo elige el cuadro según el estado. */
export const HOWLER_STATE = { rest: 0, howl: 1, windup: 2, throw: 3 } as const;

/** Alcance horizontal a partir del cual empieza a gritar y lanzar. */
export const HOWLER_RANGE = 9 * T;
const HOWL_TIME = 0.7;
const WINDUP_TIME = 0.3;
const THROW_POSE_TIME = 0.35;
/** Pausa entre lanzamientos: deja respirar al jugador. */
const COOLDOWN = 1.8;
/**
 * Gravedad de las púas/proyectiles. Debe coincidir con `updateQuills`
 * (`entities/projectiles.ts`) para que la parábola acierte.
 */
const PROJECTILE_GRAVITY = 900;
/** Velocidad horizontal "de crucero" del fruto: fija el tiempo de vuelo. */
const FRUIT_CRUISE_SPEED = 330;
const MIN_FLIGHT = 0.55;
const MAX_FLIGHT = 1.3;
/** Altura de la mano respecto a la base de la caja. */
const HAND_HEIGHT = 30;

/** Velocidad inicial (vx, vy) para que un proyectil con gravedad recorra (dx, dy). */
export function arcVelocity(dx: number, dy: number): { vx: number; vy: number } {
  const t = Math.min(MAX_FLIGHT, Math.max(MIN_FLIGHT, Math.abs(dx) / FRUIT_CRUISE_SPEED));
  return { vx: dx / t, vy: (dy - 0.5 * PROJECTILE_GRAVITY * t * t) / t };
}

/** Lanza un fruto (reutiliza `world.quills`) hacia la posición actual del jugador. */
function throwFruit(e: Enemy, world: World): void {
  const p = world.player;
  const hx = e.x + e.w / 2 + Math.sign(e.vx) * (e.w / 2);
  const hy = e.y + e.h - HAND_HEIGHT;
  const { vx, vy } = arcVelocity(p.x + p.w / 2 - hx, p.y + p.h / 2 - hy);
  world.quills.push({ kind: 'fruit', x: hx, y: hy, vx, vy, gone: false });
}

/**
 * Mono saraguato: no camina; se queda en su rama (o en el suelo) mirando al jugador.
 * Cuando el jugador entra en alcance: grita → echa el brazo atrás → lanza un fruto
 * en parábola → descansa. Se puede pisar en cualquier estado. `vx` solo indica
 * hacia dónde mira (no se desplaza en horizontal).
 */
const moveHowler: EnemyMove = (e, world, dt) => {
  fall(e, world, dt);
  e.vx = sideOfPlayer(e, world);
  e.timer -= dt;
  if (e.timer > 0) return;
  switch (e.state) {
    case HOWLER_STATE.rest:
      if (Math.abs(toPlayer(e, world).dx) < HOWLER_RANGE) setState(e, HOWLER_STATE.howl, HOWL_TIME);
      break;
    case HOWLER_STATE.howl:
      setState(e, HOWLER_STATE.windup, WINDUP_TIME);
      break;
    case HOWLER_STATE.windup:
      throwFruit(e, world);
      setState(e, HOWLER_STATE.throw, THROW_POSE_TIME);
      break;
    default:
      setState(e, HOWLER_STATE.rest, COOLDOWN);
  }
};

export const HOWLER: EnemyDef = {
  id: 'howler',
  w: 40,
  h: 40,
  stompable: true,
  flying: false,
  speed: 1,
  score: 300,
  move: moveHowler,
};
