import type { Session } from './types';

export type Stars = 1 | 2 | 3;

export interface LevelResult {
  levelId: string;
  /** Puntos ganados solo en este nivel. */
  score: number;
  stars: Stars;
  /** Fracción (0..1) de las monedas del nivel recogidas. */
  coinRatio: number;
  deaths: number;
  /** Estado de la partida al terminar, para encadenar con el siguiente nivel. */
  session: Session;
}

const TWO_STARS_RATIO = 0.6;
const THREE_STARS_RATIO = 0.9;

/**
 * 1 estrella por completar el nivel; las demás exigen no morir
 * y recoger ≥60 % / ≥90 % de las monedas.
 */
export function computeStars(coinRatio: number, deaths: number): Stars {
  if (deaths > 0) return 1;
  if (coinRatio >= THREE_STARS_RATIO) return 3;
  if (coinRatio >= TWO_STARS_RATIO) return 2;
  return 1;
}

export function coinRatio(collected: number, total: number): number {
  if (total <= 0) return 1;
  return Math.min(1, collected / total);
}
