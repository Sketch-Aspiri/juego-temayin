import { T } from '../constants';
import type { Ctx } from './drawUtils';
import { GAMEPLAY_SPRITES } from '../../data/gameplaySprites';
import { bakedFrame } from './artCache';

/** El cañón ocupa exactamente los dos bloques sólidos que ya tenía el nivel. */
export function drawCannonTile(c: Ctx, grid: readonly (readonly string[])[], tx: number, ty: number, sx: number, sy: number, firstVisibleTx = 0): boolean {
  const row = grid[ty];
  const tile = row[tx];
  const right = tile === '>' || (tile === 'K' && row[tx + 1] === '>');
  const left = tile === '<' || (tile === 'K' && row[tx - 1] === '<');
  if (!right && !left) return false;
  const sprite = GAMEPLAY_SPRITES.cannon;
  const art = bakedFrame(sprite.file, sprite.frame, 2 * T / sprite.frame[2]);
  if (!art) return false;
  const first = right ? tile === 'K' : tile === '<';
  // Si la primera mitad quedó fuera de cámara, la segunda sigue mostrando el cañón.
  if (!first && tx !== firstVisibleTx) return true;
  const originX = sx - (first ? 0 : T);
  c.save(); c.translate(originX + (left ? 2 * T : 0), sy);
  if (left) c.scale(-1, 1);
  c.drawImage(art, 0, 0, 2 * T, T);
  c.restore();
  return true;
}

/** Cada bloque recorta su tramo de la losa completa: evita estirar una losa entera por columna. */
export function drawFragileTile(c: Ctx, sx: number, sy: number, index = 0, length = 1): boolean {
  const sprite = GAMEPLAY_SPRITES.fragile;
  const art = bakedFrame(sprite.file, sprite.frame, length * T / sprite.frame[2]);
  if (!art) return false;
  const slice = art.width / length;
  c.drawImage(art, index * slice, 0, slice, art.height, sx, sy, T, T);
  return true;
}
