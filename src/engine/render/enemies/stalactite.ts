import { drawLazyFrame, footFrame } from './atlas';
import type { EnemyDrawFn } from './types';
const FRAMES = [footFrame(143, 72, 380, 484), footFrame(733, 73, 379, 483), footFrame(143, 683, 380, 483)] as const;
const SCALE = 0.12;
export const drawStalactite: EnemyDrawFn = (c, _assets, e) => {
  if (e.state === 1) c.translate(Math.sin(e.t * 55) * 2, 0);
  if (drawLazyFrame(c, 'enemies/stalactite.webp', FRAMES[e.state], SCALE)) return;
  c.fillStyle = '#a0d2dc'; c.beginPath(); c.moveTo(-14, -e.h); c.lineTo(14, -e.h); c.lineTo(0, 0); c.fill();
};
