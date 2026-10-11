import { GROUND, T, TAU } from '../../constants';
import { drawLazyFrame, footFrame } from '../../render/enemies/atlas';
import { outlined, type Ctx } from '../../render/drawUtils';
import type { Sargazo, SargazoState } from './index';
import { ART_SCALE, isolatedArt } from './art';

const SHEET = 'bosses/sargazo.webp';
const ART = {
  rest: footFrame(15, 69, 499, 447), walk: footFrame(536, 76, 487, 448),
  throw: footFrame(1036, 13, 490, 510), warn: footFrame(12, 577, 505, 383),
  core: footFrame(531, 542, 491, 422), dead: footFrame(1007, 691, 523, 290),
};
const FRAMES: Readonly<Record<SargazoState, typeof ART.rest>> = {
  sleep: ART.rest, intro: ART.rest, idle: ART.walk, warn: ART.warn,
  attack: ART.throw, exposed: ART.core, hurt: ART.core, shed: ART.warn, dead: ART.dead, gone: ART.dead,
};

export function drawSargazo(c: Ctx, b: Sargazo, camX: number): void {
  if (b.st === 'gone') return;
  const x = b.x + b.w / 2 - camX;
  c.save(); c.translate(x, b.y + b.h);
  if (b.st === 'hurt' && Math.floor(b.t * 14) % 2 === 0) c.globalAlpha = 0.4;
  if (!drawBody(c, b.st)) {
    c.fillStyle = '#84712e'; c.beginPath(); c.ellipse(0, -b.h / 2, b.w / 2, b.h / 2, 0, 0, TAU); c.fill();
    c.fillStyle = b.hittable ? '#74efee' : '#3e5932'; c.fillRect(-18, -70, 36, 36);
  }
  c.restore();
  if (b.hittable || b.st === 'warn') {
    c.font = 'bold 22px "Trebuchet MS", sans-serif'; c.textAlign = 'center';
    const label = b.hittable ? '¡NÚCLEO!' : b.attack === 'wave' ? '¡SALTA LA OLA!' : b.attack === 'dive' ? '¡TORTUGAS AL AGUA!' : '¡ALGAS!';
    outlined(c, label, x, b.y - 24, b.hittable ? '#8af9ea' : '#ffd23f', 4);
  }
  c.fillStyle = '#948032'; c.strokeStyle = '#d7b657'; c.lineWidth = 3;
  for (const ball of b.balls) {
    c.beginPath(); c.arc(ball.x - camX, ball.y, 12, 0, TAU); c.fill(); c.stroke();
  }
  if (b.waveX !== null) {
    c.beginPath(); c.ellipse(b.waveX - camX, GROUND * T, 24, 42, 0, Math.PI, TAU); c.fill(); c.stroke();
  }
}

function drawBody(c: Ctx, state: SargazoState): boolean {
  const f = FRAMES[state];
  if (state !== 'exposed' && state !== 'hurt' && state !== 'dead') return drawLazyFrame(c, SHEET, f, ART_SCALE);
  const art = isolatedArt([f.x, f.y, f.w, f.h]);
  if (!art) return false;
  c.drawImage(art, Math.round(-f.w / 2 * ART_SCALE), Math.round(-f.h * ART_SCALE));
  return true;
}
