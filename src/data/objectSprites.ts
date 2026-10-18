import type { Frame } from '../engine/render/artCache';

/** Recortes por alfa del atlas de objetos compartidos por el juego y la tienda. */
export const OBJECTS_FILE = 'objetos/objetos.webp';
export const OBJECTS_SHEET_SIZE = 1254;
export const OBJECT_FRAMES = {
  cacao: [56, 84, 316, 300],
  chile: [492, 40, 276, 368],
  jadeHeart: [884, 88, 340, 300],
  shield: [28, 444, 372, 376],
  snorkel: [432, 448, 404, 372],
  ball: [900, 480, 320, 324],
  rope: [28, 868, 392, 340],
  glyph: [492, 864, 272, 336],
  ticket: [836, 920, 392, 264],
} as const satisfies Readonly<Record<string, Frame>>;

export type ObjectId = keyof typeof OBJECT_FRAMES;
