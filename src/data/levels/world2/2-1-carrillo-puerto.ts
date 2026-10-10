import type { LevelDef } from '../../../engine/level/types';
import { coati } from '../helpers';

/**
 * Carrillo Puerto: paradero rural del Tren Maya en la selva baja campechana
 * (AGENTS.md §4.3). Primer nivel con vagones de tren móviles (op `train`, §5.4).
 *
 * Línea de Toh (cartel de entrada, cuando exista el campo en `LevelDef`):
 * «Carrillo Puerto es un paradero del Tren Maya en la selva baja de Campeche.
 *  ¡Súbete al techo de los vagones para cruzar los barrancos!»
 *
 * Recorrido (columnas):
 *  -   0–41  Andén del paradero: bloques `?` con escudo, pozos y coatíes.
 *  -  42–60  Primer tren (1 vagón) sobre un barranco; monedas a la altura del techo.
 *  -  61–98  Selva baja: escalinata, saraguato en lo alto y hoyos cortos.
 *  -  99–121 Segundo tren (2 vagones) bajo la mirada de un saraguato. Punto de control antes.
 *  - 122–160 El pueblo: plataforma elevadora hacia una terraza con monedas y un corazón de jade.
 *  - 161–184 Tercer tren: llega desde el otro lado del barranco y vuelve con el jugador.
 *  - 185–218 Llegada: escalinata, chile y templo.
 */
export const LEVEL_2_1: LevelDef = {
  id: '2-1',
  name: 'Carrillo Puerto',
  width: 218,
  theme: 'jungle',
  checkpoint: 96,
  ops: [
    // Andén del paradero
    ['row', 10, 8, '?B?'],
    ['row', 16, 8, 'B?M?B'], ['coins', 17, 4, 3],
    ['pipe', 24, 2],
    ['coins', 27, 9, 3],
    ['pipe', 31, 3],
    ['row', 36, 8, '??'],

    // Primer tren: un vagón sobre el barranco. Los trenes empiezan ya sobre el hoyo
    // para que el jugador suba de un salto desde la orilla (no atraviese el vagón a pie).
    ['pit', 46, 57],
    ['train', 46, 10, 1, 2.5, 7],
    ['coins', 48, 8, 6],

    // Selva baja
    ['row', 63, 8, 'B?B'],
    ['stairs', 68, 3, 1],
    ['plat', 72, 6, 4], ['coins', 72, 5, 4],
    ['pit', 77, 81], ['coins', 77, 8, 5],
    ['coins', 84, 9, 3],
    ['row', 88, 8, '?F?'],
    ['pit', 92, 94],

    // Segundo tren: dos vagones
    ['pit', 102, 118],
    ['train', 102, 10, 2, 3, 7],
    ['coins', 104, 8, 4], ['coins', 112, 8, 4],
    ['plat', 108, 4, 3],

    // El pueblo
    ['row', 124, 8, 'B?B?B'],
    ['col', 132, 2],
    ['mover', 138, 10, 3, 0, -5, 5],
    ['plat', 142, 5, 6], ['coins', 142, 4, 3], ['row', 147, 1, 'L'],
    ['row', 151, 8, '?B?'],
    ['pit', 156, 159], ['coins', 156, 9, 4],

    // Tercer tren: llega desde la otra orilla
    ['pit', 166, 181],
    ['train', 174, 10, 2, 3.5, -8],
    ['coins', 168, 8, 3],

    // Llegada
    ['row', 186, 8, '?B?'],
    ['stairs', 190, 5, 1], ['col', 195, 5],
    ['flag', 203], ['temple', 208],

    ...coati(14, 22, 29, 39, 66, 86, 97, 128, 135, 150, 184, 199),
    ['spawn', 'howler', 73, 5],
    ['spawn', 'howler', 109, 3],
    ['spawn', 'howler', 146, 4],
  ],
};
