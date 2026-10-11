import { TAU, VH, VW } from '../../constants';
import type { Scenery } from '../backgrounds';

const REEF_SPACING = 130;
const PARALLAX = 0.2;

/** Respaldo del arrecife: arena, abanicos de coral y rayos filtrados por el agua. */
export const reefScenery: Scenery = (c, cam, now) => {
  c.fillStyle = 'rgba(110,230,240,.08)';
  for (let x = 0; x < VW; x += REEF_SPACING) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, VH); c.lineTo(x + 150, VH); c.closePath(); c.fill();
  }
  const offset = (cam * PARALLAX) % REEF_SPACING;
  c.fillStyle = '#b0cda4'; c.fillRect(0, VH - 25, VW, 25);
  for (let x = -offset; x < VW + REEF_SPACING; x += REEF_SPACING) {
    c.strokeStyle = '#ab6894'; c.lineWidth = 5; c.beginPath();
    for (let branch = -2; branch <= 2; branch++) {
      c.moveTo(x, VH - 25); c.quadraticCurveTo(x + branch * 8, VH - 65, x + branch * 17, VH - 100 + Math.sin(now / 1000) * 2);
    }
    c.stroke(); c.fillStyle = '#ddab83'; c.beginPath(); c.ellipse(x + 65, VH - 25, 30, 15, 0, 0, TAU); c.fill();
  }
};
