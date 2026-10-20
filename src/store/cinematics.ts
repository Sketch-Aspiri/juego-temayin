import type { CinematicDef } from '../data/cinematics';
import type { Progress } from './progress';
import { hasAllSeals } from './secretRewards';

/** Se deriva del progreso existente: las partidas antiguas no necesitan nuevos campos. */
export function isCinematicUnlocked(progress: Progress, cinematic: CinematicDef): boolean {
  if (cinematic.afterAllSecrets) return hasAllSeals(progress);
  return !cinematic.afterLevel || (progress.levels[cinematic.afterLevel]?.completions ?? 0) > 0;
}
