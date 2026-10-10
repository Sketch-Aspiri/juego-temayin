import { VH, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';

const DROPS = 72;
const FALL_SPEED = 0.6;
const DROP_LENGTH = 17;

/** Lluvia determinista de la selva chiclera, sin partículas de simulación. */
export function drawWeather(c: Ctx, world: World, now: number): void {
  if (world.def.weather !== 'rain') return;
  c.save(); c.strokeStyle = 'rgba(192,222,232,.4)'; c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i < DROPS; i++) {
    const y = (i * 113 + now * FALL_SPEED) % (VH + DROP_LENGTH);
    const x = ((i * 157 - y * 0.25 - world.camX * 0.12) % VW + VW) % VW;
    c.moveTo(x, y); c.lineTo(x - 4, y + DROP_LENGTH);
  }
  c.stroke(); c.restore();
}
