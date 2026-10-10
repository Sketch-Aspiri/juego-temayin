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
export const wheel = spawnMany('wheel');

/** Murciélagos: pares [x, fila]. */
export const bats = spawnAt('bat');
/** Barracudas (nadan, no necesitan suelo): pares [x, fila] dentro de una zona de agua. */
export const barracudas = spawnAt('barracuda');
