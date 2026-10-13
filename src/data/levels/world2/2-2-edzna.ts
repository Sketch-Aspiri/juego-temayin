import type { LevelDef } from '../../../engine/level/types';
import { nauyaca, shades, tarantula } from '../helpers';

/**
 * Edzná: zona arqueológica maya en el valle de Edzná, al sureste de la ciudad de
 * San Francisco de Campeche (AGENTS.md §4.3). Su Gran Acrópolis está coronada por
 * el Edificio de los Cinco Pisos, un basamento escalonado de cinco cuerpos, y la
 * ciudad contó con una extensa red de canales y depósitos para captar agua de lluvia.
 *
 * Referencia para el consejo de Toh:
 *   «Edzná guardaba el agua de lluvia en canales y aguadas. ¡Ojo con el escombro: se derrumba!»
 *
 * Recorrido (columnas):
 *  -   0–35   Plaza de entrada: bloques `?`, escudo y tarántulas bajo las cornisas.
 *  -  36–64   Edificio de los Cinco Pisos: escalinata de cinco cuerpos (5 escalones),
 *             cima con cacao y bajada; primer puente de escombro sobre un canal.
 *  -  65–111  Gran Acrópolis: chile de fuego para disolver las sombras de Xibalbá,
 *             pasarelas talladas y nauyacas en la hierba.
 *  - 112–158  Punto de control (Toh), un chile para quien reaparece sin fuego y el gran
 *             canal: tres tramos de escombro seguidos sobre un hoyo de 10, sin enemigos
 *             para practicar el derrumbe; después, el juego de pelota con una sombra.
 *  - 159–222  Templo menor: escombro a media altura, escalinata final, bandera y templo.
 *             Aquí se combinan sombra, nauyaca y tarántula: la prueba final del nivel.
 *
 * Las nauyacas acechan lejos de los aterrizajes y de la cima de los Cinco Pisos,
 * para que su aviso (se yerguen) llegue antes del lance.
 */
export const LEVEL_2_2: LevelDef = {
  id: '2-2',
  name: 'Edzná',
  hint: '¡Ojo con el escombro: se derrumba cuando lo pisas!',
  width: 222,
  theme: 'ruins',
  checkpoint: 112,
  ops: [
    // Plaza de entrada
    ['row', 12, 8, '?B?'],
    ['row', 18, 8, 'BMB'], ['row', 19, 4, '?'],
    ['coins', 23, 9, 3],
    ['plat', 28, 8, 5], ['coins', 28, 7, 5],

    // Edificio de los Cinco Pisos
    ['stairs', 38, 5, 1],
    ['col', 43, 5], ['col', 44, 5], ['col', 45, 5], ['col', 46, 5],
    ['coins', 43, 5, 4], ['row', 44, 3, '?'],
    ['stairs', 47, 5, -1],
    ['pit', 54, 61],
    ['crumble', 55, 10, 2], ['crumble', 58, 9, 2], ['coins', 55, 8, 5],

    // Gran Acrópolis
    ['row', 66, 8, 'BFB'],
    ['plat', 72, 9, 4], ['coins', 72, 8, 4],
    ['plat', 78, 7, 4], ['row', 79, 3, '??'],
    ['pit', 85, 89], ['coins', 85, 8, 5],
    ['row', 93, 8, 'B?B?B'],
    ['col', 101, 2], ['col', 102, 3], ['coins', 101, 7, 2],
    ['row', 106, 8, 'B?B'],

    // Gran canal y juego de pelota. El chile de 114 queda al alcance al reaparecer.
    ['row', 114, 8, 'F'],
    ['pit', 118, 127],
    ['crumble', 119, 10, 2], ['crumble', 122, 9, 2], ['crumble', 125, 10, 2],
    ['coins', 119, 8, 2], ['coins', 122, 7, 2], ['coins', 125, 8, 2],
    ['stairs', 132, 3, 1], ['plat', 135, 9, 4], ['coins', 135, 8, 4], ['stairs', 139, 3, -1],
    ['row', 144, 8, 'B?L?B'],
    ['pit', 151, 156], ['plat', 153, 8, 2], ['coins', 152, 7, 4],

    // Templo menor y meta
    ['stairs', 162, 4, 1],
    ['pit', 166, 172], ['crumble', 167, 8, 3], ['coins', 167, 7, 3], ['plat', 171, 9, 1],
    ['row', 178, 8, '?M?'],
    ['plat', 183, 8, 4], ['coins', 183, 7, 4],
    ['stairs', 190, 6, 1], ['col', 196, 6],
    ['flag', 204], ['temple', 210],

    ...tarantula(14, 30, 95, 146, 185),
    ...nauyaca(24, 70, 110, 161, 180),
    ...shades([76, 5], [98, 6], [140, 5], [176, 5], [199, 4]),
  ],
};
