import type { LevelDef, WorldDef } from '../engine/level/types';
import { LEVEL_1_1 } from './levels/world1/1-1-palenque';
import { LEVEL_1_2 } from './levels/world1/1-2-boca-del-cerro';
import { LEVEL_1_3 } from './levels/world1/1-3-tenosique';
import { LEVEL_1_4 } from './levels/world1/1-4-el-triunfo';
import { LEVEL_1_5 } from './levels/world1/1-5-candelaria';
import { LEVEL_1_6 } from './levels/world1/1-6-escarcega';
import { LEVEL_2_1 } from './levels/world2/2-1-carrillo-puerto';
import { LEVEL_2_2 } from './levels/world2/2-2-edzna';
import { LEVEL_2_3 } from './levels/world2/2-3-campeche';
import { LEVEL_2_4 } from './levels/world2/2-4-petenes';
import { LEVEL_2_5 } from './levels/world2/2-5-tenabo';
import { LEVEL_2_6 } from './levels/world2/2-6-hecelchakan';
import { LEVEL_2_7 } from './levels/world2/2-7-calkini';
import { LEVEL_4_1 } from './levels/world4/4-1-chichen-itza';
import { LEVEL_4_2 } from './levels/world4/4-2-xibalba';
import { LEVEL_3_1 } from './levels/world3/3-1-maxcanu';
import { LEVEL_3_2 } from './levels/world3/3-2-merida';
import { LEVEL_3_3 } from './levels/world3/3-3-tixkokob';
import { LEVEL_3_4 } from './levels/world3/3-4-teya';
import { LEVEL_3_5 } from './levels/world3/3-5-izamal';
import { LEVEL_4_3 } from './levels/world4/4-3-valladolid';
import { LEVEL_5_3 } from './levels/world5/5-3-playa-del-carmen';

/**
 * Campaña del Tren Maya (AGENTS.md §4.3). Un archivo por nivel en
 * `data/levels/world<N>/<id>-<estación>.ts`. Solo se registran mundos con niveles
 * (la prueba exige `levels.length > 0`); los mundos 6 y 7 llegarán después.
 * El orden del array define el desbloqueo lineal y `nextLevelId`.
 */
export const WORLDS: readonly WorldDef[] = [
  {
    id: 'selva-palenque',
    number: 1,
    name: 'Selva de Palenque',
    levels: [LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_4, LEVEL_1_5, LEVEL_1_6],
  },
  {
    id: 'golfo-campeche',
    number: 2,
    name: 'Golfo de Campeche',
    levels: [LEVEL_2_1, LEVEL_2_2, LEVEL_2_3, LEVEL_2_4, LEVEL_2_5, LEVEL_2_6, LEVEL_2_7],
  },
  {
    id: 'yucatan-haciendas', number: 3, name: 'Yucatán de las haciendas',
    levels: [LEVEL_3_1, LEVEL_3_2, LEVEL_3_3, LEVEL_3_4, LEVEL_3_5],
  },
  { id: 'cenotes-xibalba', number: 4, name: 'Cenotes y Xibalbá', levels: [LEVEL_4_1, LEVEL_4_2, LEVEL_4_3] },
  { id: 'riviera-maya', number: 5, name: 'Riviera Maya', levels: [LEVEL_5_3] },
];

export const ALL_LEVELS: readonly LevelDef[] = WORLDS.flatMap((w) => w.levels);

export const getLevel = (id: string): LevelDef | undefined => ALL_LEVELS.find((l) => l.id === id);

export function nextLevelId(id: string): string | null {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < ALL_LEVELS.length ? ALL_LEVELS[i + 1].id : null;
}
