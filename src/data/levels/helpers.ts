import type { Op } from '../../engine/level/types';
import type { EnemyId } from '../../engine/types';

const spawnMany =
  (id: EnemyId) =>
  (...xs: number[]): Op[] =>
    xs.map((x) => ['spawn', id, x] as const);

/** Atajos para colocar varios enemigos sobre el suelo: ...coati(22, 32, 41). */
export const coati = spawnMany('coati');
export const urchin = spawnMany('urchin');

/** Murciélagos: pares [x, fila]. */
export const bats = (...pairs: Array<readonly [number, number]>): Op[] =>
  pairs.map(([x, y]) => ['spawn', 'bat', x, y] as const);
