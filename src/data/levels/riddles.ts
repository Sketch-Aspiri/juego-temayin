import { GROUND } from '../../engine/constants';
import type { Op } from '../../engine/level/types';

/** Fila de las piedras de respuesta: cuelgan sobre la cabeza y se tocan saltando (pasar por debajo no cuenta). */
export const STONE_ROW = 8;
/** Separación entre piedras (bloques): deja un hueco para saltar sin rozar la vecina. */
export const STONE_SPACING = 2;

export interface RiddleLayout {
  readonly id: string;
  /** Enunciado en términos separados por espacio (ver `engine/entities/numerals.ts`). */
  readonly prompt: string;
  /** Término de la respuesta; ha de repetirse en `stones` (o valer lo mismo). */
  readonly answer: string;
  /** Columna de la estela y de la primera piedra; la puerta va tras la última piedra. */
  readonly stela: number;
  readonly firstStone: number;
  readonly stones: readonly string[];
  readonly gate: number;
}

/** Estela, piedras y puerta de jade de un acertijo de numerología maya (niveles secretos). */
export function riddle(layout: RiddleLayout): readonly Op[] {
  const { id, prompt, answer, stela, firstStone, stones, gate } = layout;
  return [
    ['riddle', stela, GROUND - 1, id, prompt, answer],
    ...stones.map((token, i): Op => ['stone', firstStone + i * STONE_SPACING, STONE_ROW, token, id]),
    ['gate', gate, id],
  ];
}
