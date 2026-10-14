import { GAMEPLAY_SPRITES, type PlayerPoseId } from '../../data/gameplaySprites';
import { playerPoseScale } from '../../data/playerScale';
import type { Player } from '../entities/types';
import type { Ctx } from './drawUtils';
import { drawGameplaySprite } from './gameplaySprites';

const SWING_SPEED = 65;

/** La cabeza conserva su tamaño aunque el cuerpo se estire o nade horizontalmente. */
export function drawPlayerPose(c: Ctx, id: PlayerPoseId, x: number, y: number): boolean {
  const frame = GAMEPLAY_SPRITES[id].frame;
  const scale = playerPoseScale(id);
  return drawGameplaySprite(c, id, x, y, frame[2] * scale, frame[3] * scale);
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
