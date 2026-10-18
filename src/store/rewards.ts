import { HANAL_REWARD } from '../data/hanalReward';
import { getWorldForLevel } from '../data/worlds';
import type { BlessingId } from '../engine/blessings';
import type { Progress } from './progress';

export const hasHanalReward = (progress: Progress): boolean =>
  (progress.levels[HANAL_REWARD.levelId]?.completions ?? 0) > 0;

/** Derivado del récord v3 existente: también reconoce a quienes ya lo terminaron. */
export function rewardBlessings(progress: Progress, levelId: string): readonly BlessingId[] | undefined {
  return hasHanalReward(progress) && getWorldForLevel(levelId) ? ['shield'] : undefined;
}
