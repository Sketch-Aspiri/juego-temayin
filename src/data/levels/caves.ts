import { GROUND } from '../../engine/constants';
import type { Op } from '../../engine/level/types';

/**
 * Piezas de cuevas y cenotes inundados (Mundo 4). La roca es el bloque de suelo `G`:
 * se dibuja con las texturas de suelo del tema (cima o cuerpo según lo que tenga encima).
 */
const ROCK = 'G';

/** Roca maciza en las columnas x..x+w-1 y las filas y0..y1 (inclusive). */
export const rockBlock = (x: number, w: number, y0: number, y1: number): Op[] =>
  Array.from({ length: y1 - y0 + 1 }, (_, i) => ['row', x, y0 + i, ROCK.repeat(w)] as const);

/** Meseta de roca de x..x+w-1 con la cima en la fila `top` (rellena hasta el suelo). */
export const mesa = (x: number, w: number, top: number): Op[] => rockBlock(x, w, top, GROUND - 1);

/** Techo de caverna de `rows` filas de alto sobre las columnas x0..x1. */
export const cavernCeiling = (x0: number, x1: number, rows: number): Op[] => rockBlock(x0, x1 - x0 + 1, 0, rows - 1);

/** Bolsa de aire cerrada (2×2) sobre el hueco del techo en las columnas x y x+1. */
const airPocket = (x: number, ceil: number): Op[] => [
  ['row', x - 1, ceil - 3, ROCK.repeat(4)],
  ['row', x - 1, ceil - 2, `${ROCK}  ${ROCK}`],
  ['row', x - 1, ceil - 1, `${ROCK}  ${ROCK}`],
];

/**
 * Túnel inundado: techo de roca en la fila `ceil` (que debe coincidir con la superficie
 * del agua) de x0..x1, con una bolsa de aire encima de cada hueco. `pockets` es la
 * columna izquierda de cada bolsa (2 columnas de ancho): ahí se respira sin salir.
 */
export function floodedTunnel(x0: number, x1: number, ceil: number, pockets: readonly number[]): Op[] {
  const inPocket = (x: number): boolean => pockets.some((p) => x === p || x === p + 1);
  const ceiling = Array.from({ length: x1 - x0 + 1 }, (_, i) => (inPocket(x0 + i) ? ' ' : ROCK)).join('');
  return [['row', x0, ceil, ceiling], ...pockets.flatMap((p) => airPocket(p, ceil))];
}
