import type { LevelDef } from '../../../engine/level/types';
import { alux, shades, tarantula } from '../helpers';

/**
 * Hecelchakán: pueblo del Camino Real entre Campeche y Mérida (AGENTS.md §4.3).
 * Su Museo Arqueológico del Camino Real guarda figurillas de la isla de Jaina.
 * Al atardecer (tema `ruinsDusk`). Los bloques que se derrumban son escombro y
 * estuco de relleno, nunca estelas ni glifos (§9).
 *
 * Referencia para el consejo de Toh:
 *   «Por el Camino Real pasaban carretas entre Campeche y Mérida. Cuida tu cacao:
 *    los aluxes son traviesos, pero si los pisas te lo devuelven doble.»
 *
 * Recorrido (columnas):
 *  -   0–41   Camino Real: bloques `?`, cacao para empezar y los primeros aluxes.
 *  -  42–79   Derrumbes: escalera opcional de escombro hasta una fila alta de cacao y
 *             un corazón de jade; canal de 8 con dos tramos de escombro; aluxes.
 *  -  80–105  Patio del museo: chile de fuego, tarántulas bajo las cornisas.
 *  - 106–160  Punto de control (Toh) con otro chile y el gran derrumbe: tres tramos
 *             seguidos sobre un hoyo de 13; después, una fila de cacao custodiada por
 *             tres aluxes y la primera sombra de Xibalbá del atardecer.
 *  - 161–215  Subida final: escombro sobre un canal de 7, otra sombra, escalinata,
 *             bandera y templo.
 *
 * Es el nivel más exigente antes del jefe: combina el escombro y las sombras de Edzná.
 * Las sombras flotan a 7 bloques o más de cualquier derrumbe, para no perseguir al
 * jugador mientras salta de tramo en tramo.
 */
export const LEVEL_2_6: LevelDef = {
  id: '2-6',
  name: 'Hecelchakán',
  hint: 'Los aluxes toman tu cacao; si los alcanzas, te lo devuelven doble.',
  width: 215,
  theme: 'ruinsDusk',
  checkpoint: 106,
  ops: [
    ['discovery', 55, 11, 'hecelchakan-jaina'],
    ['discovery', 139, 11, 'hecelchakan-caliza'],
    // Camino Real
    ['row', 10, 8, '?B?B?'], ['row', 12, 4, 'M'],
    ['coins', 18, 11, 6],
    ['plat', 26, 9, 4], ['coins', 26, 8, 4],
    ['row', 34, 8, 'B??B'],

    // Derrumbes
    ['crumble', 44, 10, 2], ['crumble', 47, 8, 2], ['crumble', 50, 6, 2],
    ['plat', 53, 6, 3], ['coins', 50, 4, 6], ['row', 54, 2, 'L'],
    ['pit', 58, 65],
    ['crumble', 59, 9, 2], ['crumble', 62, 9, 2], ['coins', 59, 7, 5],
    ['row', 70, 8, 'B?B'],

    // Patio del museo
    ['row', 84, 8, 'B?F?B'],
    ['plat', 90, 8, 4], ['coins', 90, 7, 4],
    ['pit', 96, 100], ['coins', 96, 8, 5],

    // Gran derrumbe
    ['row', 108, 8, '?F'], // chile al alcance al reaparecer
    ['pit', 112, 124],
    ['crumble', 113, 10, 3], ['crumble', 117, 9, 3], ['crumble', 121, 10, 3],
    ['coins', 113, 8, 3], ['coins', 117, 7, 3], ['coins', 121, 8, 3],
    ['coins', 127, 11, 11],
    ['row', 140, 8, 'B?B?B'],
    ['plat', 148, 9, 4], ['coins', 148, 8, 4],
    ['pit', 154, 158], ['coins', 154, 9, 5],

    // Subida final
    ['stairs', 165, 4, 1],
    ['pit', 169, 175],
    ['crumble', 170, 8, 2], ['crumble', 173, 9, 2], ['coins', 170, 6, 5],
    ['row', 180, 8, '?M?'],
    ['stairs', 188, 5, 1], ['col', 193, 5],
    ['flag', 201], ['temple', 206],

    ...alux(22, 38, 70, 74, 130, 133, 136, 184),
    ...tarantula(11, 36, 86, 92, 142, 150, 181),
    ...shades([146, 5], [186, 5]),
  ],
};
