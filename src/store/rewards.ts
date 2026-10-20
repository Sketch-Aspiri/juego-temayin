import { HANAL_REWARD } from '../data/hanalReward';
import { getWorldForLevel } from '../data/worlds';
import type { BlessingId } from '../engine/blessings';
import type { Progress } from './progress';
import { hasAllSeals } from './secretRewards';

export const hasHanalReward = (progress: Progress): boolean =>
  (progress.levels[HANAL_REWARD.levelId]?.completions ?? 0) > 0;

/**
 * Derivado del récord v3 existente: también reconoce a quienes ya lo terminaron.
 * Escudo del Amuleto de luz (Hanal Pixán) y vida extra del Corazón de jade (siete secretos).
 */
export function rewardBlessings(progress: Progress, levelId: string): readonly BlessingId[] | undefined {
  if (!getWorldForLevel(levelId)) return undefined;
  const blessings: BlessingId[] = [];
  if (hasHanalReward(progress)) blessings.push('shield');
  if (hasAllSeals(progress)) blessings.push('life');
  return blessings.length > 0 ? blessings : undefined;
}
