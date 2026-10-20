import { isCorrect } from '../entities/riddles';
import type { World } from '../World';

/** Desalineación (px) entre el centro del jugador y el de la piedra que permite frenar y saltar en vertical. */
const ALIGN_TOLERANCE = 14;

/**
 * Recorrido de QA: camina bajo las piedras, se detiene debajo de la correcta del primer acertijo sin
 * resolver y salta en vertical. Solo suelta la dirección y pulsa salto; no mueve al jugador ni rodea colisiones.
 * Se llama después del conductor de avance: quien lo invoque repone la dirección en el paso siguiente.
 */
export function driveRiddles(world: World): void {
  const player = world.player;
  if (!player.onGround) return;
  const { riddles, stones } = world.level;
  const pending = riddles.find(r => !world.riddlesSolved.includes(r.id));
  const target = pending && stones.find(s => s.riddleId === pending.id && isCorrect(s, pending));
  if (!target) return;
  const offset = target.x + target.w / 2 - (player.x + player.w / 2);
  if (Math.abs(offset) > ALIGN_TOLERANCE) return;
  world.input.release('right');
  world.input.press('jump');
}
