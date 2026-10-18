import { HANAL_PIXAN_BACKGROUND, HANAL_PIXAN_ENEMIES, HANAL_PIXAN_SPRITES } from '../../data/hanalPixanArt';
import type { SpriteRef } from '../../data/intro';
import { GROUND, T, TAU, VH, VW } from '../constants';
import type { Enemy } from '../entities/types';
import type { World } from '../World';
import { bakedFrame, lazyImage } from './artCache';
import type { Ctx } from './drawUtils';

const BACKDROP_WIDTH = VW * 1.5;
const PARALLAX = 0.12;
const FLOWER_STEP = 24;
const FLOWER_COLORS = ['#ffb52f', '#f47d24', '#ffe18b'] as const;

/** Recortes completos con apoyo común; no cambia ninguna caja de colisión. */
export function drawHanalSprite(c: Ctx, sprite: SpriteRef, x: number, y: number, height: number, flip = false): boolean {
  const image = bakedFrame(sprite.file, sprite.frame, height / sprite.frame[3]);
  if (!image) return false;
  c.save(); c.translate(Math.round(x), Math.round(y));
  if (flip) c.scale(-1, 1);
  c.drawImage(image, -image.width / 2, -image.height);
  c.restore();
  return true;
}

export function hanalPixanScenery(c: Ctx, cam: number): void {
  const image = lazyImage(HANAL_PIXAN_BACKGROUND);
  if (!image) return;
  const shift = (cam * PARALLAX) % (BACKDROP_WIDTH * 2);
  const scale = Math.max(BACKDROP_WIDTH / image.naturalWidth, VH / image.naturalHeight);
  const height = image.naturalHeight * scale;
  for (let i = -1; i < 3; i++) {
    c.save(); c.translate(i * BACKDROP_WIDTH - shift, VH - height);
    if (Math.abs(i) % 2) { c.translate(BACKDROP_WIDTH, 0); c.scale(-1, 1); }
    c.drawImage(image, 0, 0, BACKDROP_WIDTH, height); c.restore();
  }
}

export { drawHanalPlayer } from './hanalPlayer';

export function drawHanalEnemy(c: Ctx, e: Enemy, cam: number): boolean {
  const sprite = HANAL_PIXAN_ENEMIES[e.id];
  if (!sprite) return false;
  const x = e.x + e.w / 2 - cam;
  if (x < -100 || x > VW + 100) return true;
  c.save(); c.translate(x, e.y + e.h);
  if (e.flip) c.scale(1, -1);
  const bounce = Math.sin(e.t * 10) * 0.035;
  c.scale(1 + bounce, 1 - bounce);
  const height = e.id === 'bat' ? 42 : Math.max(36, e.h * 1.3);
  const drawn = drawHanalSprite(c, sprite, 0, 0, height, e.vx < 0);
  c.restore();
  return drawn;
}

/** Flores y velas decorativas sobre suelo real; nunca tapan los huecos. */
export function drawHanalDecorations(c: Ctx, world: World, now: number): void {
  if (world.def.theme !== 'hanalPixan') return;
  const start = Math.max(0, Math.floor(world.camX / FLOWER_STEP));
  for (let i = start; i * FLOWER_STEP < world.camX + VW + T; i++) {
    const wx = i * FLOWER_STEP;
    if (!world.solid(Math.floor(wx / T), GROUND)) continue;
    const x = wx - world.camX, y = GROUND * T;
    c.fillStyle = FLOWER_COLORS[i % FLOWER_COLORS.length];
    c.beginPath(); c.ellipse(x, y - 3, 8, 4, i % 3, 0, TAU); c.fill();
    if (i % 9) continue;
    c.fillStyle = '#fff1c4'; c.fillRect(x - 3, y - 20, 6, 16);
    c.fillStyle = '#ffca50'; c.beginPath();
    c.ellipse(x, y - 24, 4, 7 + Math.sin(now / 180 + i), 0, 0, TAU); c.fill();
  }
  const finishX = (world.level.templeX + 2) * T - world.camX;
  if (finishX > -100 && finishX < VW + 100) {
    drawHanalSprite(c, HANAL_PIXAN_SPRITES.temayina, finishX, GROUND * T, 100, true);
  }
}
