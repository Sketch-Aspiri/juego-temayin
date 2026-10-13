import { MAYA_TILE_SPRITES } from '../../data/mayaTileSprites';
import { TERRAIN_SPRITES } from '../../data/terrainSprites';
import { T } from '../constants';
import { bakedFrame } from './artCache';
import type { Ctx } from './drawUtils';
import type { TexId } from './textures';

const REWARD_TILES: ReadonlySet<string> = new Set(['?', 'M', 'L', 'F', 'S', 'P']);
const COLUMN_TILES: ReadonlySet<string> = new Set(['p', 'q', 'l', 'r']);
const LIGHT_PERIOD = 450;

/** Un fondo sólido evita huecos entre las esquinas orgánicas de las baldosas pintadas. */
export function drawPaintedTerrain(c: Ctx, texture: TexId, sx: number, sy: number): boolean {
  const sprite = TERRAIN_SPRITES[texture];
  if (!sprite) return false;
  const art = bakedFrame(sprite.file, sprite.frame, T / sprite.frame[2], true);
  if (!art) return false;
  c.fillStyle = sprite.base; c.fillRect(sx, sy, T, T);
  c.drawImage(art, sx, sy, T, T);
  return true;
}

/** Cada mitad de la columna ocupa su baldosa: tampoco desaparece al salir de cámara. */
export function drawMayaTile(c: Ctx, tile: string, sx: number, sy: number): boolean {
  const sprite = spriteFor(tile);
  if (!sprite) return false;
  const column = COLUMN_TILES.has(tile);
  const art = bakedFrame(sprite.file, sprite.frame, (column ? 2 * T : T) / sprite.frame[2]);
  if (!art) return false;
  if (column) {
    const half = art.width / 2;
    const right = tile === 'q' || tile === 'r';
    c.drawImage(art, right ? half : 0, 0, half, art.height, sx, sy, T, T);
  } else c.drawImage(art, sx, sy, T, T);
  return true;
}

function spriteFor(tile: string) {
  if (REWARD_TILES.has(tile)) return MAYA_TILE_SPRITES.reward;
  if (tile === 'U') return MAYA_TILE_SPRITES.spent;
  if (tile === 'B') return MAYA_TILE_SPRITES.brick;
  if (tile === 'p' || tile === 'q') return MAYA_TILE_SPRITES.columnCap;
  if (tile === 'l' || tile === 'r') return MAYA_TILE_SPRITES.columnBody;
  return null;
}

/** Un destello pequeño en el cierre mantiene legible el dibujo y señala el premio. */
export function drawRewardLight(c: Ctx, tile: string, sx: number, sy: number, now: number): void {
  if (!REWARD_TILES.has(tile)) return;
  c.save();
  c.globalAlpha *= 0.45 + Math.sin(now / LIGHT_PERIOD + sx / T) * 0.25;
  c.fillStyle = '#ceffd6';
  c.fillRect(sx + T * 0.43, sy + T * 0.16, T * 0.14, 1.5);
  c.restore();
}
