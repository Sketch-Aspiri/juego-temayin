import type { LevelDef } from '../../../engine/level/types';
import { blueCrab, nauyaca } from '../helpers';
import { waterBank } from '../waterBanks';

/**
 * El Triunfo: pantanos y popales de Tabasco (AGENTS.md §4.3).
 *
 * Recorrido:
 *   0-47     orilla del pantano: bloques ?, chile, primer vado de agua baja.
 *   48-104   montículos: dos tramos de agua honda salpicados de islotes de lodo
 *            (plataformas cortas y estrechas, "se hunden" a la vista) entre islas firmes.
 *   ~100     punto de control (Toh).
 *   105-149  popal inundado: agua por la rodilla con pozas hondas; arriba, un
 *            saliente escondido con cacao y un corazón de jade.
 *   150-192  pasarela elevada de tablones sobre el agua, con huecos y tramos estrechos.
 *   193-215  tierra firme, bandera y templo.
 *
 * Las nauyacas acechan unos pasos después de cada aterrizaje (nunca en el mismo
 * punto de caída) para que se vean venir; el chile de fuego llega antes de la primera.
 */
export const LEVEL_1_4: LevelDef = {
  id: '1-4',
  name: 'El Triunfo',
  hint: 'La nauyaca se yergue antes de lanzarse: písala solo cuando esté enroscada.',
  width: 215,
  theme: 'swamp',
  checkpoint: 100,
  ops: [
    // --- Orilla del pantano -------------------------------------------------
    ['row', 12, 8, '?'],
    ['row', 16, 8, 'B?BFB'],
    ['coins', 23, 8, 3],
    ['water', 28, 37, 11],
    ['coins', 29, 9, 3], ['row', 33, 8, '?'],
    ['pit', 41, 43], ['water', 41, 43, 12], ['coins', 41, 8, 3],

    // --- Montículos --------------------------------------------------------
    ['row', 47, 8, 'B?B'],
    ['pit', 55, 65], ['water', 55, 65, 12],
    ['plat', 57, 11, 2], ['plat', 61, 11, 2],
    ['coins', 55, 9, 2], ['coins', 59, 9, 2], ['coins', 63, 9, 3],
    ['plat', 70, 8, 3], ['coins', 70, 7, 3],
    ['row', 74, 8, '?'],
    ['pit', 78, 91], ['water', 78, 91, 12],
    ['plat', 80, 11, 1], ['plat', 83, 10, 2], ['plat', 87, 11, 1], ['plat', 89, 10, 1],
    ['coins', 83, 8, 2], ['coins', 87, 9, 1], ['coins', 89, 8, 1],
    ['row', 95, 8, 'B?MB'],

    // --- Popal inundado ----------------------------------------------------
    ['water', 106, 136, 11],
    ['row', 108, 8, '?B?'],
    ['pit', 114, 116], ['coins', 114, 9, 3],
    ['plat', 116, 7, 3],
    ['stairs', 120, 2, 1], ['stairs', 122, 2, -1], ['coins', 121, 8, 2],
    ['pit', 129, 131], ['coins', 129, 9, 3],
    ['row', 132, 8, 'B?B'],
    // Saliente escondido: escalones de lodo hasta lo alto del popal.
    ['plat', 139, 9, 2], ['plat', 142, 6, 2],
    ['plat', 144, 4, 5], ['coins', 144, 3, 5], ['row', 146, 0, 'L'],

    // --- Pasarela elevada --------------------------------------------------
    ['stairs', 150, 4, 1],
    // El agua queda a dos bloques de la pasarela para poder regresar con una brazada.
    ['pit', 155, 176], ['water', 155, 176, 10],
    ['plat', 154, 8, 5], ['plat', 161, 8, 3], ['plat', 166, 8, 2], ['plat', 170, 8, 2], ['plat', 174, 8, 2],
    ['coins', 159, 6, 2], ['coins', 164, 6, 2], ['coins', 168, 6, 2], ['coins', 172, 6, 2],
    ['row', 162, 4, '?'],
    ['stairs', 178, 4, -1],

    // --- Llegada -----------------------------------------------------------
    ['row', 186, 8, '?B?'],
    ['coins', 194, 8, 3],
    ['flag', 200], ['temple', 205],

    // --- Enemigos ----------------------------------------------------------
    ...blueCrab(34, 103, 110, 136, 185),
    ...nauyaca(52, 125, 190),
    ['spawn', 'howler', 71, 7],
    ['spawn', 'howler', 117, 6],
    ['spawn', 'howler', 175, 7],
    ...waterBank(27, 11, 1), ...waterBank(38, 11, -1),
    ...waterBank(105, 11, 1), ...waterBank(137, 11, -1),
    ...waterBank(154, 10, 1), ...waterBank(177, 10, -1),
  ],
};
