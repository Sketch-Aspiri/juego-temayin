import type { EnemyId } from '../../types';
import { STALACTITE } from './stalactite';
import { SCORPION } from './scorpion';
import { ANTS } from './ants';
import { BARRACUDA } from './barracuda';
import { BAT } from './bat';
import { BLUE_CRAB } from './blueCrab';
import { COATI } from './coati';
import { HOWLER } from './howler';
import { NAUYACA } from './nauyaca';
import { TARANTULA } from './tarantula';
import { URCHIN } from './urchin';
import { SHADE } from './shade';
import { ALUX } from './alux';
import { MORAY } from './moray';
import { PIRATE_CRAB } from './pirateCrab';
import { WHEEL } from './wheel';
import { AXOLOTL } from './axolotl';
import type { Enemy } from '../types';
import type { EnemyDef } from './types';
import { XTABAY } from './xtabay';

/**
 * Registro de enemigos. Para añadir uno nuevo: crear `enemies/<id>.ts` con su
 * `EnemyDef`, añadir su id a `EnemyId`, registrarlo aquí y dibujarlo en
 * `render/enemies/` (registro `ENEMY_SPRITES`).
 */
export const ENEMIES: Readonly<Record<EnemyId, EnemyDef>> = {
  stalactite: STALACTITE,
  scorpion: SCORPION,
  coati: COATI,
  urchin: URCHIN,
  bat: BAT,
  xtabay: XTABAY,
  howler: HOWLER,
  tarantula: TARANTULA,
  nauyaca: NAUYACA,
  ants: ANTS,
  blueCrab: BLUE_CRAB,
  barracuda: BARRACUDA,
  shade: SHADE,
  alux: ALUX,
  pirateCrab: PIRATE_CRAB,
  moray: MORAY,
  wheel: WHEEL,
  axolotl: AXOLOTL,
};

/** El enemigo no necesita suelo debajo (vuela o nada). */
export const isAirborne = (id: EnemyId): boolean => ENEMIES[id].flying || !!ENEMIES[id].swimming;

/** El enemigo puede tocar y ser tocado ahora mismo (ver `EnemyDef.tangible`). */
export const isTangible = (e: Enemy): boolean => ENEMIES[e.id].tangible?.(e) ?? true;
