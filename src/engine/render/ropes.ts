import { TAU, VW } from '../constants';
import type { Rope } from '../entities/ropes';
import type { Ctx } from './drawUtils';

const BRAID_STEP = 8;
const ROPE_WIDTH = 7;

/** El trenzado conserva su grosor: solo cambia el largo, nunca se estira un atlas. */
export function drawRopes(c: Ctx, ropes: readonly Rope[], camX: number): void {
  for (const r of ropes) {
    if (r.x - camX < -r.length || r.x - camX > VW + r.length) continue;
    c.save(); c.translate(r.x - camX, r.y);
    drawAnchor(c, r.y);
    c.rotate(-r.angle);
    c.lineCap = 'round'; c.strokeStyle = '#3f2c21'; c.lineWidth = ROPE_WIDTH + 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, r.length); c.stroke();
    c.strokeStyle = '#b79055'; c.lineWidth = ROPE_WIDTH;
    c.stroke();
    c.strokeStyle = '#f0d69a'; c.lineWidth = 2;
    c.beginPath();
    for (let y = 3; y < r.length - BRAID_STEP; y += BRAID_STEP) {
      c.moveTo(-2, y); c.quadraticCurveTo(3, y + 2, 2, y + 5);
    }
    c.stroke();
    // El nudo termina exactamente donde se enganchan las manos del jugador.
    c.fillStyle = '#cda56a'; c.strokeStyle = '#60482b'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, r.length - 2, 6, 5, 0, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
}

function drawAnchor(c: Ctx, height: number): void {
  c.lineCap = 'round'; c.strokeStyle = '#735638'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-34, -height); c.lineTo(-24, -6);
  c.moveTo(34, -height); c.lineTo(24, -6); c.stroke();
  c.strokeStyle = '#3c3027'; c.lineWidth = 16;
  c.beginPath(); c.moveTo(-40, -5); c.lineTo(40, -5); c.stroke();
  c.strokeStyle = '#a47b46'; c.lineWidth = 10; c.stroke();
  c.strokeStyle = '#d2af70'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-34, -8); c.lineTo(33, -8); c.stroke();
  c.strokeStyle = '#ead298'; c.lineWidth = 3;
  for (const x of [-26, -21, -3, 2, 21, 26]) {
    c.beginPath(); c.moveTo(x, -12); c.lineTo(x, 2); c.stroke();
  }
}
