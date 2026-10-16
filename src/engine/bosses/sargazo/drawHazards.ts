import { TAU, VW } from '../../constants';
import { outlined, type Ctx } from '../../render/drawUtils';
import { drawSeaEffect } from '../../render/sargazoSprites';
import type { SeaAttack } from './choose';
import type { Sargazo } from './index';
import * as K from './tuning';

const DASH = [8, 7];
const SOLID: number[] = [];
/** Compensa el encuadre completo de la arena en una pantalla vertical. */
export const cueScale = (c: Ctx): number => Math.max(1, VW / c.canvas.width);
const LABEL: Readonly<Record<SeaAttack, string>> = {
  salvo: '¡SALVA DE ALGAS!', tide: '¡BUSCA EL HUECO!', surge: '¡CAMBIA DE PROFUNDIDAD!',
  whirlpool: '¡SAL DEL REMOLINO!', rain: '¡LLUVIA DE SEMILLAS!', net: '¡LIBERA A LA TORTUGA!',
};

export function drawSeaHazards(c: Ctx, b: Sargazo, camX: number): void {
  for (const shot of b.shots) {
    if (shot.wait > 0) {
      c.strokeStyle = '#ffe3a0'; c.lineWidth = 2; c.setLineDash(DASH);
      c.beginPath(); c.arc(shot.x - camX, shot.y, 22, 0, TAU); c.stroke(); c.setLineDash(SOLID);
    } else if (!drawSeaEffect(c, 'seed', shot.x - camX, shot.y, K.BALL_RADIUS * 2)) {
      c.fillStyle = '#e2aa3c'; c.beginPath(); c.arc(shot.x - camX, shot.y, K.BALL_RADIUS, 0, TAU); c.fill();
    }
  }
  for (const tide of b.tides) drawTide(c, tide.x - camX, tide.gapY, tide.gap);
  for (const vortex of b.vortices) {
    c.save(); c.translate(vortex.x - camX, vortex.y); c.rotate(vortex.t * 2);
    if (!drawSeaEffect(c, 'whirlpool', 0, 0, K.VORTEX_RADIUS * 2)) {
      c.strokeStyle = '#58ddd1'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, K.VORTEX_RADIUS, 0, TAU); c.stroke();
    }
    c.fillStyle = 'rgba(226,170,60,.6)'; c.beginPath(); c.arc(0, 0, K.VORTEX_CORE, 0, TAU); c.fill(); c.restore();
  }
}

function drawTide(c: Ctx, x: number, center: number, gap: number): void {
  c.fillStyle = 'rgba(161,110,28,.7)'; c.strokeStyle = '#f5d17a'; c.lineWidth = 2;
  const top = Math.max(K.SURFACE, center - gap / 2), bottom = Math.min(K.FLOOR, center + gap / 2);
  c.fillRect(x - K.TIDE_WIDTH / 2, K.SURFACE, K.TIDE_WIDTH, top - K.SURFACE);
  c.fillRect(x - K.TIDE_WIDTH / 2, bottom, K.TIDE_WIDTH, K.FLOOR - bottom);
  for (let y = K.SURFACE; y < K.FLOOR; y += 35) {
    if (y > top - 15 && y < bottom + 15) continue;
    drawSeaEffect(c, 'seed', x, y + 8, K.TIDE_WIDTH + 8, 30);
  }
  c.strokeStyle = '#a5ffed';
  c.strokeRect(x - 24, top, 48, bottom - top);
}

export function drawSeaWarning(c: Ctx, b: Sargazo, camX: number): void {
  c.save(); c.strokeStyle = '#fff0ad'; c.lineWidth = 2; c.setLineDash(DASH);
  if (b.attack === 'surge') {
    c.fillStyle = 'rgba(255,202,92,.13)';
    c.fillRect(b.left - camX, b.targetY - b.h / 2, b.right - b.left, b.h);
    c.strokeRect(b.left - camX, b.targetY - b.h / 2, b.right - b.left, b.h);
  } else if (b.attack === 'tide') {
    const gap = K.byPhase(K.TIDE_GAP, b.phase);
    c.fillStyle = 'rgba(120,255,228,.12)'; c.fillRect(b.left - camX, b.targetY - gap / 2, b.right - b.left, gap);
    c.strokeRect(b.left - camX, b.targetY - gap / 2, b.right - b.left, gap);
  } else if (b.attack === 'whirlpool') {
    c.beginPath(); c.arc(b.targetX - camX, b.targetY, K.VORTEX_RADIUS, 0, TAU); c.stroke();
  } else if (b.attack === 'salvo') {
    c.beginPath(); c.moveTo(b.x + b.w / 2 - camX, b.y + b.h / 2); c.lineTo(b.targetX - camX, b.targetY); c.stroke();
  } else if (b.attack === 'rain') {
    for (let i = 0; i < K.RAIN_COLUMNS; i++) {
      const x = b.left + (i + 0.5) * (b.right - b.left) / K.RAIN_COLUMNS - camX;
      c.beginPath(); c.moveTo(x, K.SURFACE + 40); c.lineTo(x, K.FLOOR); c.stroke();
    }
  } else if (b.attack === 'net') {
    const ally = b.turtles[b.targetTurtle];
    if (ally) {
      const progress = Math.min(1, b.t / b.warningTime), m = ally.platform;
      const x = b.x + b.w / 2 + (m.x + m.w / 2 - b.x - b.w / 2) * progress;
      const y = b.y + b.h / 2 + (m.y - b.y - b.h / 2) * progress;
      drawSeaEffect(c, 'netLoop', x - camX, y, 65, 44);
    }
  }
  c.setLineDash(SOLID); c.font = `bold ${20 * cueScale(c)}px "Trebuchet MS", sans-serif`; c.textAlign = 'center';
  outlined(c, LABEL[b.attack], (b.left + b.right) / 2 - camX, K.SURFACE + 28, '#ffe5a2', 4);
  c.restore();
}

export function drawTurtleHelp(c: Ctx, b: Sargazo, camX: number): void {
  c.save();
  for (let i = 0; i < b.turtles.length; i++) {
    const ally = b.turtles[i], m = ally.platform, x = m.x + m.w / 2 - camX;
    c.strokeStyle = ally.netted ? '#ffdc6e' : 'rgba(155,255,237,.5)'; c.lineWidth = 2;
    c.beginPath(); c.arc(x, m.y, ally.netted ? K.RESCUE_RADIUS : K.AIR_RADIUS, 0, TAU); c.stroke();
    if (ally.netted) {
      c.lineWidth = 5; c.beginPath(); c.arc(x, m.y, K.RESCUE_RADIUS, -Math.PI / 2, -Math.PI / 2 + TAU * ally.rescue / K.RESCUE_TIME); c.stroke();
    }
    if ((b.st === 'warn' && b.attack === 'net' && i === b.targetTurtle) || ally.netted) {
      c.font = `bold ${15 * cueScale(c)}px "Trebuchet MS", sans-serif`; c.textAlign = 'center';
      outlined(c, ally.netted ? '¡NADA JUNTO A MÍ!' : '¡ENREDO!', x, m.y - 44, '#fff1ac', 3);
    }
  }
  if (b.team.pulse) {
    const p = b.team.pulse;
    if (!drawSeaEffect(c, 'pulse', p.x - camX, p.y, 36)) {
      c.fillStyle = '#a9ffea'; c.beginPath(); c.arc(p.x - camX, p.y, 18, 0, TAU); c.fill();
    }
  }
  c.restore();
}
