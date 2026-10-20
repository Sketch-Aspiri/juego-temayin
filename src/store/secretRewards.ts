import { FINAL_SECRET_CACAO, FINAL_SECRET_ID, SECRET_CACAO, SECRET_LEVEL_IDS } from '../data/secretRewards';
import type { Progress } from './progress';

/** Todo se deriva del récord v3 existente: también reconoce a quienes ya completaron secretos. */
export const isSecretLevel = (levelId: string): boolean => SECRET_LEVEL_IDS.includes(levelId);

export const hasSeal = (progress: Progress, levelId: string): boolean =>
  isSecretLevel(levelId) && (progress.levels[levelId]?.completions ?? 0) > 0;

export const sealCount = (progress: Progress): number => SECRET_LEVEL_IDS.filter(id => hasSeal(progress, id)).length;

export const hasAllSeals = (progress: Progress): boolean => sealCount(progress) === SECRET_LEVEL_IDS.length;

/**
 * Cacao de la primera vez que se completa un secreto; 0 al repetirlo o en otros niveles.
 * Se evalúa con el progreso anterior a registrar la partida, así que no puede cobrarse dos veces.
 */
export function firstSecretReward(progressBefore: Progress, levelId: string): number {
  if (!isSecretLevel(levelId) || hasSeal(progressBefore, levelId)) return 0;
  return levelId === FINAL_SECRET_ID ? FINAL_SECRET_CACAO : SECRET_CACAO;
}

/** Esta partida completa el último sello que faltaba (dispara la escena final una sola vez). */
export const completesAllSeals = (before: Progress, after: Progress): boolean => !hasAllSeals(before) && hasAllSeals(after);
