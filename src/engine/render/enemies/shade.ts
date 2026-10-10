import { TAU } from '../../constants';
import { SHADE_STATE } from '../../entities/enemies/shade';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';

/** Sombra de Xibalbá: velo oscuro translúcido con ojos de brasa y cola ondulante. */
const BODY = 'rgba(40, 18, 60, 0.78)';
const EDGE = 'rgba(120, 70, 170, 0.55)';
const EYE = '#ff6a3a';
const EYE_GLOW = 'rgba(255, 110, 60, 0.35)';
const TAIL_WAVE_SPEED = 6;
const TAIL_WAVE = 4;
const PULSE_SPEED = 4;
const DEAD_FADE = 0.4;

/** Cuerpo con forma de gota invertida y borde inferior en jirones. */
function veil(c: Ctx, t: number): void {
  c.beginPath();
  c.moveTo(-15, -20);
  c.quadraticCurveTo(-15, -38, 0, -38);
  c.quadraticCurveTo(15, -38, 15, -20);
  for (let i = 0; i <= 4; i++) {
    const x = 15 - i * 7.5;
    const y = -4 + Math.sin(t * TAIL_WAVE_SPEED + i) * TAIL_WAVE + (i % 2 ? -6 : 0);
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = BODY;
  c.fill();
  c.strokeStyle = EDGE;
  c.lineWidth = 2;
  c.stroke();
}

function eyes(c: Ctx, t: number, drifting: boolean): void {
  const r = drifting ? 3.2 : 2.6;
  const glow = 6 + Math.sin(t * PULSE_SPEED) * 1.5;
  for (const x of [-5, 6]) {
    c.fillStyle = EYE_GLOW;
    c.beginPath();
    c.arc(x, -25, glow, 0, TAU);
    c.fill();
    c.fillStyle = EYE;
    c.beginPath();
    c.ellipse(x, -25, r, drifting ? r * 0.7 : r, 0, 0, TAU);
    c.fill();
  }
}

/** Sombra de Xibalbá procedural. Al disolverse (fuego) se desvanece. */
export const drawShade: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.globalAlpha = Math.max(0, 1 - e.dead / DEAD_FADE);
  veil(c, e.t);
  eyes(c, e.t, e.state === SHADE_STATE.drift);
  c.globalAlpha = 1;
};
