/**
 * Leyenda de bloques:
 * G suelo, B ladrillo, ? bloque moneda, M bloque escudo, L bloque vida,
 * F bloque chile de fuego, U bloque usado, X piedra/plataforma,
 * o moneda suelta, p/q tubo arriba, l/r cuerpo del tubo.
 */
export const SOLID_TILES: ReadonlySet<string> = new Set(['G', 'B', '?', 'M', 'L', 'F', 'U', 'X', 'p', 'q', 'l', 'r']);

export const isSolidTile = (c: string): boolean => SOLID_TILES.has(c);

export type ItemKind = 'shield' | 'life' | 'fire';

/** Bloques que sueltan un objeto al golpearlos desde abajo. */
export const ITEM_BLOCKS: Readonly<Record<string, ItemKind>> = { M: 'shield', L: 'life', F: 'fire' };
