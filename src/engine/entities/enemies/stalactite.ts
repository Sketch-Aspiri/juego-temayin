import { overlap, moveY } from '../../physics';
import { makeParticle } from '../particles';
import { toPlayer } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

const TRIGGER_DISTANCE = 65;
const WARNING_TIME = 0.45;
const GRAVITY = 1700;
const MAX_FALL = 850;

/** Avisa antes de caer y se fragmenta al tocar el suelo. */
const drop: EnemyMove = (e, world, dt) => {
  if (e.state === 0) {
    const { dx, dy } = toPlayer(e, world);
    if (Math.abs(dx) < TRIGGER_DISTANCE && dy > 0) {
      e.state = 1; e.timer = WARNING_TIME; world.audio.play('warn');
    }
    return;
  }
  if (e.state === 1) {
    e.timer -= dt;
    if (e.timer > 0) return;
    e.state = 2;
  }
  e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
  moveY(e, e.vy * dt, world.solidAt);
  if (overlap(world.player, e)) world.hurt();
  if (!e.onGround) return;
  e.alive = false;
  for (const vx of [-80, 0, 80]) world.particles.push(makeParticle('dust', e.x, e.y + e.h, { vx, vy: -100 }));
  world.audio.play('brk');
};

export const STALACTITE: EnemyDef = {
  id: 'stalactite', w: 26, h: 55, flying: true, stompable: false, speed: 0, score: 100, move: drop,
};
