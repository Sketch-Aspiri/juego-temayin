/**
 * Leyenda de bloques:
 * G suelo, B sillar rompible, ? cofre de cacao, M cofre escudo, L cofre vida,
 * F cofre chile de fuego, S cofre snorkel, U cofre vacío, X piedra/plataforma,
 * o cacao suelto, p/q remate de columna, l/r cuerpo de columna (op `pipe` conservada),
 * D escombro que se derrumba (op `crumble`, ver `entities/crumble.ts`).
 * K culata de cañón de baluarte, > / < boca del cañón hacia la derecha / izquierda.
 * E estromatolito de Bacalar (op `stromatolite`, ver `entities/stromatolites.ts`).
 * P bloque pelota de pok ta pok (ver `entities/ball.ts`).
 */
export const SOLID_TILES: ReadonlySet<string> = new Set(['G', 'B', '?', 'M', 'L', 'F', 'S', 'U', 'X', 'p', 'q', 'l', 'r',
  'D', 'K', '>', '<',
  'P', 'E']);

export const isSolidTile = (c: string): boolean => SOLID_TILES.has(c);

export type ItemKind = 'shield' | 'life' | 'fire' | 'snorkel' | 'ball';

/** Bloques que sueltan un objeto al golpearlos desde abajo. */
export const ITEM_BLOCKS: Readonly<Record<string, ItemKind>> = { M: 'shield', L: 'life', F: 'fire', S: 'snorkel', P: 'ball' };
