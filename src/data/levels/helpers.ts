import type { Op } from '../../engine/level/types';
import type { EnemyId } from '../../engine/types';

const spawnMany =
  (id: EnemyId) =>
  (...xs: number[]): Op[] =>
    xs.map((x) => ['spawn', id, x] as const);

const spawnAt =
  (id: EnemyId) =>
  (...pairs: Array<readonly [number, number]>): Op[] =>
    pairs.map(([x, y]) => ['spawn', id, x, y] as const);

/** Atajos para colocar varios enemigos sobre el suelo: ...coati(22, 32, 41). */
export const coati = spawnMany('coati');
export const urchin = spawnMany('urchin');
export const howler = spawnMany('howler');
export const tarantula = spawnMany('tarantula');
export const nauyaca = spawnMany('nauyaca');
export const ants = spawnMany('ants');
export const blueCrab = spawnMany('blueCrab');
export const alux = spawnMany('alux');
export const pirateCrab = spawnMany('pirateCrab');
export const wheel = spawnMany('wheel');

/** Murciélagos: pares [x, fila]. */
export const bats = spawnAt('bat');
/** Barracudas (nadan, no necesitan suelo): pares [x, fila] dentro de una zona de agua. */
export const barracudas = spawnAt('barracuda');
/** Sombras de Xibalbá (flotan, no necesitan suelo): pares [x, fila]. */
export const shades = spawnAt('shade');
/** Morenas: pares [x, fila] en un bloque de agua junto a la pared o el fondo donde está su grieta. */
export const morays = spawnAt('moray');
/** Ajolotes fantasma (nadan dentro de su zona de agua): pares [x, fila]. */
export const axolotls = spawnAt('axolotl');
