import { STROMATOLITE_GRACE, STROMATOLITE_PENALTY } from '../constants';
import type { World } from '../World';
import { standsOn, type CrumbleSpan } from './crumble';

/**
 * Estromatolitos de Bacalar (op `['stromatolite', x, y, largo]`).
 *
 * Son seres vivos milenarios (AGENTS.md §9): pisarlos penaliza, pero nunca quita vida.
 * Viven en la cuadrícula como bloques sólidos `E` (suelo o lecho de la laguna), así la
 * física y las pruebas de coherencia los tratan como cualquier plataforma. Quien se apoya
 * sobre un tramo más de `STROMATOLITE_GRACE` segundos lo daña una sola vez.
 */

/** Carácter de bloque del estromatolito (sólido, ver `tiles.ts`). */
export const STROMATOLITE_TILE = 'E';
/** Altura (px) sobre el jugador donde aparece el aviso. */
const WARNING_RISE = 10;

export interface Stromatolite extends CrumbleSpan {
  /** Ya fue pisado de más: se dibuja con velo de daño y no vuelve a penalizar. */
  damaged: boolean;
  /** Segundos seguidos con los pies encima. */
  standT: number;
}

export const createStromatolites = (spans: readonly CrumbleSpan[]): Stromatolite[] =>
  spans.map((s) => ({ ...s, damaged: false, standT: 0 }));

function damage(world: World, s: Stromatolite): void {
  const p = world.player;
  s.damaged = true;
  world.session.score = Math.max(0, world.session.score - STROMATOLITE_PENALTY);
  // TODO(cultura): revisar el aviso con quien conozca Bacalar; el tono es de cuidado, no de castigo.
  world.popups.push({ x: p.x, y: p.y - WARNING_RISE, t: 0, txt: '¡Cuidado, estromatolito vivo!' });
  world.audio.play('hurt');
}

/** Un paso: cuenta el tiempo de apoyo de cada tramo y daña el que supere la gracia. */
export function updateStromatolites(world: World, dt: number): void {
  const p = world.player;
  for (const s of world.stromatolites) {
    if (s.damaged) continue;
    // Pies sobre el tramo: en tierra o apoyado en el lecho nadando (moveY marca onGround en ambos).
    s.standT = standsOn(p, s) ? s.standT + dt : 0;
    if (s.standT >= STROMATOLITE_GRACE) damage(world, s);
  }
}

