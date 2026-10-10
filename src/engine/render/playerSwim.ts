import type { Player } from '../entities/types';
import { bakedFrame, type Frame } from './artCache';
import type { Ctx } from './drawUtils';

/**
 * Poses de nado de Temayin del atlas `personajes/jugador-mecanicas.webp`
 * (`imagenes/nuevos/personajes/jugador-mecanicas.atlas.json`). Las poses de
 * cuerda y pelota del mismo atlas se usarán con sus mecánicas (AGENTS.md §5.6).
 */
export const PLAYER_MECHANICS_FILE = 'personajes/jugador-mecanicas.webp';

const SWIM_FRAMES = {
  glide: [60, 93, 439, 270],
  kick: [553, 80, 418, 274],
  stroke: [1089, 40, 381, 387],
} as const satisfies Readonly<Record<string, Frame>>;

/** Escala del atlas para que el jaguar nadando mida como el de la hoja de tierra. */
const SWIM_SCALE = 0.21;
/** Ciclos de patada por segundo mientras se avanza bajo el agua. */
const KICK_RATE = 3;

function swimFrame(p: Player): Frame {
  if (p.strokeT > 0) return SWIM_FRAMES.stroke;
  return Math.floor(p.animT * KICK_RATE) % 2 === 0 ? SWIM_FRAMES.glide : SWIM_FRAMES.kick;
}

/**
 * Dibuja la pose de nado centrada en el cuerpo del jugador. El contexto ya está
 * trasladado a (centro, base) y volteado según `face`. Devuelve `false` si el atlas
 * aún no ha cargado, para que el llamador use la hoja de tierra.
 */
export function drawSwimPose(c: Ctx, p: Player): boolean {
  const img = bakedFrame(PLAYER_MECHANICS_FILE, swimFrame(p), SWIM_SCALE);
  if (!img) return false;
  c.drawImage(img, Math.round(-img.width / 2), Math.round(-p.h / 2 - img.height / 2));
  return true;
}
