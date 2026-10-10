import { moveX } from '../../physics';
import { fall, setState } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados del cangrejo pirata (`Enemy.state`). */
export const PIRATE_CRAB_STATE = { walk: 0, crouch: 1, jump: 2 } as const;

const WALK_SPEED = 70;
/** Tiempo caminando entre saltos. */
export const HOP_INTERVAL = 1.6;
/** Agachado antes de saltar: aviso visible para el jugador. */
export const CROUCH_TIME = 0.3;
/** Velocidad vertical del salto (px/s): ~2 bloques de altura. */
export const HOP_SPEED = 640;
/** En el aire avanza algo más rápido, como un brinco. */
const AIR_BOOST = 1.4;

/**
 * Cangrejo pirata: camina de lado y da la vuelta en las paredes; cada poco se agacha
 * y pega un brinco (cambia la altura a la que hay que pisarlo). Siempre pisable.
 */
const movePirateCrab: EnemyMove = (e, world, dt) => {
  e.timer -= dt;
  if (e.state === PIRATE_CRAB_STATE.walk && e.timer <= 0 && e.onGround) {
    setState(e, PIRATE_CRAB_STATE.crouch, CROUCH_TIME);
  } else if (e.state === PIRATE_CRAB_STATE.crouch && e.timer <= 0) {
    setState(e, PIRATE_CRAB_STATE.jump, 0);
    e.vy = -HOP_SPEED;
  } else if (e.state === PIRATE_CRAB_STATE.jump && e.onGround && e.vy >= 0) {
    // Intervalo con algo de variación (según su reloj propio) para que no salten a la vez.
    setState(e, PIRATE_CRAB_STATE.walk, HOP_INTERVAL * (0.75 + (e.t % 1) / 2));
  }
  const factor = e.state === PIRATE_CRAB_STATE.crouch ? 0 : e.state === PIRATE_CRAB_STATE.jump ? AIR_BOOST : 1;
  if (moveX(e, e.vx * factor * dt, world.solidAt)) e.vx = -e.vx;
  fall(e, world, dt);
};

export const PIRATE_CRAB: EnemyDef = {
  id: 'pirateCrab',
  w: 38,
  h: 28,
  stompable: true,
  flying: false,
  speed: WALK_SPEED,
  score: 300,
  move: movePirateCrab,
};
