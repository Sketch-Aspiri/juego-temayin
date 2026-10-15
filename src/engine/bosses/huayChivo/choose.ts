import { pickWeighted } from '../shared/pickWeighted';
import { byPhase, type ChivoPhase, FAR_WEIGHT, MAX_ATTACKS_WITHOUT_CHARGE, MAX_WISPS, NEAR_TILES, NEAR_WEIGHT, WISP_COUNT } from './tuning';

/**
 * Elección del siguiente ataque del Huay Chivo. Sortea entre los ataques de su fase con
 * pesos que dependen de la distancia al jugador:
 *  - cerca prefiere embestir o pisotear;
 *  - lejos prefiere teletransportarse o invocar fuegos fatuos.
 * Reglas que mantienen la pelea justa:
 *  - nunca repite el ataque anterior;
 *  - no invoca fuegos fatuos si superaría `MAX_WISPS` vivos;
 *  - tras `MAX_ATTACKS_WITHOUT_CHARGE` ataques sin embestida ni teletransporte, elige uno
 *    de esos dos: ambos acaban con el jefe aturdido contra un borde, así que siempre llega
 *    una ventana para pisarlo aunque el jugador no tenga fuego.
 * Función pura: el azar llega como `rng` (0..1).
 */

export type ChivoAttack = 'charge' | 'blink' | 'stomp' | 'wisps' | 'horns';

/** Ataques disponibles en cada fase: el pisotón llega con la noche. */
export const PHASE_ATTACKS: Readonly<Record<ChivoPhase, readonly ChivoAttack[]>> = {
  1: ['charge', 'blink', 'wisps'],
  2: ['charge', 'blink', 'stomp', 'wisps', 'horns'],
  3: ['charge', 'blink', 'stomp', 'wisps', 'horns'],
};
const WITHOUT_WISPS: Readonly<Record<ChivoPhase, readonly ChivoAttack[]>> = {
  1: PHASE_ATTACKS[1].filter((a) => a !== 'wisps'),
  2: PHASE_ATTACKS[2].filter((a) => a !== 'wisps'),
  3: PHASE_ATTACKS[3].filter((a) => a !== 'wisps'),
};
/** Ataques que terminan con el jefe aturdido. */
const DAZING: readonly ChivoAttack[] = ['charge', 'blink'];


export interface ChooseInput {
  readonly phase: ChivoPhase;
  readonly last: ChivoAttack | null;
  /** Ataques seguidos desde la última embestida o teletransporte. */
  readonly sinceCharge: number;
  /** Distancia horizontal al jugador, en bloques. */
  readonly distTiles: number;
  /** Fuegos fatuos vivos ahora mismo. */
  readonly wispsAlive: number;
}

export function chooseAttack(input: ChooseInput, rng: () => number): ChivoAttack {
  const table = input.distTiles < NEAR_TILES ? NEAR_WEIGHT : FAR_WEIGHT;
  if (input.sinceCharge >= MAX_ATTACKS_WITHOUT_CHARGE) return pickWeighted(DAZING, table, input.last, rng);
  const full = input.wispsAlive + byPhase(WISP_COUNT, input.phase) > MAX_WISPS;
  const options = full ? WITHOUT_WISPS[input.phase] : PHASE_ATTACKS[input.phase];
  return pickWeighted(options, table, input.last, rng);
}

/** Ataques que reinician la cuenta de `sinceCharge`. */
export const endsDazed = (a: ChivoAttack): boolean => DAZING.includes(a);
