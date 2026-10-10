import type { EnemyId } from '../../types';
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
import type { EnemyDef } from './types';

/**
 * Registro de enemigos. Para añadir uno nuevo: crear `enemies/<id>.ts` con su
 * `EnemyDef`, añadir su id a `EnemyId`, registrarlo aquí y dibujarlo en
 * `render/enemies/` (registro `ENEMY_SPRITES`).
 */
export const ENEMIES: Readonly<Record<EnemyId, EnemyDef>> = {
  coati: COATI,
  urchin: URCHIN,
  bat: BAT,
  howler: HOWLER,
  tarantula: TARANTULA,
  nauyaca: NAUYACA,
  ants: ANTS,
  blueCrab: BLUE_CRAB,
  barracuda: BARRACUDA,
  shade: SHADE,
  alux: ALUX,
};

/** El enemigo no necesita suelo debajo (vuela o nada). */
export const isAirborne = (id: EnemyId): boolean => ENEMIES[id].flying || !!ENEMIES[id].swimming;
