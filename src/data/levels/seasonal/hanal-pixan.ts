import type { LevelDef } from '../../../engine/level/types';
import { waterBank } from '../waterBanks';

/**
 * Sendero de luces: presenta las mecánicas antes de combinarlas en la segunda
 * mitad. Checkpoint en el patio central; los últimos tres barrancos exigen
 * encadenar saltos sin detenerse sobre las losas. Las ofrendas nunca se rompen.
 */
export const HANAL_PIXAN_LEVEL: LevelDef = {
  id: 'especial-hanal-pixan', name: 'Hanal Pixán', theme: 'hanalPixan',
  width: 600, time: 600, checkpoint: 288, decorativeWater: false,
  hint: '¡Sigue las luces! Las losas ceden: salta sin detenerte. Completa el sendero para ganar el Amuleto de luz.',
  ops: [
    // Bienvenida con espacio para practicar y chile antes de los retos.
    ['coins', 7, 10, 5], ['row', 12, 8, '?M?'],
    ['pipe', 20, 1], ['spawn', 'coati', 27], ['pipe', 34, 2],
    ['coins', 23, 9, 5], ['row', 38, 8, '?F?'], ['coins', 44, 10, 4],

    // Hamacas: ruta baja accesible y tejados con premios opcionales.
    ['hammock', 52, 12, 4], ['plat', 56, 6, 5], ['coins', 56, 4, 5],
    ['pit', 66, 70], ['plat', 67, 10, 2], ['coins', 66, 8, 5],
    ['hammock', 76, 12, 4], ['plat', 80, 6, 5], ['coins', 80, 4, 5], ['row', 82, 3, 'L'],
    ['col', 94, 1], ['spawn', 'ants', 101], ['spawn', 'ants', 104], ['col', 109, 1],
    ['coins', 96, 9, 4],
    ['spawn', 'bat', 88, 7],

    // El columpio ofrece un atajo; la losa baja permite recuperarse si se falla el agarre.
    ['plat', 114, 9, 3], ['rope', 122, 3, 6], ['pit', 120, 124], ['plat', 121, 10, 2],
    ['coins', 125, 7, 5], ['row', 131, 8, '?F?'], ['spawn', 'alux', 137],
    ['coins', 139, 10, 4], ['row', 146, 8, '?M?'],
    ['spawn', 'bat', 128, 6],

    // Dos vagones cruzan el barranco: se espera su llegada y se viaja sobre el techo.
    ['pit', 154, 168], ['train', 154, 10, 2, 2.5, 5],
    ['coins', 155, 8, 5], ['coins', 163, 8, 5], ['coins', 172, 10, 4],

    // Antes del cenote se recuperan poderes; el checkpoint queda en el patio central.
    ['row', 183, 8, 'MFS'], ['coins', 188, 10, 5],

    // Cenote: corriente suave y aire frecuente, sin enemigos bajo el agua.
    ['pit', 200, 230], ['water', 200, 230, 8],
    ...waterBank(199, 8, 1), ...waterBank(231, 8, -1),
    ['current', 206, 224, 9, 13, -1.2, 0.4],
    ['bubbles', 204, 13], ['bubbles', 215, 13], ['bubbles', 226, 13],
    ['coins', 204, 11, 7], ['coins', 217, 12, 9], ['boat', 208, 7.5, 3, 8, 0, 6],
    ['coins', 210, 7, 5], ['coins', 235, 10, 4],

    // Patio de pelota: encestar da puntos, pero nunca bloquea la salida.
    ['row', 244, 8, 'MP'], ['hoop', 257, 8], ['hoop', 272, 8],
    ['coins', 250, 10, 4], ['coins', 263, 10, 5], ['spawn', 'alux', 267],
    ['col', 278, 1], ['spawn', 'coati', 282], ['col', 286, 1],

    // Ruta alta de cacao y dos puentes cortos que combinan lo aprendido.
    ['row', 290, 8, 'MFS'], ['plat', 295, 6, 4], ['coins', 295, 5, 4],
    ['pit', 302, 307], ['mover', 302, 10, 3, 3, 0, 4], ['coins', 302, 8, 6],
    ['row', 313, 8, '?M?'], ['spawn', 'bat', 317, 5],
    ['pit', 322, 328], ['crumble', 323, 10, 3], ['plat', 327, 10, 2],
    ['coins', 323, 8, 5], ['stairs', 333, 4, 1], ['coins', 335, 6, 4],
    ['col', 338, 1], ['spawn', 'ants', 341], ['spawn', 'ants', 344], ['col', 348, 1],

    // Galería del viento: losas separadas, aterrizajes breves y ráfaga contraria.
    ['pit', 354, 364], ['crumble', 355, 10, 4], ['crumble', 361, 10, 3],
    ['coins', 355, 8, 3], ['coins', 361, 8, 3],
    ['wind', 352, 366, 4, 11, -0.6, 0], ['spawn', 'bat', 368, 6],
    ['row', 372, 8, '?F?'],

    // Columpios gemelos: el cacao marca la ruta alta y las losas permiten reengancharse.
    ['plat', 380, 9, 3], ['pit', 385, 391], ['rope', 388, 3, 6],
    ['crumble', 386, 10, 2], ['plat', 391, 10, 1], ['coins', 386, 7, 5],
    ['pit', 398, 405], ['rope', 401, 3, 6], ['crumble', 399, 10, 3],
    ['plat', 404, 10, 2], ['coins', 400, 7, 5],
    ['col', 410, 1], ['spawn', 'coati', 414], ['spawn', 'alux', 420], ['col', 425, 1],

    // El segundo convoy exige cambiar de apoyo; hay refugio antes de las hamacas.
    ['row', 428, 8, '?M?'], ['pit', 436, 453],
    ['train', 436, 10, 2, 3.2, 8], ['spawn', 'bat', 445, 6],
    ['coins', 437, 8, 5], ['coins', 449, 8, 5], ['row', 460, 8, 'F'],
    ['hammock', 468, 12, 3], ['plat', 472, 6, 3], ['coins', 472, 4, 3],
    ['pit', 479, 484], ['crumble', 480, 10, 3], ['coins', 479, 8, 6],
    ['hammock', 490, 12, 3], ['plat', 494, 6, 4], ['row', 496, 3, 'L'],
    ['coins', 494, 4, 4], ['spawn', 'bat', 503, 6], ['row', 508, 8, '?M?'],

    // Prueba final: tres barrancos, cada uno combina apoyos distintos y una pausa segura.
    ['pit', 518, 526], ['mover', 518, 10, 3, 4, -1, 3.6],
    ['plat', 525, 10, 2], ['coins', 519, 7, 6],
    ['pit', 534, 542], ['crumble', 536, 10, 4], ['crumble', 540, 9, 3],
    ['coins', 535, 8, 3], ['coins', 540, 7, 3],
    ['pit', 550, 560], ['mover', 550, 10, 3, 3, 0, 3.2],
    ['crumble', 554, 10, 6], ['coins', 551, 8, 3], ['coins', 556, 8, 4],
    ['stairs', 566, 4, 1], ['coins', 568, 6, 4],
    // El santuario final queda despejado: la recompensa se gana al completar la meta.
    ['flag', 582], ['temple', 586],

    // Las luces anuncian orillas y cambios de sección también en pantallas pequeñas.
    ['firefly', 9, 8], ['firefly', 50, 8], ['firefly', 65, 8], ['firefly', 71, 8],
    ['firefly', 79, 5], ['firefly', 119, 8], ['firefly', 125, 8], ['firefly', 153, 8],
    ['firefly', 169, 8], ['firefly', 180, 8], ['firefly', 199, 6], ['firefly', 211, 6],
    ['firefly', 225, 6], ['firefly', 231, 6], ['firefly', 257, 6], ['firefly', 272, 6],
    ['firefly', 301, 8], ['firefly', 308, 8], ['firefly', 321, 8], ['firefly', 329, 8],
    ['firefly', 288, 7], ['firefly', 353, 8], ['firefly', 365, 8],
    ['firefly', 384, 7], ['firefly', 392, 7], ['firefly', 397, 7], ['firefly', 406, 7],
    ['firefly', 435, 8], ['firefly', 454, 8], ['firefly', 471, 5],
    ['firefly', 478, 8], ['firefly', 485, 8], ['firefly', 493, 5],
    ['firefly', 517, 8], ['firefly', 527, 8], ['firefly', 533, 8], ['firefly', 543, 8],
    ['firefly', 549, 8], ['firefly', 561, 8], ['firefly', 580, 7],
  ],
};
