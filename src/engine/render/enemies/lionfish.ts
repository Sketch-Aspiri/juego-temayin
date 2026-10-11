import { TAU } from '../../constants';
import { centerFrame, drawLazyFrame } from './atlas';
import type { EnemyDrawFn } from './types';

const FRAMES = [centerFrame(27, 42, 595, 523), centerFrame(686, 78, 551, 454)] as const;
const ART_SCALE = 0.09;
const FIN_RATE = 3;

export const drawLionfish: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  const cy = -e.h / 2;
  const frame = FRAMES[Math.floor(e.t * FIN_RATE) % FRAMES.length];
  if (drawLazyFrame(c, 'enemies/lionfish.webp', frame, ART_SCALE, 0, cy)) return;
  c.strokeStyle = '#f7ddae'; c.lineWidth = 2;
  c.beginPath();
  for (let x = -16; x <= 16; x += 8) {
    c.moveTo(x, cy); c.lineTo(x * 1.4, cy - 24);
  }
  c.stroke(); c.fillStyle = '#b44c36';
  c.beginPath(); c.ellipse(0, cy, 22, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff1c8';
  for (let x = -12; x <= 12; x += 8) c.fillRect(x, cy - 8, 3, 16);
  c.fillStyle = '#172f3d'; c.beginPath(); c.arc(14, cy - 3, 2, 0, TAU); c.fill();
};
