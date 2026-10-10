import { T } from '../../constants';
import { moveX } from '../../physics';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { fall, groundAhead, setState, sideOfPlayer, toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados de la nauyaca (`Enemy.state`). */
export const NAUYACA_STATE = { hidden: 0, rear: 1, lunge: 2, back: 3, coil: 4 } as const;

/** Distancia horizontal a la que detecta al jugador. */
export const NOTICE_RANGE = 3.2 * T;
/** Diferencia de altura máxima para atacar (no ataca a quien pasa por arriba muy alto). */
const NOTICE_HEIGHT = 1.5 * T;
/** Aviso antes de lanzarse: el jugador ve cómo se yergue. */
export const REAR_TIME = 0.35;
const LUNGE_SPEED = 480;
/** Distancia máxima del lance desde su escondite. */
export const LUNGE_DISTANCE = 2.2 * T;
const RETURN_SPEED = 90;
const COIL_TIME = 1.1;
/** Tolerancia para considerar que volvió a su escondite. */
const HOME_EPSILON = 2;

/** Escondite de cada nauyaca (x de aparición): vuelve a él tras cada lance. */
const homes = new WeakMap<Enemy, number>();
const homeOf = (e: Enemy): number => {
  const h = homes.get(e);
  if (h !== undefined) return h;
  homes.set(e, e.x);
  return e.x;
};

function watch(e: Enemy, world: World): void {
  const { dx, dy } = toPlayer(e, world);
  if (Math.abs(dx) < NOTICE_RANGE && Math.abs(dy) < NOTICE_HEIGHT) {
    e.vx = sideOfPlayer(e, world);
    setState(e, NAUYACA_STATE.rear, REAR_TIME);
  }
}

function lunge(e: Enemy, world: World, dt: number, home: number): void {
  const dir = Math.sign(e.vx) || 1;
  const blocked = !groundAhead(e, world, dir) || moveX(e, dir * LUNGE_SPEED * dt, world.solidAt);
  if (blocked || Math.abs(e.x - home) >= LUNGE_DISTANCE) setState(e, NAUYACA_STATE.back, 0);
}

function slideHome(e: Enemy, world: World, dt: number, home: number): void {
  const gap = home - e.x;
  if (Math.abs(gap) <= HOME_EPSILON) {
    e.x = home;
    setState(e, NAUYACA_STATE.coil, COIL_TIME);
    return;
  }
  const step = Math.sign(gap) * Math.min(Math.abs(gap), RETURN_SPEED * dt);
  // Sigue mirando hacia donde atacó mientras se repliega.
  if (moveX(e, step, world.solidAt)) setState(e, NAUYACA_STATE.coil, COIL_TIME);
}

/**
 * Nauyaca: emboscada. Enroscada y casi oculta en la hierba junto a su escondite;
 * si el jugador se acerca a su altura se yergue (aviso), se lanza en corto
 * (LUNGE_DISTANCE, sin caerse de cornisas) y se repliega despacio a su sitio.
 * Nunca persigue. `vx` solo guarda su orientación (±1).
 */
const moveNauyaca: EnemyMove = (e, world, dt) => {
  const home = homeOf(e);
  fall(e, world, dt);
  e.timer -= dt;
  switch (e.state) {
    case NAUYACA_STATE.hidden:
      watch(e, world);
      return;
    case NAUYACA_STATE.rear:
      if (e.timer <= 0) setState(e, NAUYACA_STATE.lunge, 0);
      return;
    case NAUYACA_STATE.lunge:
      lunge(e, world, dt, home);
      return;
    case NAUYACA_STATE.back:
      slideHome(e, world, dt, home);
      return;
    default:
      if (e.timer <= 0) setState(e, NAUYACA_STATE.hidden, 0);
  }
};

/**
 * Pisable solo enroscada (escondida, replegándose o descansando); erguida o en pleno
 * lance tiene los colmillos por delante y pisarla hace daño. El fuego la vence siempre.
 */
const canStompNauyaca = (e: Enemy): boolean => e.state !== NAUYACA_STATE.rear && e.state !== NAUYACA_STATE.lunge;

export const NAUYACA: EnemyDef = {
  id: 'nauyaca',
  w: 40,
  h: 20,
  stompable: true,
  flying: false,
  speed: 1,
  score: 400,
  move: moveNauyaca,
  canStomp: canStompNauyaca,
};
