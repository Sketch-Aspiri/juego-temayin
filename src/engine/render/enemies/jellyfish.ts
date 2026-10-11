import { TAU } from '../../constants';
import { centerFrame, drawLazyFrame } from './atlas';
import type { EnemyDrawFn } from './types';

const FRAMES = [
  centerFrame(48, 100, 609, 472), centerFrame(735, 153, 465, 424),
  centerFrame(167, 773, 352, 390), centerFrame(687, 701, 519, 464),
] as const;
const ART_SCALE = 0.085;
const PULSE_RATE = 4;

export const drawJellyfish: EnemyDrawFn = (c, _assets, e) => {
  const cy = -e.h / 2;
  const frame = FRAMES[Math.floor(e.t * PULSE_RATE) % FRAMES.length];
  if (drawLazyFrame(c, 'enemies/jellyfish.webp', frame, ART_SCALE, 0, cy)) return;
  c.fillStyle = '#cda8f3'; c.beginPath(); c.ellipse(0, cy - 8, 17, 12, 0, 0, TAU); c.fill();
  c.strokeStyle = '#e9d4ff'; c.lineWidth = 2; c.beginPath();
  for (let x = -12; x <= 12; x += 6) {
    c.moveTo(x, cy); c.quadraticCurveTo(x + Math.sin(e.t * PULSE_RATE) * 4, cy + 12, x, cy + 20);
  }
  c.stroke();
};
