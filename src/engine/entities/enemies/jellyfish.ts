import { ROWS, T } from '../../constants';
import { waterColumn } from '../../level/zones';
import { moveY } from '../../physics';
import type { EnemyDef, EnemyMove } from './types';

const FLOAT_SPEED = 36;
const FLOAT_RANGE = 2 * T;

/** Sube y baja alrededor del punto de aparición sin atravesar roca ni salir del agua. */
const moveJellyfish: EnemyMove = (e, world, dt) => {
  const zone = waterColumn(world.level.water, Math.floor((e.x + e.w / 2) / T));
  if (!zone) return;
  const top = Math.max(zone.surface * T, e.baseY - FLOAT_RANGE);
  const bottom = Math.min(ROWS * T - e.h, e.baseY + FLOAT_RANGE);
  if (!e.vy) e.vy = -FLOAT_SPEED;
  const dir = Math.sign(e.vy);
  const blocked = moveY(e, e.vy * dt, world.solidAt);
  e.y = Math.max(top, Math.min(bottom, e.y));
  if (blocked || (dir < 0 && e.y <= top) || (dir > 0 && e.y >= bottom)) e.vy = -dir * FLOAT_SPEED;
  e.vx = 0;
};

export const JELLYFISH: EnemyDef = {
  id: 'jellyfish', w: 32, h: 38, stompable: false,
  flying: false, swimming: true, speed: 0, score: 300, move: moveJellyfish,
};
