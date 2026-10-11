import { TAU } from '../constants';
import type { MovingPlatform } from '../entities/platforms';
import type { Ctx } from './drawUtils';

/** La cubierta y la cima del caparazón coinciden con la superficie de colisión. */
export function drawCoastalPlatform(c: Ctx, m: MovingPlatform, camX: number): void {
  const turtle = m.spec.kind === 'mover' && m.spec.appearance === 'turtle';
  const y = m.y + (m.submerged ? 55 : 0);
  c.save(); c.translate(m.x - camX, y);
  if (m.submerged) c.globalAlpha = 0.55;
  if (turtle) drawTurtle(c, m.w);
  else drawBoat(c, m.w);
  c.restore();
}

function drawTurtle(c: Ctx, w: number): void {
  c.fillStyle = '#65ab84';
  for (const x of [w * 0.2, w * 0.75]) {
    c.beginPath(); c.ellipse(x, 27, 19, 9, 0.4, 0, TAU); c.fill();
  }
  c.beginPath(); c.ellipse(w + 8, 16, 21, 13, 0, 0, TAU); c.fill();
  c.fillStyle = '#1c3940'; c.beginPath(); c.arc(w + 17, 11, 3, 0, TAU); c.fill();
  c.fillStyle = '#446b3a'; c.strokeStyle = '#b6cc75'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(w / 2, 20, w / 2, 20, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(w * 0.25, 7); c.lineTo(w * 0.38, 28);
  c.lineTo(w * 0.64, 28); c.lineTo(w * 0.76, 7); c.stroke();
  c.beginPath(); c.moveTo(w * 0.38, 28); c.lineTo(w * 0.2, 34);
  c.moveTo(w * 0.64, 28); c.lineTo(w * 0.8, 34); c.stroke();
}

function drawBoat(c: Ctx, w: number): void {
  c.fillStyle = '#77472e'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
  c.lineTo(w - 25, 46); c.quadraticCurveTo(w / 2, 63, 25, 46); c.closePath(); c.fill();
  c.fillStyle = '#f5dfb4'; c.fillRect(0, 0, w, 7);
  c.fillStyle = '#35b8b3'; c.fillRect(18, 20, w - 36, 8);
  c.strokeStyle = '#6b492a'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, -65); c.stroke();
  c.fillStyle = '#fff1cf'; c.beginPath(); c.moveTo(w / 2 + 3, -60);
  c.lineTo(w / 2 + 3, -12); c.lineTo(w / 2 + 46, -12); c.closePath(); c.fill();
}
