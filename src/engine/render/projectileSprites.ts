import type { Fireball, Quill } from '../entities/types';
import { bakedFrame, type Frame } from './artCache';
import type { Ctx } from './drawUtils';
import { drawNewGameplaySprite } from './gameplaySprites';

const FIRE_FRAMES: readonly Frame[] = [
  [53, 137, 239, 148], [384, 128, 293, 156], [728, 133, 333, 153], [1107, 120, 315, 168],
];
const FIRE_SCALE = 0.13;
const FIRE_RATE = 12;
const FIRE_CORE_X = 0.8;
const QUILL_WIDTH = 28;
const QUILL_HEIGHT = 8;
const FRUIT_WIDTH = 19;

/** La cabeza brillante sigue el centro de impacto; la estela queda detrás de la velocidad. */
export function drawFireballArt(c: Ctx, f: Fireball, camX: number): boolean {
  const frame = FIRE_FRAMES[Math.floor(f.t * FIRE_RATE) % FIRE_FRAMES.length];
  const art = bakedFrame('mecanicas/efectos.webp', frame, FIRE_SCALE);
  if (!art) return false;
  c.save();
  c.translate(f.x - camX, f.y);
  c.rotate(Math.atan2(f.vy, f.vx));
  c.drawImage(art, -art.width * FIRE_CORE_X, -art.height / 2);
  c.restore();
  return true;
}

/** Púa orientada por su trayectoria; el zapote conserva la hoja hacia arriba. */
export function drawQuillArt(c: Ctx, q: Quill, camX: number): boolean {
  if (q.kind === 'fruit') return drawNewGameplaySprite(c, 'fruit', q.x - camX, q.y, FRUIT_WIDTH);
  c.save();
  c.translate(q.x - camX, q.y);
  c.rotate(Math.atan2(q.vy, q.vx));
  const drawn = drawNewGameplaySprite(c, 'quill', 0, 0, QUILL_WIDTH, QUILL_HEIGHT);
  c.restore();
  return drawn;
}
