import { pickWeighted } from '../shared/pickWeighted';
import { type KaimanPhase, MAX_ATTACKS_WITHOUT_DIVE, NEAR_TILES } from './tuning';

/**
 * Elección del siguiente ataque del Kaimán. En lugar de un patrón fijo, sortea entre
 * los ataques de su fase con pesos que dependen de la distancia al jugador:
 *  - cerca prefiere la mordida en carrera y el coletazo;
 *  - lejos prefiere sumergirse o escupir lodo.
 * Reglas que mantienen la pelea justa:
 *  - nunca repite el ataque anterior;
 *  - tras `MAX_ATTACKS_WITHOUT_DIVE` ataques sin emboscada, se sumerge (así siempre
 *    llega una ventana para pisarle el lomo aunque el jugador no tenga fuego).
 * Función pura: el azar llega como `rng` (0..1).
 */

export type Attack = 'bite' | 'tail' | 'dive' | 'spit' | 'slam';

/** Ataques disponibles en cada fase. */
export const PHASE_ATTACKS: Readonly<Record<KaimanPhase, readonly Attack[]>> = {
  1: ['bite', 'tail', 'dive', 'spit'],
  2: ['bite', 'tail', 'dive', 'spit', 'slam'],
  3: ['bite', 'tail', 'dive', 'spit', 'slam'],
};

const NEAR_WEIGHT: Readonly<Record<Attack, number>> = { bite: 1.6, tail: 1.5, dive: 0.8, spit: 0.6, slam: 1 };
const FAR_WEIGHT: Readonly<Record<Attack, number>> = { bite: 0.9, tail: 0.8, dive: 1.5, spit: 1.6, slam: 1.2 };

export interface ChooseInput {
  readonly phase: KaimanPhase;
  readonly last: Attack | null;
  /** Ataques seguidos desde la última emboscada. */
  readonly sinceDive: number;
  /** Distancia horizontal al jugador, en bloques. */
  readonly distTiles: number;
}

export function chooseAttack(input: ChooseInput, rng: () => number): Attack {
  if (input.sinceDive >= MAX_ATTACKS_WITHOUT_DIVE && input.last !== 'dive') return 'dive';
  const table = input.distTiles < NEAR_TILES ? NEAR_WEIGHT : FAR_WEIGHT;
  return pickWeighted(PHASE_ATTACKS[input.phase], table, input.last, rng);
}
