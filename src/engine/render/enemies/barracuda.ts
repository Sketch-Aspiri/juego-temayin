import { TAU } from '../../constants';
import { BARRACUDA_STATE } from '../../entities/enemies/barracuda';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';

/** Paleta de la barracuda: lomo gris azulado con barras oscuras, vientre plateado. */
const OUTLINE = '#132530';
const BACK = '#4f6f80';
const BELLY = '#d8e6ec';
const BARS = '#2c4452';
const FIN = '#6f8c99';
const TAIL_SPEED = 10;
const DART_TAIL_SPEED = 28;
const DEAD_SQUASH = 0.6;

/** Cuerpo de torpedo mirando a la derecha, centrado en (0, cy). */
function bodyPath(c: Ctx, cy: number): void {
  c.beginPath();
  c.moveTo(-24, cy);
  c.quadraticCurveTo(-8, cy - 10, 14, cy - 7);
  c.quadraticCurveTo(26, cy - 5, 31, cy - 1);
  c.lineTo(24, cy + 3);
  c.quadraticCurveTo(4, cy + 9, -24, cy);
  c.closePath();
}

function drawTail(c: Ctx, cy: number, flick: number): void {
  c.fillStyle = FIN;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-22, cy);
  c.lineTo(-34, cy - 9 + flick);
  c.lineTo(-30, cy + flick * 0.3);
  c.lineTo(-34, cy + 9 + flick);
  c.closePath();
  c.fill();
  c.stroke();
}

function drawFins(c: Ctx, cy: number): void {
  c.fillStyle = FIN;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  for (const [x, h] of [[-12, 6], [4, 5]] as const) {
    c.beginPath();
    c.moveTo(x - 4, cy - 7);
    c.lineTo(x - 1, cy - 7 - h);
    c.lineTo(x + 4, cy - 7);
    c.fill();
    c.stroke();
  }
  c.beginPath();
  c.moveTo(4, cy + 3);
  c.lineTo(-2, cy + 9);
  c.lineTo(9, cy + 4);
  c.fill();
  c.stroke();
}

function drawHead(c: Ctx, cy: number, open: boolean): void {
  // mandíbula inferior prominente con dientes
  c.fillStyle = BELLY;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(16, cy + 2);
  c.lineTo(33, cy + (open ? 5 : 1));
  c.lineTo(22, cy + 5);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    const tx = 20 + i * 3;
    c.beginPath();
    c.moveTo(tx, cy + 1);
    c.lineTo(tx + 1, cy - 1.5);
    c.lineTo(tx + 2, cy + 1);
    c.fill();
  }
  c.fillStyle = '#ffe680';
  c.beginPath();
  c.arc(19, cy - 3.5, 2.6, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(19.6, cy - 3.5, 1.2, 0, TAU);
  c.fill();
}

function drawSpeedLines(c: Ctx, cy: number, t: number): void {
  c.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  c.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const off = ((t * 120 + i * 14) % 30) + 36;
    c.beginPath();
    c.moveTo(-off, cy - 6 + i * 6);
    c.lineTo(-off - 10, cy - 6 + i * 6);
    c.stroke();
  }
}

/** Barracuda procedural: patrulla meneando la cola; al embestir abre la boca y deja estela. */
export const drawBarracuda: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, DEAD_SQUASH);
  const cy = -e.h / 2;
  const dart = !e.dead && e.state === BARRACUDA_STATE.dart;
  const flick = Math.sin(e.t * (dart ? DART_TAIL_SPEED : TAIL_SPEED)) * 3;
  if (dart) drawSpeedLines(c, cy, e.t);
  drawTail(c, cy, flick);
  drawFins(c, cy);
  bodyPath(c, cy);
  const g = c.createLinearGradient(0, cy - 8, 0, cy + 6);
  g.addColorStop(0, BACK);
  g.addColorStop(0.55, BELLY);
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = BARS;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(-16 + i * 7, cy - 10);
    c.lineTo(-12 + i * 7, cy - 10);
    c.lineTo(-15 + i * 7, cy - 1);
    c.fill();
  }
  c.restore();
  bodyPath(c, cy);
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.stroke();
  drawHead(c, cy, dart);
};
