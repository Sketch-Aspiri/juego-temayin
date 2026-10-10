import type { LevelDef } from '../../../engine/level/types';
import { coati, wheel } from '../helpers';

/**
 * Tenabo: pueblo agrícola del Camino Real, la antigua ruta entre Campeche y Mérida
 * (AGENTS.md §4.3). Tema `hacienda`: henequenales, carretas y ruedas de desfibradora.
 * Las carretas son plataformas `mover` (§5.4) que cruzan los barrancos del camino.
 *
 * Línea de Toh (cartel de entrada, cuando exista el campo en `LevelDef`):
 * «Tenabo está en el Camino Real, la vieja ruta entre Campeche y Mérida. Aquí se
 *  cultivó henequén: ¡cuidado con las ruedas que bajan rodando!»
 *
 * Recorrido (columnas):
 *  -   0–42  Camino Real: bloques `?` con escudo, coatíes y la primera rueda.
 *  -  43–79  Barrancos del henequenal: dos carretas móviles sobre hoyos anchos.
 *  -  80–115 La desfibradora: escalinata con ruedas que bajan rodando al encuentro.
 *  - 116–160 Patio del casco (punto de control al entrar): elevador hacia la terraza
 *            alta con un corazón de jade, y un barranco con dos carretas en relevo.
 *  - 161–224 Salida del pueblo: chile, ruedas en el llano, último barranco y templo.
 */
export const LEVEL_2_5: LevelDef = {
  id: '2-5',
  name: 'Tenabo',
  width: 224,
  theme: 'hacienda',
  checkpoint: 118,
  ops: [
    // Camino Real
    ['row', 11, 8, '?M?'],
    ['row', 18, 8, 'B?B'], ['coins', 18, 4, 3],
    ['col', 25, 2],
    ['plat', 30, 8, 4], ['coins', 30, 7, 4],
    ['col', 38, 3],

    // Barrancos del henequenal: carretas móviles
    ['pit', 44, 52],
    ['mover', 45, 10, 3, 4, 0, 4],
    ['coins', 46, 8, 5],
    ['row', 55, 8, '?B?'],
    ['pit', 59, 68],
    ['mover', 60, 9, 3, 5, 0, 4.5],
    ['coins', 61, 7, 6],
    ['plat', 72, 8, 3],
    ['pit', 76, 79],

    // La desfibradora: escalinata con ruedas
    ['stairs', 86, 6, 1],
    ['plat', 92, 6, 6], ['coins', 92, 4, 6],
    ['stairs', 98, 6, -1],
    ['row', 108, 8, 'B?F?B'],
    ['col', 114, 2],

    // Patio del casco
    ['row', 120, 8, '??'],
    ['mover', 124, 10, 3, 0, -5, 5],
    ['plat', 128, 5, 7], ['coins', 128, 4, 5], ['row', 133, 1, 'L'],
    ['pit', 138, 149],
    ['mover', 139, 9, 3, 4, 0, 3.5],
    ['mover', 145, 8, 2, 3, 0, 3],
    ['coins', 142, 6, 6],

    // Salida del pueblo
    ['row', 156, 8, 'B?B?B'],
    ['plat', 163, 7, 4], ['coins', 163, 6, 4],
    ['pit', 170, 175], ['coins', 170, 8, 6],
    ['col', 180, 2],
    ['stairs', 184, 4, 1],
    ['pit', 189, 197],
    ['mover', 190, 9, 3, 4, 0, 3],
    ['coins', 191, 7, 4],
    ['flag', 208], ['temple', 213],

    ...coati(15, 22, 34, 41, 54, 71, 82, 117, 136, 154, 168, 178, 201),
    ...wheel(28, 112, 160, 177, 203),
    ['spawn', 'wheel', 95, 5],
    ['spawn', 'wheel', 97, 5],
  ],
};
