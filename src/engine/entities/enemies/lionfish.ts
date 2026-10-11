import { bandOf, swim } from './barracuda';
import type { EnemyDef, EnemyMove } from './types';

const PATROL_SPEED = 42;
const BOB_AMPLITUDE = 4;
const BOB_FREQUENCY = 2;

/** Patrulla despacio sin embestir; las espinas obligan a usar fuego o pelota. */
const moveLionfish: EnemyMove = (e, world, dt) => {
  const dir = Math.sign(e.vx) || -1;
  e.y = e.baseY + Math.sin(e.t * BOB_FREQUENCY) * BOB_AMPLITUDE;
  if (swim(e, world, dir * PATROL_SPEED * dt, bandOf(e, world))) e.vx = -dir * PATROL_SPEED;
};

export const LIONFISH: EnemyDef = {
  id: 'lionfish', w: 44, h: 34, stompable: false,
  flying: false, swimming: true, speed: PATROL_SPEED, score: 600,
  move: moveLionfish,
};
