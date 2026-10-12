import { BEACH_PROPS } from '../../data/beachProps';
import { GROUND, T, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawGameplaySprite, drawNewGameplaySprite } from './gameplaySprites';

const POST_WIDTH = 6;
const STRIPE_WIDTH = 20;
const ROOF_HEIGHT = 22;

/** Decorados sin colisión: los bloques del nivel sostienen al jugador sobre el techo. */
export function drawBeachProps(c: Ctx, world: World): void {
  if (world.def.id !== '5-1') return;
  for (const prop of BEACH_PROPS) {
    const x = prop.x * T - world.camX, y = prop.y * T, width = prop.length * T;
    if (x + width < 0 || x > VW) continue;
    c.fillStyle = '#765030';
    for (const post of [x + 12, x + width - 18]) c.fillRect(post, y, POST_WIDTH, GROUND * T - y);
    const painted = prop.kind === 'palapa'
      ? drawGameplaySprite(c, 'palapa', x, y, width, GROUND * T - y)
      : drawNewGameplaySprite(c, 'awning', x, y, width);
    if (painted) continue;
    if (prop.kind === 'palapa') {
      c.fillStyle = '#bd9654'; c.beginPath();
      c.moveTo(x - 8, y); c.lineTo(x + width / 2, y - ROOF_HEIGHT);
      c.lineTo(x + width + 8, y); c.closePath(); c.fill();
      c.strokeStyle = '#8c6835'; c.lineWidth = 2; c.beginPath();
      for (let dx = 0; dx <= width; dx += STRIPE_WIDTH) {
        c.moveTo(x + width / 2, y - ROOF_HEIGHT); c.lineTo(x + dx, y);
      }
      c.stroke();
    } else {
      for (let dx = 0; dx < width; dx += STRIPE_WIDTH) {
        c.fillStyle = dx % (STRIPE_WIDTH * 2) ? '#fff2d7' : '#ec7763';
        c.fillRect(x + dx, y, STRIPE_WIDTH, T + 8);
      }
    }
  }
}
