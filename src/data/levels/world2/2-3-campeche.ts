import { GROUND } from '../../../engine/constants';
import type { LevelDef, Op } from '../../../engine/level/types';
import { blueCrab, pirateCrab } from '../helpers';

/** Muro macizo de sillar de `w` columnas entre las filas `top` y `bottom` (inclusive). */
const wall = (x: number, w: number, top: number, bottom: number): Op[] =>
  Array.from({ length: bottom - top + 1 }, (_, i) => ['row', x, top + i, 'X'.repeat(w)] as const);

/** Puerta de la muralla: muro de la fila 2 a la 8 con el arco abierto debajo (filas 9-11). */
const gate = (x: number, w: number): Op[] => wall(x, w, 2, 8);

/** Baluarte de 2 columnas desde la fila `top` hasta el suelo. */
const bastion = (x: number, top: number): Op[] => wall(x, 2, top, GROUND - 1);

/** Altura (fila superior) de los baluartes del foso. */
const BASTION_TOP = 6;
/** Fila superior del paseo de ronda sobre la muralla. */
const RAMPART_TOP = 7;

/**
 * San Francisco de Campeche: ciudad amurallada, baluartes y puertas de Mar y de
 * Tierra (AGENTS.md §4.3). Primer nivel con cañones de baluarte como plataformas.
 *
 * Toh: «Campeche levantó murallas y baluartes para defenderse de los piratas;
 * su centro histórico es Patrimonio de la Humanidad desde 1999».
 *
 *   0-35    Extramuros y Puerta de Tierra: bloques `?`, escudo y el arco de la puerta.
 *   36-71   Calles del centro histórico: balcones y una zanja; chile en lo alto.
 *   72-103  Baluartes y foso: dos fosos sin fondo que se cruzan saltando de cañón
 *           en cañón; cacao con espacio libre para saltar sobre el segundo foso.
 *   104-117 Plaza con el punto de control (Toh).
 *   118-165 Paseo de ronda: muralla con cañones, almenas y una brecha;
 *           cangrejos pirata patrullando.
 *   166-223 Puerta de Mar y malecón: poza del mar, escalinata, bandera y templo.
 */
export const LEVEL_2_3: LevelDef = {
  id: '2-3',
  name: 'San Francisco de Campeche',
  hint: '¡Salta de cañón en cañón para cruzar los fosos de la muralla!',
  width: 224,
  theme: 'fortress',
  checkpoint: 112,
  ops: [
    // --- Extramuros y Puerta de Tierra ---
    ['row', 9, 8, '?B?'], ['coins', 9, 4, 3],
    ['row', 16, 8, 'BMB'],
    ...gate(24, 6), ['coins', 25, 10, 4],

    // --- Calles del centro histórico ---
    ['plat', 38, 9, 3], ['coins', 38, 8, 3],
    ['row', 43, 6, '?F?'],
    ['pit', 47, 51], ['coins', 47, 8, 5],
    ['plat', 54, 8, 4], ['row', 55, 4, '??'],
    ['col', 61, 2], ['coins', 62, 7, 4], ['col', 66, 3],

    // --- Baluartes y foso ---
    ['stairs', 72, 4, 1],
    ...bastion(76, BASTION_TOP),
    ['pit', 78, 85], ['cannon', 78, 8, 1], ['cannon', 84, 9, -1], ['coins', 80, 5, 4],
    ...bastion(86, BASTION_TOP),
    ['pit', 88, 96], ['cannon', 88, 8, 1], ['cannon', 95, 8, -1], ['coins', 90, 6, 5],
    ...bastion(97, BASTION_TOP),
    ['stairs', 99, 5, -1],

    // --- Plaza del punto de control ---
    ['row', 106, 8, 'B?B?B'], ['coins', 107, 4, 3],

    // --- Paseo de ronda ---
    ['stairs', 118, 5, 1],
    ...wall(123, 16, RAMPART_TOP, GROUND - 1),
    ['row', 131, RAMPART_TOP - 1, 'X'], // almena
    ['coins', 125, 4, 5], ['row', 135, 3, '???'],
    ['cannon', 140, 9, 1], ['coins', 140, 7, 2], // brecha en la muralla
    ...wall(144, 17, RAMPART_TOP, GROUND - 1),
    ['cannon', 149, RAMPART_TOP - 1, 1], ['cannon', 155, RAMPART_TOP - 1, -1],
    ['coins', 151, 3, 4],
    ['stairs', 161, 5, -1],

    // --- Puerta de Mar y malecón ---
    ...gate(172, 5), ['coins', 173, 10, 3],
    ['pit', 182, 186], ['water', 182, 186, GROUND], ['plat', 183, 9, 3], ['coins', 183, 8, 3],
    ['row', 189, 8, '?B?'],
    ['stairs', 192, 4, 1],
    ['flag', 200], ['temple', 206],

    ...pirateCrab(21, 45, 114, 168),
    ...blueCrab(33, 70, 106, 180, 196),
    ['spawn', 'pirateCrab', 55, 7],
    ['spawn', 'pirateCrab', 128, RAMPART_TOP - 1], ['spawn', 'pirateCrab', 135, RAMPART_TOP - 1],
    ['spawn', 'pirateCrab', 152, RAMPART_TOP - 1],
  ],
};
