import { GROUND } from '../../../engine/constants';
import type { LevelDef, Op } from '../../../engine/level/types';
import { barracudas, blueCrab, morays, urchin } from '../helpers';
import { waterBank } from '../waterBanks';

/** Superficie del agua salobre en las lagunas del manglar (fila de bloques). */
const SURFACE = 7;
/** Raíces colgantes: van de esta fila hasta `ROOT_BOTTOM` y obligan a bucear por debajo. */
const ROOT_TOP = 3;
const ROOT_BOTTOM = 8;

/** Cortina de raíces zancudas de `w` columnas: se cruza buceando bajo ella (filas 9-11). */
const roots = (x: number, w: number): Op[] =>
  Array.from({ length: ROOT_BOTTOM - ROOT_TOP + 1 }, (_, i) => ['row', x, ROOT_TOP + i, 'X'.repeat(w)] as const);

/**
 * Petén (islote de selva) macizo de las columnas x..x+w-1, con la cima en la fila
 * `SURFACE - 1`: la orilla queda a 1 bloque sobre el agua (AGENTS.md §5.1).
 */
const peten = (x: number, w: number): Op[] =>
  Array.from({ length: GROUND - SURFACE + 1 }, (_, i) => ['row', x, SURFACE - 1 + i, 'X'.repeat(w)] as const);

/** Túnel bajo la maraña de raíces: techo en la fila `SURFACE` entre estas columnas. */
const TUNNEL_X0 = 132;
const TUNNEL_X1 = 170;
/** Columna izquierda de cada bolsa de aire (2 columnas de ancho). */
const AIR_POCKETS = [142, 154, 164] as const;
/** Raíz que cuelga del techo del túnel: debajo vive una morena. */
const HANGING_ROOT = 148;
/**
 * Contracorriente del último tramo del túnel (bloques/s). Igual que la de Candelaria
 * (1-5): la prueba acuática del Mundo 2 no es más suave que la del Mundo 1. Se
 * remonta a 2 bloques/s netos y hay respiradero y bolsa de aire a mitad.
 */
const TUNNEL_COUNTER_CURRENT = -2.5;

const inPocket = (x: number): boolean => AIR_POCKETS.some((p) => x === p || x === p + 1);

/** Techo del túnel con huecos donde están las bolsas de aire. */
const tunnelCeiling = (): Op => {
  const blocks = Array.from({ length: TUNNEL_X1 - TUNNEL_X0 + 1 }, (_, i) => (inPocket(TUNNEL_X0 + i) ? ' ' : 'X'));
  return ['row', TUNNEL_X0, SURFACE, blocks.join('')];
};

/** Bolsa de aire cerrada (2×2) sobre el hueco del techo. */
const airPocket = (x: number): Op[] => [
  ['row', x - 1, SURFACE - 3, 'XXXX'],
  ['row', x - 1, SURFACE - 2, 'X  X'],
  ['row', x - 1, SURFACE - 1, 'X  X'],
];

/** Raíces de la fila 0 a la `SURFACE - 1` en la columna x: cierran el paso por arriba. */
const rootWall = (x: number): Op[] => Array.from({ length: SURFACE }, (_, y) => ['row', x, y, 'X'] as const);

/**
 * Petenes: Reserva de la Biosfera Los Petenes, manglares con islas de selva
 * (AGENTS.md §4.3). Nivel acuático: se nada entre raíces de mangle, contra la
 * marea y por un túnel bajo la maraña de raíces.
 *
 * Toh: «Petén quiere decir “isla” en maya: son islas de selva que brotan en medio
 * del manglar, alimentadas por manantiales de agua dulce».
 *
 *   0-28     Orilla de lodo con bloques `?` y cangrejos azules.
 *   29-65    Primera laguna: cortinas de raíces que obligan a bucear, una morena en
 *            su grieta junto a un montículo de raíces y una barracuda.
 *   66-77    Primer petén (islote): orilla a 1 bloque sobre el agua.
 *   78-117   Laguna de la marea: corriente que empuja hacia atrás (2 bloques/s,
 *            remontable), más raíces y otra morena.
 *   118-129  Petén del punto de control (Toh) con un snorkel de caracol.
 *   130-175  Túnel bajo las raíces: tres bolsas de aire, un respiradero de burbujas,
 *            corriente a favor y luego en contra (TUNNEL_COUNTER_CURRENT); morena
 *            colgada del techo.
 *   176-221  Orilla final, poza con marea, bandera y templo.
 */
export const LEVEL_2_4: LevelDef = {
  id: '2-4',
  name: 'Petenes',
  hint: 'Bucea bajo las raíces y recupera aire en los islotes y las bolsas de aire.',
  width: 222,
  theme: 'mangrove',
  checkpoint: 124,
  ops: [
    ['discovery', 56, 11, 'petenes-cooperativas'],
    ['discovery', 16, 11, 'petenes-manglares'],
    // --- Orilla de lodo ---
    ['row', 9, 8, '?M?'], ['coins', 14, 7, 3],
    ['col', 19, 2], ['coins', 19, 4, 2],
    ['stairs', 23, 6, 1],

    // --- Primera laguna ---
    ['water', 29, 65, SURFACE],
    ['coins', 30, 9, 4],
    ...roots(36, 3), ['coins', 36, 10, 3],
    ['coins', 41, 8, 3],
    ['col', 50, 3], ['coins', 47, 8, 2], ['coins', 53, 8, 2],
    ...roots(56, 4), ['coins', 56, 10, 4],
    ['row', 47, 4, '?'],

    // --- Primer petén ---
    ...peten(66, 12), ['row', 70, 2, '?F?'], ['coins', 74, 4, 3],

    // --- Laguna de la marea ---
    ['water', 78, 117, SURFACE],
    ['current', 82, 112, SURFACE, 11, -2, 0],
    ['coins', 82, 8, 4],
    ...roots(88, 3), ['coins', 88, 10, 3],
    ['col', 94, 3], ['coins', 96, 8, 3],
    ...roots(100, 3), ['coins', 100, 10, 3],
    ['coins', 106, 9, 4],

    // --- Petén del punto de control ---
    ...peten(118, 12), ['row', 121, 2, '?S?'],

    // --- Túnel bajo las raíces ---
    ['water', 130, 175, SURFACE],
    ...rootWall(131),
    tunnelCeiling(),
    ...AIR_POCKETS.flatMap(airPocket),
    ['row', HANGING_ROOT, SURFACE + 1, 'X'],
    ['current', 133, 141, SURFACE + 1, 11, 2, 0], // la marea baja ayuda
    ['coins', 134, 9, 6],
    ['coins', 144, 10, 4],
    ['coins', 156, 9, 6], ['bubbles', 160, 11],
    ['current', 156, 163, SURFACE + 1, 11, TUNNEL_COUNTER_CURRENT, 0], // y luego empuja en contra
    ['coins', 166, 10, 3],
    // Premio oculto sobre el techo del túnel (se vuelve desde la orilla final).
    ['coins', 167, SURFACE - 1, 4], ['row', 169, 3, '?'],

    // --- Orilla final ---
    ...peten(176, 6), ['stairs', 182, 5, -1],
    ['row', 186, 8, '?L?'], ['coins', 186, 4, 3],
    ['pit', 192, 196], ['water', 192, 196, 11], ['current', 192, 196, 11, 13, -1.5, 0],
    ['coins', 192, 8, 5],
    ['flag', 205], ['temple', 211],

    ...blueCrab(16, 189, 201),
    ...urchin(44, 104, 150),
    ...morays([51, 10], [95, 10], [HANGING_ROOT, SURFACE + 2]),
    ...barracudas([63, 9], [110, 9], [172, 9]),
    ...waterBank(191, 11, 1), ...waterBank(197, 11, -1),
  ],
};
