import { drawLazyFrame, footFrame } from './atlas';
import type { EnemyDrawFn } from './types';
const FRAMES = [footFrame(62, 158, 560, 406), footFrame(651, 165, 585, 411), footFrame(629, 764, 604, 374)] as const;
const SCALE = 0.09;
export const drawScorpion: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, 0.5);
  const index = e.state ? 2 : Math.floor(e.t * 8) % 2;
  if (drawLazyFrame(c, 'enemies/scorpion.webp', FRAMES[index], SCALE)) return;
  c.fillStyle = '#d5ccae'; c.fillRect(-e.w / 2, -e.h, e.w, e.h);
};
