import type { Assets } from '../assets';
import { isReady } from '../assets';
import { VW } from '../constants';
import { outlined, star } from '../render/drawUtils';
import type { Puas } from './puas';

/** Tamaño de cada fotograma de la hoja de sprites del jefe. */
const FRAME_W = 240;
const FRAME_H = 190;
const FRAME = { idle: 0, walk: 1, run: 2, ball: 3, dead: 4 } as const;
const SCALE = 0.85;

export function drawPuas(c: CanvasRenderingContext2D, assets: Assets, b: Puas, camX: number): void {
  if (b.st === 'gone' || !isReady(assets.boss)) return;
  const x = b.x + b.w / 2 - camX;
  const y = b.y + b.h;
  if (x < -200 || x > VW + 200) return;
  if (b.st === 'hurt' && Math.floor(b.t * 14) % 2 === 0) return;

  let fr: number = FRAME.idle;
  if (b.st === 'walk') fr = Math.floor(b.t * 6) % 2 ? FRAME.walk : FRAME.idle;
  else if (b.st === 'charge') fr = Math.floor(b.t * 10) % 2 ? FRAME.run : FRAME.walk;
  else if (b.st === 'roll') fr = FRAME.ball;
  else if (b.st === 'dead') fr = FRAME.dead;

  c.save();
  c.translate(x, y);
  if (b.st === 'prep' || b.st === 'spikes') c.translate(Math.sin(b.t * 70) * 4, 0);
  if (b.face < 0) c.scale(-1, 1);
  if (b.st === 'dead') c.globalAlpha = Math.max(0, Math.min(1, (2.5 - b.t) * 2));
  if (fr === FRAME.ball) {
    c.translate(0, -70);
    c.rotate(b.spin);
    c.drawImage(assets.boss, fr * FRAME_W, 0, FRAME_W, FRAME_H, (-FRAME_W * SCALE) / 2, (-FRAME_H * SCALE) / 2 - 10, FRAME_W * SCALE, FRAME_H * SCALE);
  } else {
    c.drawImage(assets.boss, fr * FRAME_W, 0, FRAME_W, FRAME_H, (-FRAME_W * SCALE) / 2, -188 * SCALE, FRAME_W * SCALE, FRAME_H * SCALE);
  }
  c.restore();

  // Estrellas de mareo.
  if (b.st === 'dazed') {
    for (let i = 0; i < 3; i++) {
      const a = b.t * 5 + i * 2.1;
      star(c, x + Math.cos(a) * 45, b.y - 18 + Math.sin(a) * 10, 9);
    }
  }
  if (b.st === 'prep') {
    c.font = 'bold 40px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    outlined(c, '!', x, b.y - 30, '#ff5e5b', 6);
  }
}
