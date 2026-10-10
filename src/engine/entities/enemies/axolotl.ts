import type { Enemy } from '../types';
import { bandOf, swim } from './barracuda';
import { setState, sideOfPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados del ajolote fantasma (`Enemy.state`). */
export const AXOLOTL_STATE = { hidden: 0, appear: 1, visible: 2, fade: 3 } as const;

/** Segundos casi invisible (solo un destello) antes de volver a aparecer. */
export const AXOLOTL_HIDDEN_TIME = 1.8;
/** Duración de la aparición y del desvanecimiento. */
export const AXOLOTL_FADE_TIME = 0.6;
/** Segundos visible: la única ventana en la que toca y se le puede pisar o quemar. */
export const AXOLOTL_VISIBLE_TIME = 2.4;
/** Opacidad cuando es visible (sigue siendo translúcido). */
export const AXOLOTL_VISIBLE_ALPHA = 0.8;
/** Opacidad mínima: un destello para que el jugador adivine dónde está. */
export const AXOLOTL_HIDDEN_ALPHA = 0.12;
/** Nado lento (px/s): mismo ritmo visible o no, para que su posición sea predecible. */
const SWIM_SPEED = 45;
const BOB_AMPLITUDE = 4;
const BOB_FREQUENCY = 1.8;

/** Siguiente estado del ciclo y su duración. */
const NEXT: Readonly<Record<number, readonly [number, number]>> = {
  [AXOLOTL_STATE.hidden]: [AXOLOTL_STATE.appear, AXOLOTL_FADE_TIME],
  [AXOLOTL_STATE.appear]: [AXOLOTL_STATE.visible, AXOLOTL_VISIBLE_TIME],
  [AXOLOTL_STATE.visible]: [AXOLOTL_STATE.fade, AXOLOTL_FADE_TIME],
  [AXOLOTL_STATE.fade]: [AXOLOTL_STATE.hidden, AXOLOTL_HIDDEN_TIME],
};

/** Solo es tangible (toca, se pisa, se quema) mientras está del todo visible. */
export const axolotlTangible = (e: Enemy): boolean => e.state === AXOLOTL_STATE.visible;

/** Opacidad para el dibujo: sube al aparecer y baja al desvanecerse. */
export function axolotlAlpha(e: Enemy): number {
  const span = AXOLOTL_VISIBLE_ALPHA - AXOLOTL_HIDDEN_ALPHA;
  const progress = 1 - Math.max(0, e.timer) / AXOLOTL_FADE_TIME;
  if (e.state === AXOLOTL_STATE.visible) return AXOLOTL_VISIBLE_ALPHA;
  if (e.state === AXOLOTL_STATE.appear) return AXOLOTL_HIDDEN_ALPHA + span * progress;
  if (e.state === AXOLOTL_STATE.fade) return AXOLOTL_VISIBLE_ALPHA - span * progress;
  return AXOLOTL_HIDDEN_ALPHA;
}

/**
 * Ajolote fantasma (AGENTS.md §4.5): ser translúcido del agua de cenote. Nada despacio
 * dentro de su zona de agua (nunca sale de ella) y cicla entre casi invisible,
 * aparición, visible y desvanecimiento. Al aparecer se gira hacia el jugador.
 * Solo es tangible visible: entonces toca, se le puede pisar y el fuego lo vence.
 */
const moveAxolotl: EnemyMove = (e, world, dt) => {
  const band = bandOf(e, world);
  e.timer -= dt;
  if (e.timer <= 0) {
    const [next, time] = NEXT[e.state] ?? NEXT[AXOLOTL_STATE.hidden];
    setState(e, next, time);
    if (next === AXOLOTL_STATE.appear) e.vx = sideOfPlayer(e, world) * SWIM_SPEED;
  }
  const dir = Math.sign(e.vx) || -1;
  if (swim(e, world, dir * SWIM_SPEED * dt, band)) e.vx = -dir * SWIM_SPEED;
  e.y = e.baseY + Math.sin(e.t * BOB_FREQUENCY) * BOB_AMPLITUDE;
};

export const AXOLOTL: EnemyDef = {
  id: 'axolotl',
  w: 40,
  h: 20,
  stompable: true,
  flying: false,
  swimming: true,
  speed: SWIM_SPEED,
  score: 400,
  move: moveAxolotl,
  canStomp: axolotlTangible,
  tangible: axolotlTangible,
};
