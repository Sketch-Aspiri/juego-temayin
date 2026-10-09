import type { LevelDef, WorldDef } from '../engine/level/types';
import { LEVEL_1_1, LEVEL_1_2, LEVEL_1_3 } from './levels/world1';
import { LEVEL_2_1, LEVEL_2_2 } from './levels/world2';

/**
 * Campaña completa. Para añadir niveles: crear su `LevelDef` en `data/levels/`
 * y añadirlo (o un mundo nuevo) aquí. La progresión y el selector se actualizan solos.
 */
export const WORLDS: readonly WorldDef[] = [
  { id: 'selva', number: 1, name: 'Selva y Costa', levels: [LEVEL_1_1, LEVEL_1_2, LEVEL_1_3] },
  { id: 'cenote', number: 2, name: 'Cenotes', levels: [LEVEL_2_1, LEVEL_2_2] },
];

export const ALL_LEVELS: readonly LevelDef[] = WORLDS.flatMap((w) => w.levels);

export const getLevel = (id: string): LevelDef | undefined => ALL_LEVELS.find((l) => l.id === id);

export function nextLevelId(id: string): string | null {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < ALL_LEVELS.length ? ALL_LEVELS[i + 1].id : null;
}
