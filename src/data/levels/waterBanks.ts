import { GROUND, ROWS } from '../../engine/constants';
import type { Op } from '../../engine/level/types';

/** Máximo desnivel por peldaño: accesible con el salto normal y con la salida del agua. */
const BANK_STEP_HEIGHT = 2;

/**
 * Orilla maciza junto al agua: la columna x llega a la superficie y la ladera
 * desciende hacia tierra. `waterDirection` indica en qué lado queda el agua.
 * Usa suelo del bioma, no plataformas suspendidas ni bloques que se puedan romper.
 */
export function waterBank(x: number, surface: number, waterDirection: 1 | -1): Op[] {
  const ops: Op[] = [];
  const top = Math.floor(surface);
  for (let step = 0; top + step * BANK_STEP_HEIGHT < GROUND; step++) {
    const tx = x - step * waterDirection;
    for (let y = top + step * BANK_STEP_HEIGHT; y < ROWS; y++) ops.push(['row', tx, y, 'G']);
  }
  return ops;
}
