/**
 * Leyenda de bloques:
 * G suelo, B ladrillo, ? bloque moneda, M bloque escudo, L bloque vida,
 * F bloque chile de fuego, S bloque snorkel, U bloque usado, X piedra/plataforma,
 * o moneda suelta, p/q tubo arriba, l/r cuerpo del tubo,
 * K culata de cañón de baluarte, > / < boca del cañón hacia la derecha / izquierda.
 */
export const SOLID_TILES: ReadonlySet<string> = new Set(['G', 'B', '?', 'M', 'L', 'F', 'S', 'U', 'X', 'p', 'q', 'l', 'r', 'K', '>', '<']);

export const isSolidTile = (c: string): boolean => SOLID_TILES.has(c);

export type ItemKind = 'shield' | 'life' | 'fire' | 'snorkel';

/** Bloques que sueltan un objeto al golpearlos desde abajo. */
export const ITEM_BLOCKS: Readonly<Record<string, ItemKind>> = { M: 'shield', L: 'life', F: 'fire', S: 'snorkel' };
