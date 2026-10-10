/**
 * Leyenda de bloques:
 * G suelo, B ladrillo, ? bloque moneda, M bloque escudo, L bloque vida,
 * F bloque chile de fuego, S bloque snorkel, U bloque usado, X piedra/plataforma,
 * o moneda suelta, p/q tubo arriba, l/r cuerpo del tubo,
 * D escombro que se derrumba (op `crumble`, ver `entities/crumble.ts`).
 */
export const SOLID_TILES: ReadonlySet<string> = new Set(['G', 'B', '?', 'M', 'L', 'F', 'S', 'U', 'X', 'p', 'q', 'l', 'r',
  'D']);

export const isSolidTile = (c: string): boolean => SOLID_TILES.has(c);

export type ItemKind = 'shield' | 'life' | 'fire' | 'snorkel';

/** Bloques que sueltan un objeto al golpearlos desde abajo. */
export const ITEM_BLOCKS: Readonly<Record<string, ItemKind>> = { M: 'shield', L: 'life', F: 'fire', S: 'snorkel' };
