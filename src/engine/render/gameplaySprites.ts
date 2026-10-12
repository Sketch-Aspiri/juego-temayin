import { GAMEPLAY_SPRITES, type GameplaySprite, type GameplaySpriteId } from '../../data/gameplaySprites';
import { NEW_GAMEPLAY_SPRITES, type NewGameplaySpriteId } from '../../data/newGameplaySprites';
import { bakedFrame } from './artCache';
import type { Ctx } from './drawUtils';

/** Escala el recorte una sola vez; el ancla permanece en la posición física recibida. */
export function drawSprite(c: Ctx, sprite: GameplaySprite, x: number, y: number, width: number, height?: number): boolean {
  const art = bakedFrame(sprite.file, sprite.frame, width / sprite.frame[2]);
  if (!art) return false;
  const h = height ?? sprite.frame[3] * width / sprite.frame[2];
  c.drawImage(art, x - width * sprite.anchor[0], y - h * sprite.anchor[1], width, h);
  return true;
}

export function drawGameplaySprite(c: Ctx, id: GameplaySpriteId, x: number, y: number, width: number, height?: number): boolean {
  return drawSprite(c, GAMEPLAY_SPRITES[id], x, y, width, height);
}

export function drawNewGameplaySprite(c: Ctx, id: NewGameplaySpriteId, x: number, y: number, width: number, height?: number): boolean {
  return drawSprite(c, NEW_GAMEPLAY_SPRITES[id], x, y, width, height);
}
