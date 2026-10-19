import { SCENERY_SPRITES, type ScenerySpriteId } from '../../data/scenerySprites';
import { T, TAU, VW } from '../constants';
import type { World } from '../World';
import { bakedFrame } from './artCache';
import { drawAtriumTorch } from './chivoEffects';
import type { Ctx } from './drawUtils';

const TORCH_WIDTH = 42;
const TORCH_GLOW_RADIUS = 30;
const FLICKER_PERIOD = 130;

/** Mantiene escala uniforme y ancla; el recorte y escalado se reutilizan desde artCache. */
export function drawScenerySprite(c: Ctx, id: ScenerySpriteId, x: number, y: number, width: number): boolean {
  const sprite = SCENERY_SPRITES[id];
  const scale = width / sprite.frame[2];
  const art = bakedFrame(sprite.file, sprite.frame, scale);
  if (!art) return false;
  c.drawImage(art, Math.round(x - width * sprite.anchor[0]), Math.round(y - sprite.frame[3] * scale * sprite.anchor[1]));
  return true;
}

/** La llama queda exactamente sobre la fuente de luz usada por la máscara y las sombras. */
export function drawTorches(c: Ctx, world: World, now: number): void {
  // Las mechas de la cámara inferior aún están bajo el suelo de la cima.
  if (world.boss?.id === 'camazotz' && world.boss.stage !== 2) return;
  for (const light of world.torches) {
    const x = light.x - world.camX;
    if (x < -TORCH_WIDTH || x > VW + TORCH_WIDTH) continue;
    c.save();
    const pulse = Math.sin(now / FLICKER_PERIOD + light.x);
    if (light.lit) {
      c.fillStyle = `rgba(255,199,77,${0.13 + pulse * 0.03})`;
      c.beginPath(); c.arc(x, light.y, TORCH_GLOW_RADIUS, 0, TAU); c.fill();
    }
    const atrium = world.def.boss?.id === 'huayChivo';
    const painted = atrium ? drawAtriumTorch(c, light.lit, x, light.y)
      : light.lit && drawScenerySprite(c, 'torch', x, light.y, TORCH_WIDTH);
    if (!painted) {
      c.fillStyle = '#835b35'; c.fillRect(x - 4, light.y, 8, 24);
      if (light.lit) {
        c.fillStyle = '#ffcd5c'; c.beginPath(); c.ellipse(x, light.y, 6, 12 + pulse, 0, 0, TAU); c.fill();
      }
    }
    c.restore();
  }
}

export interface ArenaPlatformArt {
  readonly tx: number;
  readonly ty: number;
  readonly length: number;
  readonly image: HTMLCanvasElement;
}

/** Troncos sobre la misma caja de colisión: solo las plataformas horizontales de estas arenas. */
export function arenaPlatformArt(world: World): readonly ArenaPlatformArt[] {
  const boss = world.def.boss;
  if (!boss || (boss.id !== 'kaiman' && boss.id !== 'huayPek')) return [];
  const result: ArenaPlatformArt[] = [];
  const sprite = SCENERY_SPRITES.log;
  for (const op of world.def.ops) {
    if (op[0] !== 'plat') continue;
    const [, tx, ty, length] = op;
    if (tx < boss.arena[0] || tx + length - 1 > boss.arena[1]) continue;
    if ((tx + length) * T < world.camX || tx * T > world.camX + VW) continue;
    const image = bakedFrame(sprite.file, sprite.frame, length * T / sprite.frame[2]);
    if (image) result.push({ tx, ty, length, image });
  }
  return result;
}

export function drawArenaPlatforms(c: Ctx, platforms: readonly ArenaPlatformArt[], camX: number): void {
  for (const p of platforms) c.drawImage(p.image, Math.round(p.tx * T - camX), p.ty * T, p.length * T, T);
}
