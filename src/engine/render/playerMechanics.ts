import { GAMEPLAY_SPRITES, type PlayerPoseId } from '../../data/gameplaySprites';
import { PLAYER_ART_HEIGHT } from '../../data/playerSprites';
import type { Player } from '../entities/types';
import type { Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';

const SWING_SPEED = 65;

/** Cada pose conserva su proporción y comparte la altura del jugador de tierra. */
export function drawPlayerPose(c: Ctx, id: PlayerPoseId, x: number, y: number): boolean {
  const frame = GAMEPLAY_SPRITES[id].frame;
  const width = PLAYER_ART_HEIGHT * frame[2] / frame[3];
  return drawGameplaySprite(c, id, x, y, width, PLAYER_ART_HEIGHT);
}

/** El agarre coincide con la punta de la cuerda; el lanzamiento conserva el apoyo de los pies. */
export function drawPlayerMechanics(c: Ctx, p: Player): boolean {
  if (p.swinging !== null) {
    const swinging = Math.abs(p.vx) > SWING_SPEED;
    return drawPlayerPose(c, swinging ? 'swinging' : 'hanging', 0, -p.h / 2);
  }
  if (p.ball && p.throwT > 0) return drawPlayerPose(c, 'throwing', 0, 0);
  return false;
}
