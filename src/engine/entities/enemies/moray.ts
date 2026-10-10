import { T } from '../../constants';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { setState } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados de la morena (`Enemy.state`). */
export const MORAY_STATE = { hidden: 0, peek: 1, strike: 2, retract: 3 } as const;

/** Lado de la caja de la cabeza (la caja de contacto es solo la cabeza). */
const HEAD = 18;
/**
 * Extensión de la cabeza respecto al centro del bloque de la grieta, en px.
 * Escondida queda en el centro del bloque sólido vecino: el jugador no puede tocarla.
 */
export const HIDDEN_EXT = -T;
/** Asomada: media cabeza fuera de la grieta (aviso). */
export const PEEK_EXT = -T / 2;
/** Alcance máximo de la mordida (bloques fuera de la grieta). */
export const STRIKE_EXT = 1.75 * T;
const PEEK_SPEED = 60;
const STRIKE_SPEED = 420;
const RETRACT_SPEED = 160;
/** Tiempo escondida antes de volver a asomarse. */
export const HIDE_TIME = 1.4;
/** Tiempo asomada antes de morder. */
export const PEEK_TIME = 0.7;
/** Tiempo que mantiene la mordida estirada. */
const STRIKE_HOLD = 0.45;
/** Solo sale si el jugador está a esta distancia de la grieta. */
export const WAKE_RANGE = 5 * T;

/** Grieta de la morena: centro del bloque de agua donde nace y dirección hacia el agua abierta. */
export interface MorayLair {
  readonly ax: number;
  readonly ay: number;
  readonly dx: number;
  readonly dy: number;
  /** Extensión actual de la cabeza (px, ver `HIDDEN_EXT`). */
  ext: number;
}

const lairs = new WeakMap<Enemy, MorayLair>();

/**
 * Dirección de salida: la grieta está en el bloque sólido vecino (izquierda,
 * derecha, abajo o arriba, en ese orden) y la morena sale hacia el lado opuesto.
 */
function exitDirection(world: World, tx: number, ty: number): readonly [number, number] {
  if (world.solid(tx - 1, ty)) return [1, 0];
  if (world.solid(tx + 1, ty)) return [-1, 0];
  if (world.solid(tx, ty + 1)) return [0, -1];
  if (world.solid(tx, ty - 1)) return [0, 1];
  return [-1, 0];
}

function lairOf(e: Enemy, world: World): MorayLair {
  const known = lairs.get(e);
  if (known) return known;
  // `createEnemy` coloca a los nadadores en (tx * T + 2, ty * T).
  const tx = Math.floor((e.x + e.w / 2) / T);
  const ty = Math.floor(e.baseY / T);
  const [dx, dy] = exitDirection(world, tx, ty);
  const lair: MorayLair = { ax: tx * T + T / 2, ay: ty * T + T / 2, dx, dy, ext: HIDDEN_EXT };
  lairs.set(e, lair);
  return lair;
}

/** Grieta y extensión de la morena para dibujarla (`null` si aún no se ha movido). */
export const morayLair = (e: Enemy): MorayLair | null => lairs.get(e) ?? null;

const approach = (v: number, target: number, step: number): number =>
  v < target ? Math.min(target, v + step) : Math.max(target, v - step);

/** El jugador está cerca de la boca de la grieta. */
function playerNear(lair: MorayLair, world: World): boolean {
  const p = world.player;
  return Math.hypot(p.x + p.w / 2 - lair.ax, p.y + p.h / 2 - lair.ay) < WAKE_RANGE;
}

/** Avanza la máquina de estados; devuelve la extensión objetivo y su velocidad. */
function think(e: Enemy, lair: MorayLair, world: World): readonly [number, number] {
  if (e.state === MORAY_STATE.hidden) {
    if (e.timer <= 0 && playerNear(lair, world)) setState(e, MORAY_STATE.peek, PEEK_TIME);
    return [HIDDEN_EXT, RETRACT_SPEED];
  }
  if (e.state === MORAY_STATE.peek) {
    if (e.timer <= 0) setState(e, MORAY_STATE.strike, STRIKE_HOLD);
    return [PEEK_EXT, PEEK_SPEED];
  }
  if (e.state === MORAY_STATE.strike) {
    // El tiempo de mordida cuenta desde que llega al máximo.
    if (lair.ext < STRIKE_EXT) e.timer = STRIKE_HOLD;
    else if (e.timer <= 0) setState(e, MORAY_STATE.retract, 0);
    return [STRIKE_EXT, STRIKE_SPEED];
  }
  if (lair.ext <= HIDDEN_EXT) setState(e, MORAY_STATE.hidden, HIDE_TIME);
  return [HIDDEN_EXT, RETRACT_SPEED];
}

/**
 * Morena: vive en una grieta junto a un bloque sólido (pared o fondo). Escondida
 * es intocable; si el jugador se acerca se asoma (aviso), muerde estirándose casi
 * dos bloques hacia el agua abierta y vuelve a esconderse. No se puede pisar:
 * solo el fuego la vence, y solo cuando está fuera.
 */
const moveMoray: EnemyMove = (e, world, dt) => {
  const lair = lairOf(e, world);
  e.timer -= dt;
  const [target, speed] = think(e, lair, world);
  lair.ext = approach(lair.ext, target, speed * dt);
  e.x = lair.ax + lair.dx * lair.ext - HEAD / 2;
  e.y = lair.ay + lair.dy * lair.ext - HEAD / 2;
  e.vx = 0;
  e.vy = 0;
};

export const MORAY: EnemyDef = {
  id: 'moray',
  w: HEAD,
  h: HEAD,
  stompable: false,
  flying: false,
  swimming: true,
  speed: 0,
  score: 400,
  move: moveMoray,
};
