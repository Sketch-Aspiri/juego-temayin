import type { PlayerPoseId } from '../../data/gameplaySprites';
import type { Player } from '../entities/types';
import type { Ctx } from './drawUtils';
import { drawPlayerPose } from './playerMechanics';

/**
 * Poses de nado de Temayin del atlas `personajes/jugador-mecanicas.webp`
 * (`data/gameplaySprites.ts`). Las poses de cuerda y pelota del mismo atlas
 * comparten tamaño y dibujo desde `playerMechanics.ts`.
 */

/** Ciclos de patada por segundo mientras se avanza bajo el agua. */
const KICK_RATE = 3;

function swimPose(p: Player): PlayerPoseId {
  if (p.strokeT > 0) return 'swimStroke';
  return Math.floor(p.animT * KICK_RATE) % 2 === 0 ? 'swimGlide' : 'swimKick';
}

/**
 * Dibuja la pose de nado centrada en el cuerpo del jugador. El contexto ya está
 * trasladado a (centro, base) y volteado según `face`. Devuelve `false` si el atlas
 * aún no ha cargado, para que el llamador use la hoja de tierra.
 */
export function drawSwimPose(c: Ctx, p: Player): boolean {
  return drawPlayerPose(c, swimPose(p), 0, -p.h / 2);
}
