import type { Player } from '../entities/types';
import type { Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';

const HANGING_WIDTH = 56;
const SWINGING_WIDTH = 84;
const THROWING_WIDTH = 81;
const SWING_SPEED = 65;

/** El agarre coincide con la punta de la cuerda; el lanzamiento conserva el apoyo de los pies. */
export function drawPlayerMechanics(c: Ctx, p: Player): boolean {
  if (p.swinging !== null) {
    const swinging = Math.abs(p.vx) > SWING_SPEED;
    return drawGameplaySprite(c, swinging ? 'swinging' : 'hanging', 0, -p.h / 2,
      swinging ? SWINGING_WIDTH : HANGING_WIDTH);
  }
  if (p.ball && p.throwT > 0) return drawGameplaySprite(c, 'throwing', 0, 0, THROWING_WIDTH);
  return false;
}
