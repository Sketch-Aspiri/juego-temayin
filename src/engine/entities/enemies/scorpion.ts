import { groundAhead, toPlayer, walk } from './behaviors';
import type { EnemyDef, EnemyMove } from './types';

export const SCORPION_SPEED = 65;
export const SCORPION_ALERT_SPEED = 160;
const HEARING_DISTANCE = 210;
const ALERT_TIME = 1.4;

/** El ruido de un salto cercano alerta al escorpión, que acelera durante un instante. */
const listen: EnemyMove = (e, world, dt) => {
  const { dx } = toPlayer(e, world);
  if (Math.abs(dx) < HEARING_DISTANCE && world.player.vy < -300) e.timer = ALERT_TIME;
  else e.timer = Math.max(0, e.timer - dt);
  e.state = e.timer > 0 ? 1 : 0;
  const speed = e.state ? SCORPION_ALERT_SPEED : SCORPION_SPEED;
  let dir = Math.sign(e.vx) || -1;
  if (e.onGround && !groundAhead(e, world, dir)) dir = -dir;
  e.vx = dir * speed;
  walk(e, world, dt);
};

export const SCORPION: EnemyDef = {
  id: 'scorpion', w: 38, h: 24, flying: false, stompable: true, speed: SCORPION_SPEED, score: 250, move: listen,
};
