import { ROWS, T, VW } from '../constants';
import { CRUMBLE_SHAKE_TIME, type Crumble } from '../entities/crumble';
import type { Ctx } from './drawUtils';

/** Amplitud máxima del temblor (px) justo antes de caer. */
const SHAKE_AMPLITUDE = 3;
/** Frecuencia del temblor (rad/ms). */
const SHAKE_FREQUENCY = 0.09;
/** Distancia de caída (px) en la que los bloques terminan de desvanecerse. */
const FADE_DISTANCE = 3 * T;

/** Desplazamiento horizontal (px) de un bloque de escombro que tiembla; 0 si no tiembla. */
export function crumbleShakeAt(crumbles: readonly Crumble[], tx: number, ty: number, now: number): number {
  for (const c of crumbles) {
    if (c.state !== 'shaking' || ty !== c.y || tx < c.x || tx >= c.x + c.len) continue;
    const k = 1 - Math.max(0, c.timer) / CRUMBLE_SHAKE_TIME;
    return Math.sin(now * SHAKE_FREQUENCY + tx) * SHAKE_AMPLITUDE * (0.4 + 0.6 * k);
  }
  return 0;
}

/** Dibuja los bloques de escombro que van cayendo, desvaneciéndose. */
export function drawFallingCrumbles(c: Ctx, crumbles: readonly Crumble[], camX: number, tex: HTMLCanvasElement): void {
  for (const cr of crumbles) {
    if (cr.state !== 'falling' || cr.fallY > FADE_DISTANCE) continue;
    const y = cr.y * T + cr.fallY;
    if (y > ROWS * T) continue;
    c.globalAlpha = Math.max(0, 1 - cr.fallY / FADE_DISTANCE);
    for (let i = 0; i < cr.len; i++) {
      const sx = Math.round((cr.x + i) * T - camX);
      if (sx < -T || sx > VW) continue;
      c.drawImage(tex, sx, y);
    }
  }
  c.globalAlpha = 1;
}
