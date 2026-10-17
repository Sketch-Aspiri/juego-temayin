import { pickWeighted } from '../shared/pickWeighted';
import { FAR_WEIGHT, type LorenPhase, MAX_ATTACKS_WITHOUT_WINDOW, MAX_CRABS, NEAR_TILES, NEAR_WEIGHT } from './tuning';

/**
 * Elección del siguiente ataque de Lorencillo, con pesos según la distancia:
 *  - cerca prefiere la estocada;
 *  - lejos prefiere cañonear o subir al mástil.
 * Reglas que mantienen la pelea justa:
 *  - nunca repite el ataque anterior;
 *  - no sube al mástil si ya hay `MAX_CRABS` cangrejos vivos;
 *  - tras `MAX_ATTACKS_WITHOUT_WINDOW` ataques sin estocada, fuerza la estocada: es la
 *    única que termina con la espalda expuesta, así siempre llega una ventana de daño.
 * Función pura: el azar llega como `rng` (0..1).
 */

export type LorenAttack = 'lunge' | 'cannon' | 'mast';

const ALL: readonly LorenAttack[] = ['lunge', 'cannon', 'mast'];
const WITHOUT_MAST: readonly LorenAttack[] = ['lunge', 'cannon'];
const LUNGE_ONLY: readonly LorenAttack[] = ['lunge'];

export interface ChooseInput {
  readonly phase: LorenPhase;
  readonly last: LorenAttack | null;
  /** Ataques seguidos desde la última estocada. */
  readonly sinceWindow: number;
  /** Distancia horizontal al jugador, en bloques. */
  readonly distTiles: number;
  readonly crabsAlive: number;
}

export function chooseAttack(input: ChooseInput, rng: () => number): LorenAttack {
  const table = input.distTiles < NEAR_TILES ? NEAR_WEIGHT : FAR_WEIGHT;
  if (input.sinceWindow >= MAX_ATTACKS_WITHOUT_WINDOW) return pickWeighted(LUNGE_ONLY, table, input.last, rng);
  const options = input.crabsAlive >= MAX_CRABS ? WITHOUT_MAST : ALL;
  return pickWeighted(options, table, input.last, rng);
}

/** Solo la estocada reinicia la cuenta de `sinceWindow`. */
export const endsWindow = (a: LorenAttack): boolean => a === 'lunge';
