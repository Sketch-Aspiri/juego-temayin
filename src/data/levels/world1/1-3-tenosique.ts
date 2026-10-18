import { EK_CHUAH_OFFERING } from '../../offerings';
import type { LevelDef } from '../../../engine/level/types';
import { ants, coati, tarantula } from '../helpers';

/**
 * Tenosique: pueblo ribereño del Usumacinta, puerta de la selva (AGENTS.md §4.3).
 *
 * Recorrido (columnas):
 *  -   0–37  Orilla del pueblo: bloques `?`, pozos (tubos) y coatíes.
 *  -  38–99  Ascenso al dosel: plataformas sobre lianas. Ruta alta opcional
 *            (59–81) con saraguato y un corazón de jade escondido en 80; la
 *            ruta baja pasa bajo las ramas, donde acechan tarántulas.
 *  - 100–157 Caminos de hormigas: primero una sola fila en el suelo (108); después,
 *            una fila en el suelo bajo la pasarela 117–123 con otras dos encima,
 *            dos más en la pasarela 133–138 y una pareja final (147, 149); chile
 *            escondido sobre la plataforma alta (143).
 *  - 158–215 Bajada a la ribera: escalinata, saltos sobre el río y templo; un coatí
 *            espera al pie de la última columna.
 *
 * Los coatíes nacen lejos de los bordes de los hoyos: caminan sin mirar el suelo y,
 * cerca de un borde, caerían solos antes de encontrarse con el jugador.
 */
export const LEVEL_1_3: LevelDef = {
  offering: EK_CHUAH_OFFERING,
  id: '1-3',
  name: 'Tenosique',
  hint: '¡Mira arriba: las tarántulas se descuelgan cuando pasas debajo!',
  width: 218,
  theme: 'jungle',
  checkpoint: 102,
  ops: [
    // Orilla del pueblo
    ['row', 12, 8, '?B?'],
    ['row', 18, 8, 'B?B?B'], ['row', 20, 4, 'M'],
    ['pipe', 26, 2],
    ['coins', 29, 7, 3],
    ['pipe', 33, 3],

    // Ascenso al dosel
    ['stairs', 38, 3, 1],
    ['pit', 42, 47], ['plat', 43, 8, 4], ['coins', 43, 7, 4],
    ['plat', 50, 9, 3],
    ['plat', 54, 6, 3],
    ['row', 57, 8, '??'],
    ['plat', 59, 3, 4], ['coins', 59, 2, 4],
    ['pit', 64, 69], ['plat', 65, 8, 3], ['coins', 65, 7, 3],
    ['plat', 65, 3, 3], ['coins', 65, 2, 3],
    ['ticket', 66, 1], // Desvío por las ramas altas, antes del punto de control.
    ['plat', 71, 3, 4],
    ['plat', 78, 6, 4], ['row', 80, 2, 'L'],
    ['pit', 87, 91], ['coins', 87, 8, 5],
    ['row', 94, 8, 'B?B'],

    // Caminos de hormigas
    ['row', 115, 8, '?'],
    ['plat', 117, 8, 7], ['coins', 118, 4, 5],
    ['pit', 126, 130], ['coins', 127, 7, 3],
    ['plat', 133, 8, 6],
    ['plat', 141, 5, 5], ['coins', 141, 4, 5], ['row', 143, 1, 'F'],
    ['row', 147, 8, 'B?B'],
    ['pipe', 152, 3],

    // Bajada a la ribera
    ['stairs', 158, 5, 1],
    ['pit', 163, 167], ['coins', 163, 5, 5],
    ['stairs', 168, 5, -1],
    ['row', 175, 8, 'B?B'],
    ['pit', 180, 185], ['plat', 182, 9, 2], ['coins', 182, 8, 2],
    ['stairs', 190, 6, 1], ['col', 196, 6],
    ['flag', 203], ['temple', 208],

    ...coati(16, 24, 30, 77, 84, 97, 156, 200),
    ...tarantula(55, 80, 136, 176),
    ...ants(108, 120, 147, 149),
    ['spawn', 'ants', 119, 7], ['spawn', 'ants', 121, 7],
    ['spawn', 'ants', 135, 7], ['spawn', 'ants', 137, 7],
    ['spawn', 'howler', 73, 2],
  ],
};
