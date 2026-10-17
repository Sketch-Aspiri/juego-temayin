import { T, TAU, VW } from '../constants';
import type { World } from '../World';
import type { GameplaySpriteId } from '../../data/gameplaySprites';
import { hash, type Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';

/**
 * Luciérnagas (op `firefly`): cuadros «luz 1-4» de `mecanicas/efectos.webp` que parpadean
 * y flotan unos píxeles alrededor de su bloque. Sin imagen, se dibuja un punto luminoso.
 * La luz que proyectan sobre la oscuridad la resuelve `lighting.ts`, no este módulo.
 */

const FRAMES: readonly GameplaySpriteId[] = ['firefly1', 'firefly2', 'firefly3', 'firefly4'];
const SPRITE_W = 34;
const BLINK_RATE = 5;
const BOB_X = 6;
const BOB_Y = 5;
const BOB_RATE = 1.3;
const DOT_RADIUS = 3;
const DOT_GLOW = 9;

export function drawFireflies(c: Ctx, world: World, now: number): void {
  const t = now / 1000;
  for (let i = 0; i < world.level.fireflies.length; i++) {
    const f = world.level.fireflies[i];
    const sx = f.x - world.camX;
    if (sx < -T || sx > VW + T) continue;
    const seed = i * 13.7;
    const x = sx + Math.sin(t * BOB_RATE + seed) * BOB_X;
    const y = f.y + Math.cos(t * BOB_RATE * 0.8 + seed) * BOB_Y;
    const phase = Math.floor(t * BLINK_RATE + hash(seed) * FRAMES.length);
    if (drawGameplaySprite(c, FRAMES[phase % FRAMES.length], x, y, SPRITE_W)) continue;
    c.fillStyle = 'rgba(255, 244, 150, 0.35)';
    c.beginPath();
    c.arc(x, y, DOT_GLOW, 0, TAU);
    c.fill();
    c.fillStyle = '#fff6a8';
    c.beginPath();
    c.arc(x, y, DOT_RADIUS, 0, TAU);
    c.fill();
  }
}
