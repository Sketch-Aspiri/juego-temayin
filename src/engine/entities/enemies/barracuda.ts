import { T } from '../../constants';
import { waterAt } from '../../level/zones';
import { moveX } from '../../physics';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { setState, toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados de la barracuda (`Enemy.state`). */
export const BARRACUDA_STATE = { patrol: 0, dart: 1, rest: 2 } as const;

const PATROL_SPEED = 90;
export const DART_SPEED = 400;
/** Duración máxima de una embestida. */
const DART_TIME = 0.9;
/** Pausa tras embestir (patrulla más lenta). */
const REST_TIME = 1.2;
const REST_SLOWDOWN = 0.5;
/** Distancia a la que ve al jugador delante de ella. */
export const SIGHT_RANGE = 6 * T;
/** Diferencia de altura máxima para considerarlo "alineado". */
export const ALIGN_TOLERANCE = 0.6 * T;
const BOB_AMPLITUDE = 3;
const BOB_FREQUENCY = 2.5;

/** Franja horizontal [min, max] (x de la caja) en la que patrulla. */
interface Band {
  readonly min: number;
  readonly max: number;
}
const bands = new WeakMap<Enemy, Band>();

/** La franja es la zona de agua donde aparece; sin agua, solo la limitan las paredes. */
function bandOf(e: Enemy, world: World): Band {
  const known = bands.get(e);
  if (known) return known;
  const zone = waterAt(world.level.water, e.x + e.w / 2, e.y + e.h / 2);
  const band = zone ? { min: zone.x0 * T, max: (zone.x1 + 1) * T - e.w } : { min: -Infinity, max: Infinity };
  bands.set(e, band);
  return band;
}

function sees(e: Enemy, world: World): boolean {
  const { dx, dy } = toPlayer(e, world);
  return Math.abs(dy) < ALIGN_TOLERANCE && Math.abs(dx) < SIGHT_RANGE && Math.sign(dx) === Math.sign(e.vx);
}

/** Avanza en horizontal sin salir de la franja; devuelve true si tocó un borde o pared. */
function swim(e: Enemy, world: World, dx: number, band: Band): boolean {
  const hitWall = moveX(e, dx, world.solidAt);
  // Solo cuenta como borde si nadaba hacia fuera (puede nacer algo pasada del borde).
  const outward = (dx > 0 && e.x > band.max) || (dx < 0 && e.x < band.min);
  e.x = Math.min(band.max, Math.max(band.min, e.x));
  return hitWall || outward;
}

/**
 * Barracuda: patrulla en horizontal dentro de su zona de agua (nunca sale de esa
 * franja ni cambia de altura salvo un leve vaivén). Si el jugador queda alineado
 * delante de ella, embiste en línea recta a gran velocidad y luego descansa.
 */
const moveBarracuda: EnemyMove = (e, world, dt) => {
  const band = bandOf(e, world);
  const dir = Math.sign(e.vx) || -1;
  e.y = e.baseY + Math.sin(e.t * BOB_FREQUENCY) * BOB_AMPLITUDE;
  e.timer -= dt;
  if (e.state === BARRACUDA_STATE.patrol && sees(e, world)) setState(e, BARRACUDA_STATE.dart, DART_TIME);
  const factor = e.state === BARRACUDA_STATE.dart ? DART_SPEED / PATROL_SPEED : e.state === BARRACUDA_STATE.rest ? REST_SLOWDOWN : 1;
  const blocked = swim(e, world, dir * PATROL_SPEED * factor * dt, band);
  if (blocked) e.vx = -dir * PATROL_SPEED;
  if (e.state === BARRACUDA_STATE.dart && (blocked || e.timer <= 0)) setState(e, BARRACUDA_STATE.rest, REST_TIME);
  else if (e.state === BARRACUDA_STATE.rest && e.timer <= 0) setState(e, BARRACUDA_STATE.patrol, 0);
};

export const BARRACUDA: EnemyDef = {
  id: 'barracuda',
  w: 48,
  h: 22,
  stompable: true,
  flying: false,
  swimming: true,
  speed: PATROL_SPEED,
  score: 300,
  move: moveBarracuda,
};
