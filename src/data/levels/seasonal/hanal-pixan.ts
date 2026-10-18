import type { LevelDef } from '../../../engine/level/types';
import { waterBank } from '../waterBanks';

/**
 * Paseo festivo: enseña cada juego antes de combinarlo. Flores (0–49), hamacas
 * (50–109), columpio (110–149), tren (150–175), descanso (180), cenote (196–235),
 * pelota (244–280) y puentes de luces (286–345). Las ofrendas nunca se rompen.
 */
export const HANAL_PIXAN_LEVEL: LevelDef = {
  id: 'especial-hanal-pixan', name: 'Hanal Pixán', theme: 'hanalPixan',
  width: 364, time: 480, checkpoint: 180, decorativeWater: false,
  hint: '¡Un paseo de luces! Rebota en las hamacas, sube al tren y explora el cenote. Los aros dan cacao extra.',
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

    // El columpio ofrece un atajo; la losa baja permite recuperarse si se falla el agarre.
    ['plat', 114, 9, 3], ['rope', 122, 3, 6], ['pit', 120, 124], ['plat', 121, 10, 2],
    ['coins', 125, 7, 5], ['row', 131, 8, '?F?'], ['spawn', 'alux', 137],
    ['coins', 139, 10, 4], ['row', 146, 8, '?M?'],

    // Dos vagones cruzan el barranco: se espera su llegada y se viaja sobre el techo.
    ['pit', 154, 168], ['train', 154, 10, 2, 2.5, 5],
    ['coins', 155, 8, 5], ['coins', 163, 8, 5], ['coins', 172, 10, 4],

    // Descanso: checkpoint seco y poderes al reaparecer.
    ['row', 183, 8, 'MFS'], ['coins', 188, 10, 5],

    // Cenote: corriente suave y aire frecuente, sin enemigos bajo el agua.
    ['pit', 200, 230], ['water', 200, 230, 8],
    ...waterBank(199, 8, 1), ...waterBank(231, 8, -1),
    ['current', 206, 224, 9, 13, 0.5, 0],
    ['bubbles', 204, 13], ['bubbles', 215, 13], ['bubbles', 226, 13],
    ['coins', 204, 11, 7], ['coins', 217, 12, 9], ['boat', 208, 9, 3, 8, 0, 6],
    ['coins', 210, 7, 5], ['coins', 235, 10, 4],

    // Patio de pelota: encestar da puntos, pero nunca bloquea la salida.
    ['row', 244, 8, 'MP'], ['hoop', 257, 8], ['hoop', 272, 8],
    ['coins', 250, 10, 4], ['coins', 263, 10, 5], ['spawn', 'alux', 267],
    ['col', 278, 1], ['spawn', 'coati', 282], ['col', 286, 1],

    // Ruta alta de cacao y dos puentes cortos que combinan lo aprendido.
    ['stairs', 289, 3, 1], ['plat', 295, 6, 4], ['coins', 295, 5, 4],
    ['pit', 302, 307], ['mover', 302, 10, 3, 3, 0, 4], ['coins', 302, 8, 6],
    ['row', 313, 8, '?M?'], ['spawn', 'bat', 317, 5],
    ['pit', 322, 328], ['crumble', 323, 10, 3], ['plat', 327, 10, 2],
    ['coins', 323, 8, 5], ['stairs', 333, 4, 1], ['coins', 335, 6, 4],
    ['spawn', 'ants', 341], ['flag', 346], ['temple', 350],

    // Las luces anuncian orillas y cambios de sección también en pantallas pequeñas.
    ['firefly', 9, 8], ['firefly', 50, 8], ['firefly', 65, 8], ['firefly', 71, 8],
    ['firefly', 79, 5], ['firefly', 119, 8], ['firefly', 125, 8], ['firefly', 153, 8],
    ['firefly', 169, 8], ['firefly', 180, 8], ['firefly', 199, 6], ['firefly', 211, 6],
    ['firefly', 225, 6], ['firefly', 231, 6], ['firefly', 257, 6], ['firefly', 272, 6],
    ['firefly', 301, 8], ['firefly', 308, 8], ['firefly', 321, 8], ['firefly', 329, 8],
  ],
};
