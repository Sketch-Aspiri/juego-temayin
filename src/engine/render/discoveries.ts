import { VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';

/** Pluma de observación; la marca registrada permanece discreta y no vuelve a avisar. */
export function drawDiscoveries(c: Ctx, world: World): void {
  for (const mark of world.level.discoveries) {
    const x = mark.x + mark.w / 2 - world.camX;
    if (x < -mark.w || x > VW + mark.w) continue;
    const y = mark.y + mark.h / 2;
    const known = world.discoveries.includes(mark.id);
    c.save(); c.translate(x, y);
    c.fillStyle = known ? '#255b4b' : '#fff1c8';
    c.strokeStyle = known ? '#c4d9b8' : '#b87827'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(-17, -19, 34, 38, 8); c.fill(); c.stroke();
    c.fillStyle = known ? '#c4d9b8' : '#197b68';
    c.beginPath(); c.ellipse(2, -3, 6, 12, 0.55, 0, Math.PI * 2); c.fill();
    c.strokeStyle = known ? '#fff1c8' : '#214b3e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-7, 12); c.lineTo(6, -12); c.stroke();
    if (known) { c.beginPath(); c.moveTo(6, 11); c.lineTo(9, 14); c.lineTo(15, 7); c.stroke(); }
    c.restore();
  }
}
