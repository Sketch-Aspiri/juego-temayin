import type { LevelDef } from '../../../engine/level/types';
import { alux, ants, xtabay } from '../helpers';
import { waterBank } from '../waterBanks';

/**
 * Felipe Carrillo Puerto: selva del centro de Quintana Roo bajo la lluvia
 * (AGENTS.md §4.3, Mundo 6). Tres cenotes pequeños que se cruzan a nado o
 * saltando por las ramas de las ceibas; todos tienen la superficie abierta,
 * así que el aire nunca falta (y hay burbujas en los más largos). Las ramas
 * nunca cuelgan sobre las dos últimas columnas de agua ni sobre la orilla: al
 * nadar a la derecha por la superficie siempre hay salida (comprobado en `world6.test.ts`).
 *
 *   0-22    selva llana: primeras hormigas
 *   23-30   cenote 1 (6 bloques): nadar o saltar por una rama baja
 *   61-73   cenote 2 (11 bloques): ramas de ceiba en dos alturas
 *   104     punto de control seco, con chile de repuesto
 *   120-133 cenote 3 (14 bloques): ramas más separadas, burbujas
 *   170-176 cenote final de 7 bloques: nado o salto con una losa en medio
 */
export const LEVEL_6_3: LevelDef = {
  id: '6-3',
  name: 'Felipe Carrillo Puerto',
  width: 212,
  theme: 'jungle',
  weather: 'rain',
  checkpoint: 104,
  // TODO(cultura): Chan Santa Cruz es un tema histórico sensible; el consejo se limita a la naturaleza
  // y debe revisarse con fuentes y voces mayas antes de añadir cualquier dato histórico.
  hint: 'En esta selva hay cenotes y ceibas, el árbol sagrado maya. Nada con calma: el aire está en la superficie.',
  ops: [
    ['discovery', 55, 11, 'felipe-chan-santa-cruz'],
    ['discovery', 136, 11, 'felipe-mayapax'],
    ['row', 9, 8, '?M?'], ['coins', 13, 9, 4],
    // Cenote 1.
    ['pit', 24, 29], ['water', 24, 29, 10], ['plat', 25, 8, 3], ['coins', 25, 7, 3], ['coins', 25, 11, 4],
    ...waterBank(23, 10, 1), ...waterBank(30, 10, -1),
    ['pipe', 40, 3], ['coins', 36, 9, 3], ['row', 46, 8, 'B?B'],
    // Cenote 2.
    ['pit', 62, 72], ['water', 62, 72, 10], ['bubbles', 67, 13],
    ['plat', 63, 8, 2], ['plat', 66, 6, 3], ['plat', 69, 8, 2], ['coins', 63, 7, 2], ['coins', 66, 5, 3], ['coins', 69, 7, 2],
    ['coins', 64, 12, 6],
    ...waterBank(61, 10, 1), ...waterBank(73, 10, -1),
    ['row', 84, 8, '?B?'], ['coins', 90, 9, 4], ['col', 96, 2],
    // Punto de control seco.
    ['row', 108, 8, '?F?'], ['coins', 113, 9, 4],
    // Cenote 3.
    ['pit', 120, 133], ['water', 120, 133, 10], ['bubbles', 126, 13], ['bubbles', 131, 13],
    ['plat', 122, 8, 3], ['plat', 127, 6, 3], ['plat', 130, 8, 2],
    ['coins', 122, 7, 3], ['coins', 127, 5, 3], ['coins', 130, 7, 2], ['coins', 123, 12, 8],
    ...waterBank(119, 10, 1), ...waterBank(134, 10, -1),
    ['row', 142, 8, '?L?'], ['col', 148, 3], ['coins', 154, 9, 4],
    // Cenote final.
    ['pit', 170, 176], ['water', 170, 176, 10], ['plat', 172, 8, 2], ['coins', 172, 7, 2], ['bubbles', 173, 13], ['coins', 171, 12, 5],
    ...waterBank(169, 10, 1), ...waterBank(177, 10, -1),
    ['row', 186, 8, '?M?'],
    ['flag', 196], ['temple', 201],
    ...ants(14, 52, 150), ...xtabay(80, 112, 160, 188), ...alux(42, 100, 182),
  ],
};
