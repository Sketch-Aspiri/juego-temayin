import type { LevelDef } from '../../../engine/level/types';
import { cavernCeiling, floodedTunnel, rockBlock } from '../caves';
import { axolotls, bats, shades } from '../helpers';

/** Superficie del agua (y techo de los túneles) en las dos cuevas inundadas. */
const SURFACE = 7;
/** Filas de techo de caverna sobre las cuevas inundadas. */
const CEILING_ROWS = 2;

/**
 * Xibalbá (AGENTS.md §4.3, Mundo 4): paradero real del Tren Maya cerca de Chichén
 * Itzá; en el juego, la entrada al inframundo. Subterráneo y acuático: cuevas
 * inundadas que se cruzan buceando entre bolsas de aire.
 *
 * Toh: «Xibalbá es el inframundo del Popol Vuh, el libro sagrado k'iche'. Allí los
 * Héroes Gemelos, Hunahpú e Ixbalanqué, superaron con ingenio las pruebas de sus
 * casas, como la Casa de los Murciélagos. El paradero del Tren Maya que lleva su
 * nombre está muy cerca de Chichén Itzá, tierra de cenotes».
 *
 * TODO(oscuridad): darkness { radius: 200, alpha: 0.85 } y antorchas en
 *   (20, 10), (72, 10), (104, 10), (160, 6), (205, 10) (filas de bloques).
 *
 *   0-29     Entrada: bloques `?` y chile (el fuego disuelve las sombras), poza oscura.
 *  30-70     Primera cueva inundada: poza abierta, muro de roca que obliga a bucear y
 *            túnel con 2 bolsas de aire; ajolotes fantasma. Premio oculto sobre el
 *            techo del túnel (se vuelve desde la salida).
 *  71-106    Casa de los Murciélagos (seca): escaleras, hoyo con losa, murciélagos y
 *            sombras. Punto de control de Toh en la columna 106.
 * 107-158    Gran sala inundada: snorkel de caracol antes de entrar; túnel largo con
 *            2 bolsas de aire, 2 respiraderos de burbujas, corriente a favor y luego
 *            en contra (2 bloques/s, remontable).
 * 159-226    Ascenso hacia la salida: escaleras, poza, hoyo con losa, bandera y templo.
 */
export const LEVEL_4_2: LevelDef = {
  id: '4-2',
  name: 'Xibalbá',
  width: 226,
  theme: 'xibalba',
  time: 360,
  checkpoint: 106,
  ops: [
    // --- Entrada ---
    ['row', 8, 8, '?F?'], ['coins', 13, 5, 3],
    ['stairs', 15, 3, 1], ['stairs', 18, 3, -1],
    ['pit', 24, 27], ['water', 24, 27, 11], ['coins', 24, 8, 4],

    // --- Primera cueva inundada ---
    ...cavernCeiling(30, 70, CEILING_ROWS),
    ['water', 30, 70, SURFACE],
    ['coins', 33, 5, 4], ['coins', 34, 10, 3],
    ...rockBlock(42, 1, CEILING_ROWS, SURFACE - 1),
    ...floodedTunnel(43, 68, SURFACE, [50, 60]),
    ['current', 43, 49, SURFACE + 1, 11, 1.5, 0], // la corriente ayuda a entrar
    ['coins', 44, 10, 4], ['coins', 53, 9, 5], ['coins', 63, 10, 4],
    ['coins', 64, SURFACE - 1, 4], // premio oculto sobre el techo

    // --- Casa de los Murciélagos ---
    ['row', 74, 8, 'B?B?B'], ['coins', 75, 4, 3],
    ['pit', 80, 85], ['plat', 82, 9, 2], ['coins', 81, 6, 4],
    ['stairs', 88, 4, 1], ['plat', 93, 7, 3], ['coins', 93, 5, 3], ['stairs', 96, 4, -1],
    ['row', 101, 8, '?M?'],

    // --- Gran sala inundada ---
    ['row', 107, 8, '?S?'],
    ...cavernCeiling(111, 158, CEILING_ROWS),
    ['water', 111, 158, SURFACE],
    ['coins', 112, 10, 3],
    ...rockBlock(116, 1, CEILING_ROWS, SURFACE - 1),
    ...floodedTunnel(117, 156, SURFACE, [126, 140]),
    ['current', 117, 125, SURFACE + 1, 11, 2, 0],
    ['coins', 119, 10, 4], ['coins', 129, 9, 5], ['bubbles', 133, 11],
    ['current', 142, 149, SURFACE + 1, 11, -2, 0],
    ['coins', 143, 10, 4], ['coins', 152, 9, 4], ['bubbles', 150, 11],
    ['coins', 151, SURFACE - 1, 4], ['row', 153, 3, '?'], // premio oculto sobre el techo

    // --- Ascenso ---
    ['stairs', 160, 5, 1], ['plat', 166, 6, 3], ['coins', 166, 4, 3], ['stairs', 170, 5, -1],
    ['pit', 177, 182], ['water', 177, 182, 11], ['coins', 177, 8, 6],
    ['row', 186, 8, '?L?'], ['coins', 186, 4, 3],
    ['pit', 191, 195], ['plat', 192, 9, 2],
    ['stairs', 199, 4, 1],
    ['flag', 208], ['temple', 213],

    ...shades([22, 6], [86, 5], [99, 4], [180, 5], [196, 4]),
    ...axolotls([47, 9], [57, 10], [65, 9], [121, 10], [131, 9], [137, 11], [146, 10], [154, 9]),
    ...bats([12, 6], [76, 6], [84, 5], [90, 4], [98, 6], [168, 3], [188, 6], [204, 5]),
  ],
};
