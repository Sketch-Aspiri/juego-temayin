import type { LevelDef, Op } from '../../../engine/level/types';
import { barracudas, blueCrab, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

/** Superficie del río en las pozas hondas (fila de bloques). */
const RIVER_SURFACE = 7;

/**
 * Roca del cañón que cuelga desde arriba hasta justo encima del agua: obliga a
 * bucear por debajo. Entre dos salientes queda un hueco abierto (bolsa de aire).
 */
const overhang = (x: number, len: number): Op[] =>
  Array.from({ length: RIVER_SURFACE }, (_, y) => ['row', x, y, 'X'.repeat(len)] as const);

/**
 * Boca del Cerro: cañón donde el Usumacinta sale de la sierra (AGENTS.md §4.3).
 * Primer nivel acuático: enseña a nadar en una poza baja, luego pozas hondas con
 * salientes de roca y bolsas de aire, una corriente suave y la subida final al templo.
 *
 *   0-34    cañón seco: bloques, rocas, erizo y cangrejo azul
 *   35-47   primera poza, poco profunda (2 filas), con cacao bajo el agua
 *   48-63   orilla con bloques `?` y subida al risco
 *   64-79   poza honda abierta: primer buceo, barracuda joven
 *   80-111  salientes de roca con bolsas de aire; bajo el bajío (97-103) una gruta
 *           escondida con un chile en el techo
 *   112-123 islote seco con el punto de control (Toh) y un escudo para quien reaparece
 *   120-163 corriente suave hacia la derecha, con un saliente corto
 *   160-171 salida del río
 *   172-210 tierra firme, escalinata, bandera y templo; corazón de jade escondido
 *           sobre la columna final (se golpea desde lo alto)
 */
export const LEVEL_1_2: LevelDef = {
  id: '1-2',
  name: 'Boca del Cerro',
  hint: 'Pulsa saltar para nadar hacia arriba; saca la cabeza para recuperar aire.',
  width: 210,
  theme: 'river',
  checkpoint: 117,
  ops: [
    // Cañón seco
    ['row', 12, 8, '?'], ['row', 16, 8, 'B?B'], ['coins', 16, 4, 3],
    ['col', 23, 2], ['col', 28, 3], ['coins', 24, 7, 4],

    // Primera poza (poco profunda)
    ['stairs', 35, 2, 1],
    ['water', 37, 43, 10], ['coins', 38, 11, 5], ['row', 40, 6, '?'],
    ['stairs', 44, 2, 1], ['stairs', 46, 2, -1],

    // Orilla y subida al risco
    ['row', 50, 8, '?M?'], ['coins', 50, 4, 3],
    ['stairs', 58, 6, 1], ['coins', 60, 3, 3],

    // Poza honda abierta
    ['water', 64, 115, RIVER_SURFACE],
    ['coins', 67, 10, 4], ['coins', 75, 6, 3],

    // Salientes y bolsas de aire
    ...overhang(80, 5), ['coins', 81, 9, 3],
    ['coins', 85, 6, 3],
    ...overhang(88, 8), ['coins', 89, 9, 6],
    // Bajío para respirar; debajo, gruta con un chile en el techo (se golpea desde abajo)
    ['row', 97, 8, 'XXXFXXX'], ['coins', 97, 10, 2], ['coins', 102, 10, 2],
    ...overhang(104, 8), ['coins', 105, 9, 6],

    // Islote seco con el punto de control
    ['stairs', 112, 6, 1], ['stairs', 118, 6, -1],
    ['row', 113, 2, '?M'], ['coins', 113, 5, 2],

    // Corriente suave
    ['water', 120, 163, RIVER_SURFACE],
    ['current', 124, 158, RIVER_SURFACE, 11, 1.5, 0],
    ['coins', 128, 9, 4], ['coins', 138, 6, 3],
    ...overhang(144, 6), ['coins', 145, 9, 4],
    ['coins', 152, 10, 4],

    // Salida del río y tierra firme
    ['stairs', 160, 6, 1], ['stairs', 166, 6, -1],
    ['row', 172, 8, 'B?B'], ['coins', 172, 4, 3],
    ['stairs', 178, 8, 1], ['col', 186, 8], ['row', 187, 1, 'L'], ['coins', 189, 5, 4],
    ['flag', 195], ['temple', 200],

    ...urchin(25, 132, 150),
    ...blueCrab(32, 55, 175),
    ...barracudas([74, 9], [138, 9], [154, 8]),
    ...waterBank(44, 10, -1),
  ],
};
