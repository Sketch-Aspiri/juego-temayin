import { moveX } from '../../physics';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { fall, groundAhead, setState, sideOfPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados del alux (`Enemy.state`). */
export const ALUX_STATE = { roam: 0, flee: 1, carry: 2 } as const;

/** Cacao que roba como máximo de un toque. */
export const ALUX_STEAL = 5;
/** Multiplicador de lo robado que devuelve si lo pisas. */
export const ALUX_RETURN_FACTOR = 2;
/** Segundos que huye a la carrera tras el robo. */
export const ALUX_FLEE_TIME = 2.2;
const ROAM_SPEED = 60;
/** Más lento que la carrera del jugador (400): se le puede alcanzar. */
export const ALUX_FLEE_SPEED = 220;
const CARRY_SPEED = 90;

/** Cacao que lleva cada alux (lo robado). */
const loot = new WeakMap<Enemy, number>();
export const aluxLoot = (e: Enemy): number => loot.get(e) ?? 0;

/** Camina sin caerse de las cornisas: da la vuelta en paredes y bordes. */
function patrol(e: Enemy, world: World, dt: number, speed: number): void {
  const dir = Math.sign(e.vx) || 1;
  if (!groundAhead(e, world, dir) && e.onGround) e.vx = -dir * speed;
  else e.vx = dir * speed;
  if (moveX(e, e.vx * dt, world.solidAt)) e.vx = -e.vx;
  fall(e, world, dt);
}

/**
 * Alux: pequeño guardián travieso del monte y la milpa en la tradición yucateca
 * (AGENTS.md §4.5 y §9: travieso, no maligno). No hace daño: al tocarte te roba
 * cacao (hasta ALUX_STEAL) y huye riendo; mientras lleva el botín no vuelve a robar.
 * Si lo pisas devuelve el doble de lo robado (ALUX_RETURN_FACTOR).
 */
const moveAlux: EnemyMove = (e, world, dt) => {
  if (e.state === ALUX_STATE.flee) {
    e.timer -= dt;
    patrol(e, world, dt, ALUX_FLEE_SPEED);
    if (e.timer <= 0) setState(e, ALUX_STATE.carry, 0);
    return;
  }
  patrol(e, world, dt, e.state === ALUX_STATE.carry ? CARRY_SPEED : ROAM_SPEED);
};

/** Contacto sin pisotón: roba cacao (sin quitar vida) y sale corriendo. */
function stealCoins(e: Enemy, world: World): void {
  if (e.state !== ALUX_STATE.roam) return;
  const n = Math.min(ALUX_STEAL, world.session.coins);
  world.session.coins -= n;
  loot.set(e, n);
  if (n > 0) world.popups.push({ x: e.x, y: e.y - 10, t: 0, txt: `-${n}` });
  world.audio.play('warn');
  e.vx = -sideOfPlayer(e, world) * ALUX_FLEE_SPEED;
  setState(e, ALUX_STATE.flee, ALUX_FLEE_TIME);
}

/** Pisotón: devuelve el doble de lo robado y se va (cae como cualquier enemigo pisado). */
function returnCoins(e: Enemy, world: World): void {
  const n = aluxLoot(e) * ALUX_RETURN_FACTOR;
  for (let i = 0; i < n; i++) {
    world.addCoin(e.x, e.y);
    // El cacao devuelto no cuenta como cacao del nivel recogido (estrellas).
    world.coinsCollected--;
  }
  loot.delete(e);
  world.killEnemy(e, false);
  if (n > 0) world.popups.push({ x: e.x, y: e.y - 30, t: 0, txt: `+${n} CACAO` });
}

export const ALUX: EnemyDef = {
  id: 'alux',
  w: 26,
  h: 32,
  stompable: true,
  flying: false,
  speed: ROAM_SPEED,
  score: 300,
  move: moveAlux,
  onStomp: returnCoins,
  onTouch: stealCoins,
};
