import { T } from '../../constants';
import { moveX, overlap } from '../../physics';
import type { Rect } from '../../types';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { fall, setState, sideOfPlayer, toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/**
 * Xtabay (AGENTS.md §4.5): figura de la leyenda yucateca, representada aquí como una
 * ceiba en flor que es una trampa, no un enemigo móvil. Si el jugador se queda quieto
 * cerca, sus flores brillan y lo atraen poco a poco hacia la raíz con espinas; en cuanto
 * se mueve o salta se libra. No se puede pisar; el fuego le cierra las flores un rato.
 */

/** Estados de la xtabay (`Enemy.state`). El dibujo elige el cuadro según el estado. */
export const XTABAY_STATE = { rest: 0, lure: 1, strike: 2, retract: 3, closed: 4 } as const;

/** Distancia horizontal (entre centros) a la que empieza a fijarse en el jugador. */
export const LURE_RANGE = 4.5 * T;
/** Diferencia de altura máxima: no atrae a quien pasa por una plataforma alta. */
const LURE_HEIGHT = 1.5 * T;
/** Segundos que el jugador debe estar quieto antes de que las flores lo atraigan. */
export const STILL_TIME = 0.8;
/** Velocidad horizontal (px/s) con la que atrae al jugador: suave, siempre escapable. */
export const LURE_SPEED = 45;
/** Por debajo de esta velocidad (px/s) el jugador cuenta como quieto. */
const STILL_SPEED = 20;
/** Hueco (px) entre el jugador y el tronco a partir del cual lanza la raíz. */
const STRIKE_GAP = 0.6 * T;
/** Alcance (px) de la raíz con espinas desde el centro del tronco. */
export const SPINE_REACH = 2 * T;
const SPINE_HEIGHT = 16;
export const STRIKE_TIME = 0.5;
const RETRACT_TIME = 0.6;
/** Segundos con las flores cerradas tras recibir una bola de fuego. */
export const CLOSED_TIME = 4;

/** Rectángulo de la raíz extendida hacia el lado del jugador (`vx` = ±1). */
export function spineRect(e: Enemy): Rect {
  const cx = e.x + e.w / 2;
  const x = e.vx >= 0 ? cx : cx - SPINE_REACH;
  return { x, y: e.y + e.h - SPINE_HEIGHT, w: SPINE_REACH, h: SPINE_HEIGHT };
}

/** El jugador está quieto, de pie y sin pulsar movimiento ni salto. */
function playerIsStill(world: World): boolean {
  const p = world.player;
  const held = world.input.held;
  return p.onGround && !p.swimming && !held.left && !held.right && !held.jump && Math.abs(p.vx) < STILL_SPEED;
}

function playerInRange(e: Enemy, world: World): boolean {
  const { dx, dy } = toPlayer(e, world);
  return Math.abs(dx) < LURE_RANGE && Math.abs(dy) < LURE_HEIGHT;
}

/** Reposo: cuenta el tiempo que el jugador lleva quieto cerca (en `timer`, hacia arriba). */
function watch(e: Enemy, world: World, dt: number): void {
  if (!playerInRange(e, world) || !playerIsStill(world)) {
    e.timer = 0;
    return;
  }
  e.vx = sideOfPlayer(e, world);
  e.timer += dt;
  if (e.timer >= STILL_TIME) setState(e, XTABAY_STATE.lure, 0);
}

/** Atracción: arrastra al jugador hacia el tronco; si se mueve o salta, se libra. */
function lure(e: Enemy, world: World, dt: number): void {
  if (!playerInRange(e, world) || !playerIsStill(world)) {
    setState(e, XTABAY_STATE.rest, 0);
    return;
  }
  const p = world.player;
  e.vx = sideOfPlayer(e, world);
  const gap = e.vx > 0 ? p.x - (e.x + e.w) : e.x - (p.x + p.w);
  if (gap <= STRIKE_GAP) {
    setState(e, XTABAY_STATE.strike, STRIKE_TIME);
    world.audio.play('warn');
    return;
  }
  moveX(p, -e.vx * LURE_SPEED * dt, world.solidAt);
}

/** Raíz extendida: la espina hace daño a quien siga encima. */
function strike(e: Enemy, world: World): void {
  if (world.phase === 'play' && overlap(world.player, spineRect(e))) world.hurt();
  if (e.timer <= 0) setState(e, XTABAY_STATE.retract, RETRACT_TIME);
}

const moveXtabay: EnemyMove = (e, world, dt) => {
  fall(e, world, dt);
  switch (e.state) {
    case XTABAY_STATE.rest:
      watch(e, world, dt);
      return;
    case XTABAY_STATE.lure:
      lure(e, world, dt);
      return;
    case XTABAY_STATE.strike:
      e.timer -= dt;
      strike(e, world);
      return;
    default:
      // Replegándose o con las flores cerradas: espera y vuelve al reposo.
      e.timer -= dt;
      if (e.timer <= 0) setState(e, XTABAY_STATE.rest, 0);
  }
};

/** El fuego no la destruye (ni da puntos): cierra sus flores durante CLOSED_TIME. */
function closeFlowers(e: Enemy): void {
  setState(e, XTABAY_STATE.closed, CLOSED_TIME);
}

export const XTABAY: EnemyDef = {
  id: 'xtabay',
  // Caja = base del tronco con raíces espinosas; la copa se dibuja encima sin colisión.
  w: 44,
  h: 40,
  stompable: false,
  flying: false,
  speed: 1,
  score: 100,
  move: moveXtabay,
  onFireball: closeFlowers,
};
