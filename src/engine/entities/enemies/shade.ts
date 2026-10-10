import { T } from '../../constants';
import { toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

/** Estados de la sombra de Xibalbá (`Enemy.state`). */
export const SHADE_STATE = { idle: 0, drift: 1 } as const;

/** Distancia a la que empieza a flotar hacia el jugador. */
export const SHADE_NOTICE_RANGE = 7 * T;
/** Distancia a la que deja de seguirlo y vuelve a flotar en su sitio. */
const SHADE_GIVE_UP_RANGE = 11 * T;
/** Velocidad de deriva (px/s): lenta, se esquiva caminando. */
export const SHADE_SPEED = 55;
const HOVER_AMPLITUDE = 10;
const HOVER_FREQUENCY = 1.6;
/** La penumbra exterior del halo no basta: debe entrar en su parte iluminada. */
const LIGHT_DISSOLVE_RATIO = 0.65;

/**
 * Sombra de Xibalbá (menor): figura de leyenda del inframundo maya (AGENTS.md §4.5).
 * Flota en su sitio hasta que el jugador se acerca y entonces deriva despacio hacia
 * él, atravesando los bloques. No se puede pisar; el fuego la disuelve.
 * La parte iluminada de un halo también la disuelve.
 * `vx` guarda la dirección horizontal (para orientar el dibujo).
 */
const moveShade: EnemyMove = (e, world, dt) => {
  const x = e.x + e.w / 2;
  const y = e.y + e.h / 2;
  if (world.lightSources().some(l => Math.hypot(x - l.x, y - l.y) < l.radius * LIGHT_DISSOLVE_RATIO)) {
    world.killEnemy(e, true);
    return;
  }
  const { dx, dy } = toPlayer(e, world);
  const dist = Math.hypot(dx, dy);
  if (e.state === SHADE_STATE.idle) {
    e.y = e.baseY + Math.sin(e.t * HOVER_FREQUENCY) * HOVER_AMPLITUDE;
    if (Math.abs(dx) < SHADE_NOTICE_RANGE) e.state = SHADE_STATE.drift;
    return;
  }
  if (dist > SHADE_GIVE_UP_RANGE) {
    e.state = SHADE_STATE.idle;
    e.baseY = e.y;
    return;
  }
  if (dist < 1) return;
  e.vx = (dx / dist) * SHADE_SPEED;
  e.vy = (dy / dist) * SHADE_SPEED;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
};

export const SHADE: EnemyDef = {
  id: 'shade',
  w: 30,
  h: 36,
  stompable: false,
  flying: true,
  speed: SHADE_SPEED,
  score: 400,
  move: moveShade,
};
