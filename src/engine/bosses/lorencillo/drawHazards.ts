import { GROUND, T, TAU } from '../../constants';
import type { Ctx } from '../../render/drawUtils';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';
import type { Lorencillo } from './index';
import { type Shell, shellHarmful, shellProgress, shellX, shellY } from './hazards';
import { SHELL_BURST_LIFE, SHELL_RADIUS } from './tuning';

/**
 * Avisos de Lorencillo: marcas en la superficie real de impacto, bala y humo
 * pintados, explosión y señales de estocada, apertura e inclinación.
 */

const FLOOR = GROUND * T;
const MARK_PULSE = 14;
const BALL_RADIUS = 11;
const WARN_BLINK = 10;
const MARK_COLOR = '#ff5b3a';
/** Contorno oscuro bajo la marca: el rojo solo se pierde sobre la madera naranja de la cubierta. */
const MARK_OUTLINE = 'rgba(40, 0, 0, 0.9)';
const MARK_MIN_ALPHA = 0.6;

/** Marca roja sobre la cubierta que parpadea cada vez más rápido hasta el impacto. */
function drawMark(c: Ctx, s: Shell, camX: number): void {
  const left = s.warn - s.t;
  const pulse = 0.5 + 0.5 * Math.sin(s.t * MARK_PULSE * (1 + (s.warn - Math.max(0, left)) / s.warn));
  c.save();
  c.globalAlpha = MARK_MIN_ALPHA + (1 - MARK_MIN_ALPHA) * pulse;
  c.beginPath(); c.ellipse(s.x - camX, s.impactY - 4, SHELL_RADIUS, 8, 0, 0, TAU);
  c.strokeStyle = MARK_OUTLINE; c.lineWidth = 8; c.stroke();
  c.strokeStyle = MARK_COLOR; c.lineWidth = 4; c.stroke();
  c.fillStyle = MARK_COLOR; c.globalAlpha *= 0.55;
  c.fill();
  c.globalAlpha = 1;
  c.setLineDash([5, 6]);
  c.beginPath(); c.moveTo(s.x - camX, s.impactY - 100); c.lineTo(s.x - camX, s.impactY - 12);
  c.strokeStyle = '#ffe4b5'; c.lineWidth = 2; c.stroke();
  c.restore();
}

function drawBall(c: Ctx, s: Shell, camX: number): void {
  const u = shellProgress(s);
  if (u < 0 || u > 1) return;
  const x = shellX(s, u) - camX, y = shellY(u, s.impactY);
  const previous = Math.max(0, u - 0.06);
  c.save(); c.translate(x, y);
  c.rotate(Math.atan2(y - shellY(previous, s.impactY), shellX(s, u) - shellX(s, previous)));
  c.globalAlpha = 0.65;
  drawNewGameplaySprite(c, 'cannonSmoke', -BALL_RADIUS, 0, 55, 18);
  c.restore();
  if (drawNewGameplaySprite(c, 'cannonball', x, y, BALL_RADIUS * 2)) return;
  c.fillStyle = '#2a2d36';
  c.beginPath(); c.arc(x, y, BALL_RADIUS, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.beginPath(); c.arc(x - 3, y - 3, 3, 0, TAU); c.fill();
}

function drawBurst(c: Ctx, s: Shell, camX: number): void {
  const k = Math.min(1, s.burst / SHELL_BURST_LIFE);
  c.save();
  c.globalAlpha = 1 - k;
  c.fillStyle = '#ffb347';
  c.beginPath(); c.ellipse(s.x - camX, s.impactY - 14, SHELL_RADIUS, 25, 0, 0, TAU); c.fill();
  c.restore();
}

/** Flechas y anillos usan formas además del color para distinguir peligro y apertura. */
export function drawBattleCues(c: Ctx, b: Lorencillo, camX: number): void {
  c.save();
  if (b.st === 'warn') {
    c.strokeStyle = '#ffb14e'; c.lineWidth = 3; c.setLineDash([10, 7]);
    const x = b.x + b.w / 2 - camX, end = x + b.face * 290;
    c.beginPath(); c.moveTo(x, FLOOR - 12); c.lineTo(end, FLOOR - 12);
    c.lineTo(end - b.face * 18, FLOOR - 24); c.moveTo(end, FLOOR - 12);
    c.lineTo(end - b.face * 18, FLOOR); c.stroke();
  }
  if (b.hittable) {
    const x = b.x + b.w / 2 - camX;
    c.strokeStyle = '#8ffff0'; c.lineWidth = 3; c.setLineDash([]);
    c.beginPath(); c.ellipse(x, FLOOR - 3, b.w * 0.65, 10, 0, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x, b.y - 28); c.lineTo(x, b.y - 8);
    c.lineTo(x - 7, b.y - 16); c.moveTo(x, b.y - 8); c.lineTo(x + 7, b.y - 16); c.stroke();
  }
  if (b.phase === 2 && b.tilt.phase !== 'rest' && !['dead', 'gone'].includes(b.st)) {
    const x = (b.left + b.right) / 2 - camX, d = b.tilt.dir;
    c.strokeStyle = '#ffe7a0'; c.lineWidth = 4; c.setLineDash([]);
    for (const offset of [-32, 0, 32]) {
      c.beginPath(); c.moveTo(x + offset - d * 12, FLOOR - 30);
      c.lineTo(x + offset, FLOOR - 20); c.lineTo(x + offset - d * 12, FLOOR - 10); c.stroke();
    }
  }
  c.restore();
}

export function drawShells(c: Ctx, shells: readonly Shell[], camX: number): void {
  for (const s of shells) {
    if (shellHarmful(s)) drawBurst(c, s, camX);
    else {
      drawMark(c, s, camX);
      drawBall(c, s, camX);
    }
  }
}

/** Exclamación parpadeante sobre la cabeza durante el aviso de estocada. */
export function drawWarnCue(c: Ctx, x: number, y: number, t: number): void {
  if (Math.floor(t * WARN_BLINK) % 2) return;
  c.fillStyle = MARK_COLOR;
  c.fillRect(x - 3, y - 26, 6, 16);
  c.fillRect(x - 3, y - 6, 6, 6);
}
