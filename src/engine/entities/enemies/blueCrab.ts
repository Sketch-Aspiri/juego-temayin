import { moveX } from '../../physics';
import type { Enemy } from '../types';
import { fall, setState } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados del cangrejo azul (`Enemy.state`). */
export const CRAB_STATE = { init: 0, walk: 1, clawsUp: 2 } as const;

const WALK_SPEED = 55;
/** Tiempo caminando con las pinzas bajas (pisable). */
export const CLAWS_DOWN_TIME = 1.8;
/** Tiempo con las pinzas en alto (no pisable); camina más lento. */
export const CLAWS_UP_TIME = 1.1;
const CLAWS_UP_SLOWDOWN = 0.35;

/**
 * Cangrejo azul: camina de lado y da la vuelta en las paredes; en ciclo alza las
 * pinzas y frena. Solo se puede pisar con las pinzas bajas.
 */
const moveBlueCrab: EnemyMove = (e, world, dt) => {
  e.timer -= dt;
  if (e.timer <= 0) {
    if (e.state === CRAB_STATE.init) setState(e, CRAB_STATE.walk, CLAWS_DOWN_TIME * (0.5 + (e.t % 1) / 2));
    else if (e.state === CRAB_STATE.walk) setState(e, CRAB_STATE.clawsUp, CLAWS_UP_TIME);
    else setState(e, CRAB_STATE.walk, CLAWS_DOWN_TIME);
  }
  const speed = e.state === CRAB_STATE.clawsUp ? CLAWS_UP_SLOWDOWN : 1;
  if (moveX(e, e.vx * speed * dt, world.solidAt)) e.vx = -e.vx;
  fall(e, world, dt);
};

const canStompCrab = (e: Enemy): boolean => e.state !== CRAB_STATE.clawsUp;

export const BLUE_CRAB: EnemyDef = {
  id: 'blueCrab',
  w: 40,
  h: 26,
  stompable: true,
  flying: false,
  speed: WALK_SPEED,
  score: 250,
  move: moveBlueCrab,
  canStomp: canStompCrab,
};
