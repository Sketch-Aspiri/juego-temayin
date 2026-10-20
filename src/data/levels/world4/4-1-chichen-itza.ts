import type { LevelDef } from '../../../engine/level/types';
import { nauyaca, shades, tarantula } from '../helpers';

/**
 * Chichén Itzá: gran ciudad maya del norte de Yucatán, Patrimonio de la Humanidad
 * (UNESCO) desde 1988 (AGENTS.md §4.3, Mundo 4). Su pirámide de El Castillo, el
 * Templo de Kukulcán, tiene nueve cuerpos escalonados y una escalinata en cada lado;
 * en los equinoccios la sombra de sus aristas dibuja una serpiente que baja por la
 * escalinata norte. El Gran Juego de Pelota es la cancha más grande de Mesoamérica,
 * con dos aros de piedra empotrados en lo alto de sus muros.
 *
 * Referencia para el consejo de Toh:
 *   «En el equinoccio, la luz dibuja una serpiente en la escalinata del Templo de
 *    Kukulcán. ¡Lanza la pelota de hule por los aros del Gran Juego de Pelota!»
 *
 * Mecánica: la pelota de pok ta pok (bloques `P`) y los aros (op `hoop`). Cada aro
 * encendido da 5 granos de cacao, que cuentan para las estrellas. Hay un bloque `P`
 * al principio y otro tras el punto de control (al reaparecer se pierde la pelota).
 * Los aros de la fila 8 se alcanzan con el bote de la pelota desde el suelo; el de
 * la fila 7 pide lanzarla saltando.
 *
 * Recorrido (columnas):
 *  -   0–39   Gran Explanada: primer bloque con la pelota y un aro de práctica.
 *  -  40–66   El Castillo (Templo de Kukulcán): escalinata de 8 escalones, templo
 *             superior con cacao y bajada.
 *  -  67–111  Sacbé hacia el juego de pelota: hoyos, pasarelas, chile y nauyacas.
 *  - 112–166  Punto de control (Toh) y el Gran Juego de Pelota: cancha llana entre
 *             dos banquetas, con dos aros; pelota de nuevo a la entrada.
 *  - 167–222  Grupo de las Mil Columnas: columnas a distintas alturas, hoyos,
 *             escalinata final, bandera y templo.
 */
export const LEVEL_4_1: LevelDef = {
  id: '4-1',
  name: 'Chichén Itzá',
  hint: '¡Lanza la pelota de hule por los aros del Gran Juego de Pelota!',
  width: 222,
  theme: 'ruins',
  checkpoint: 112,
  ops: [
    ['discovery', 136, 11, 'chichen-castillo'],
    // Gran Explanada: la pelota y un aro de práctica
    ['row', 10, 8, 'B?P?B'],
    ['coins', 17, 9, 3],
    ['hoop', 27, 8],
    ['plat', 32, 8, 4], ['coins', 32, 7, 4],

    // El Castillo (Templo de Kukulcán)
    ['stairs', 42, 8, 1],
    ['col', 50, 8], ['col', 51, 8], ['col', 52, 8], ['col', 53, 8],
    ['coins', 50, 3, 4], ['row', 51, 0, '??'],
    ['stairs', 54, 8, -1],
    ['row', 63, 8, '?M?'],

    // Sacbé hacia el juego de pelota
    ['pit', 68, 73], ['plat', 70, 8, 2], ['coins', 69, 7, 4],
    ['row', 78, 8, 'BFB'],
    ['plat', 84, 9, 4], ['coins', 84, 8, 4],
    ['pit', 90, 94], ['coins', 90, 8, 5],
    ['row', 98, 8, 'B?B?B'],
    ['col', 105, 2], ['col', 106, 3], ['coins', 105, 7, 2],

    // Gran Juego de Pelota (punto de control en 112)
    ['row', 115, 8, '?P?'],
    ['stairs', 119, 3, 1], ['stairs', 122, 3, -1],
    ['hoop', 132, 8],
    ['coins', 136, 11, 4],
    ['hoop', 146, 7],
    ['coins', 150, 11, 4],
    ['stairs', 158, 3, 1], ['stairs', 161, 3, -1],

    // Grupo de las Mil Columnas
    ['col', 168, 2], ['col', 171, 3], ['col', 174, 4], ['coins', 174, 6, 1],
    ['pit', 176, 181], ['plat', 178, 8, 2], ['coins', 177, 7, 4],
    ['row', 185, 8, '?L?'],
    ['col', 189, 2], ['col', 192, 3], ['coins', 192, 7, 1],
    ['pit', 194, 197],
    ['stairs', 199, 4, 1],
    ['flag', 206], ['temple', 212],

    ...tarantula(20, 66, 100, 127, 165),
    ...nauyaca(36, 76, 88, 141, 187),
    ['spawn', 'nauyaca', 51, 3],
    ...shades([96, 5], [139, 4], [183, 5]),
  ],
};
