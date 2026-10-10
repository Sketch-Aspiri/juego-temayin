import { T } from '../../constants';
import { moveX } from '../../physics';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { fall, setState, sideOfPlayer, toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados de la tarántula (`Enemy.state`). `baseY` guarda dónde se ata el hilo. */
export const TARANTULA_STATE = { init: 0, hang: 1, drop: 2, walk: 3 } as const;

/** Filas por encima del punto de aparición en las que busca un techo del que colgarse. */
export const CEILING_SEARCH = 6;
/** Hilo visible entre el techo y el lomo mientras cuelga. */
const THREAD_SLACK = 22;
/** Medio ancho de la franja bajo la tarántula que dispara la caída. */
export const DROP_TRIGGER = 1.4 * T;
const BOB_AMPLITUDE = 3;
const BOB_FREQUENCY = 2.2;
const WALK_SPEED = 70;

/**
 * Contrato con los niveles: la tarántula se coloca SOBRE EL SUELO (como cualquier
 * terrestre) justo debajo de un saliente o bloques. Al activarse busca el primer
 * bloque sólido encima (hasta CEILING_SEARCH filas) y sube a colgarse de él con su
 * hilo (`baseY` = punto de anclaje). Si no hay techo, simplemente camina.
 */
function hangUp(e: Enemy, world: World): void {
  const col = Math.floor((e.x + e.w / 2) / T);
  const row = Math.floor(e.y / T);
  for (let r = row - 1; r >= Math.max(0, row - CEILING_SEARCH); r--) {
    if (!world.solid(col, r)) continue;
    e.baseY = (r + 1) * T;
    e.y = Math.min(e.y, e.baseY + THREAD_SLACK);
    e.vx = 0;
    e.vy = 0;
    setState(e, TARANTULA_STATE.hang, 0);
    return;
  }
  e.vx = sideOfPlayer(e, world) * WALK_SPEED;
  setState(e, TARANTULA_STATE.walk, 0);
}

/** Cuelga esperando; se suelta cuando el jugador pasa por debajo. */
function hang(e: Enemy, world: World): void {
  e.vx = 0;
  e.y = e.baseY + THREAD_SLACK + Math.sin(e.t * BOB_FREQUENCY) * BOB_AMPLITUDE;
  const { dx, dy } = toPlayer(e, world);
  if (Math.abs(dx) < DROP_TRIGGER && dy > 0) setState(e, TARANTULA_STATE.drop, 0);
}

/**
 * Tarántula: cuelga de un hilo de seda bajo un saliente; cuando el jugador pasa por debajo se deja
 * caer y, al tocar el suelo, camina hacia él (da la vuelta en las paredes).
 * Pisable en todo momento.
 */
const moveTarantula: EnemyMove = (e, world, dt) => {
  switch (e.state) {
    case TARANTULA_STATE.init:
      hangUp(e, world);
      return;
    case TARANTULA_STATE.hang:
      hang(e, world);
      return;
    case TARANTULA_STATE.drop:
      fall(e, world, dt);
      if (e.onGround) {
        e.vx = sideOfPlayer(e, world) * WALK_SPEED;
        setState(e, TARANTULA_STATE.walk, 0);
      }
      return;
    default:
      // El temporizador cuenta el tiempo desde que aterrizó (negativo): lo usa el dibujo.
      e.timer -= dt;
      if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
      fall(e, world, dt);
  }
};

export const TARANTULA: EnemyDef = {
  id: 'tarantula',
  w: 36,
  h: 26,
  stompable: true,
  flying: false,
  speed: WALK_SPEED,
  score: 300,
  move: moveTarantula,
};
