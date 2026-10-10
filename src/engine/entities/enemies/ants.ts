import { makeParticle } from '../particles';
import type { World } from '../../World';
import type { Enemy } from '../types';
import { walk } from './behaviors';
import type { EnemyDef } from './types';

/** Hormigas de una fila (un solo `Enemy` representa la columna entera). */
export const ANT_COUNT = 4;
/** Ancho que ocupa cada hormiga en la fila. */
export const ANT_SPACING = 20;
/** Puntos por cada hormiga pisada (la última da el `score` de la definición). */
const ANT_SCORE = 50;
const DUST_PUFFS = 4;
const DUST_SPEED = 90;

/** Hormigas que quedan en la fila (`Enemy.state` cuenta las ya pisadas). */
export const antsLeft = (e: Enemy): number => ANT_COUNT - e.state;

/**
 * Pisar la fila aplasta solo la hormiga de cola; la caja se acorta desde atrás
 * (según hacia dónde marchan). Con la última, muere como cualquier enemigo.
 */
function stompAnt(e: Enemy, world: World): void {
  if (antsLeft(e) <= 1) {
    world.killEnemy(e, false);
    return;
  }
  e.state++;
  const tailX = e.vx < 0 ? e.x + e.w - ANT_SPACING : e.x;
  e.w -= ANT_SPACING;
  if (e.vx >= 0) e.x += ANT_SPACING;
  for (let i = 0; i < DUST_PUFFS; i++) {
    const a = (i / DUST_PUFFS) * Math.PI - Math.PI;
    world.particles.push(
      makeParticle('dust', tailX + ANT_SPACING / 2, e.y + e.h, { vx: Math.cos(a) * DUST_SPEED, vy: Math.sin(a) * DUST_SPEED }),
    );
  }
  world.addScore(ANT_SCORE, tailX, e.y);
  world.audio.play('stomp');
}

/**
 * Hormigas arrieras: columna lenta que marcha en línea (camina y da la vuelta en
 * las paredes). Se pisan una a una; el fuego quema la fila entera.
 */
export const ANTS: EnemyDef = {
  id: 'ants',
  w: ANT_COUNT * ANT_SPACING,
  h: 16,
  stompable: true,
  flying: false,
  speed: 32,
  score: 200,
  move: walk,
  onStomp: stompAnt,
};
