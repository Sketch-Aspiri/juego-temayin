import type { LevelDef, WorldDef } from '../engine/level/types';
import { HANAL_PIXAN_LEVEL } from './levels/seasonal/hanal-pixan';
import { BONUS_1 } from './levels/world1/1-extra-dosel';
import { BONUS_2 } from './levels/world2/2-extra-camara';
import { BONUS_3 } from './levels/world3/3-extra-patio';
import { BONUS_4 } from './levels/world4/4-extra-cenote';
import { BONUS_5 } from './levels/world5/5-extra-caleta';
import { BONUS_6 } from './levels/world6/6-extra-vagon';
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
import { LEVEL_3_1 } from './levels/world3/3-1-maxcanu';
import { LEVEL_3_2 } from './levels/world3/3-2-merida';
import { LEVEL_3_3 } from './levels/world3/3-3-tixkokob';
import { LEVEL_3_4 } from './levels/world3/3-4-teya';
import { LEVEL_3_5 } from './levels/world3/3-5-izamal';
import { LEVEL_4_1 } from './levels/world4/4-1-chichen-itza';
import { LEVEL_4_2 } from './levels/world4/4-2-xibalba';
import { LEVEL_4_3 } from './levels/world4/4-3-valladolid';
import { LEVEL_4_4 } from './levels/world4/4-4-leona-vicario';
import { LEVEL_4_5 } from './levels/world4/4-5-nuevo-xcan';
import { LEVEL_5_1 } from './levels/world5/5-1-cancun';
import { LEVEL_5_2 } from './levels/world5/5-2-puerto-morelos';
import { LEVEL_5_3 } from './levels/world5/5-3-playa-del-carmen';
import { LEVEL_5_4 } from './levels/world5/5-4-xcaret';
import { LEVEL_5_5 } from './levels/world5/5-5-puerto-aventuras';
import { LEVEL_5_6 } from './levels/world5/5-6-akumal';
import { LEVEL_6_1 } from './levels/world6/6-1-tulum';
import { LEVEL_6_2 } from './levels/world6/6-2-tulum-aeropuerto';
import { LEVEL_6_3 } from './levels/world6/6-3-felipe-carrillo-puerto';
import { LEVEL_6_4 } from './levels/world6/6-4-limones';
import { LEVEL_6_5 } from './levels/world6/6-5-bacalar';
import { LEVEL_6_6 } from './levels/world6/6-6-chetumal';

/**
 * Campaña del Tren Maya (AGENTS.md §4.3). Un archivo por nivel en
 * `data/levels/world<N>/<id>-<estación>.ts`. Solo se registran mundos con niveles
 * (la prueba exige `levels.length > 0`). El Mundo 6 registra 6-1 a 6-6 (Chetumal, con el jefe
 * Lorencillo, lo cierra); el Mundo 7 llegará después.
 * El orden del array define el desbloqueo lineal y `nextLevelId`.
 */
export const WORLDS: readonly WorldDef[] = [
  {
    id: 'selva-palenque',
    number: 1,
    name: 'Selva de Palenque',
    bonus: BONUS_1,
    levels: [LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_4, LEVEL_1_5, LEVEL_1_6],
  },
  {
    id: 'golfo-campeche',
    number: 2,
    name: 'Golfo de Campeche',
    bonus: BONUS_2,
    levels: [LEVEL_2_1, LEVEL_2_2, LEVEL_2_3, LEVEL_2_4, LEVEL_2_5, LEVEL_2_6, LEVEL_2_7],
  },
  {
    id: 'yucatan-haciendas', number: 3, name: 'Yucatán de las haciendas',
    bonus: BONUS_3,
    levels: [LEVEL_3_1, LEVEL_3_2, LEVEL_3_3, LEVEL_3_4, LEVEL_3_5],
  },
  { id: 'cenotes-xibalba', number: 4, name: 'Cenotes y Xibalbá', bonus: BONUS_4, levels: [LEVEL_4_1, LEVEL_4_2, LEVEL_4_3, LEVEL_4_4, LEVEL_4_5] },
  { id: 'riviera-maya', number: 5, name: 'Riviera Maya', bonus: BONUS_5, levels: [LEVEL_5_1, LEVEL_5_2, LEVEL_5_3, LEVEL_5_4, LEVEL_5_5, LEVEL_5_6] },
  {
    id: 'costa-maya-bacalar', number: 6, name: 'Costa Maya y Bacalar',
    bonus: BONUS_6,
    levels: [LEVEL_6_1, LEVEL_6_2, LEVEL_6_3, LEVEL_6_4, LEVEL_6_5, LEVEL_6_6],
  },
];

export const ALL_LEVELS: readonly LevelDef[] = WORLDS.flatMap((w) => w.levels);

export const BONUS_LEVELS: readonly LevelDef[] = WORLDS.flatMap(w => w.bonus ? [w.bonus] : []);
/** Especiales de acceso libre, mostrados antes de la campaña sin cambiar sus desbloqueos. */
export const SEASONAL_LEVELS: readonly LevelDef[] = [HANAL_PIXAN_LEVEL];
export const isSeasonalLevel = (id: string): boolean => SEASONAL_LEVELS.some(level => level.id === id);
/** Incluye los desvíos para búsqueda y validación; ALL_LEVELS conserva el orden publicado. */
export const PLAYABLE_LEVELS: readonly LevelDef[] = [...SEASONAL_LEVELS, ...ALL_LEVELS, ...BONUS_LEVELS];
export const getLevel = (id: string): LevelDef | undefined => PLAYABLE_LEVELS.find(l => l.id === id);
export const getWorldForLevel = (id: string): WorldDef | undefined =>
  WORLDS.find(w => w.bonus?.id === id || w.levels.some(l => l.id === id));

export function nextLevelId(id: string): string | null {
  if (isSeasonalLevel(id)) return ALL_LEVELS[0]?.id ?? null;
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < ALL_LEVELS.length ? ALL_LEVELS[i + 1].id : null;
}
