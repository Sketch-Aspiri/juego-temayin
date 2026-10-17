import type { GameplaySprite } from './gameplaySprites';
import type { TexId } from '../engine/render/textures';
import { COAST_TILES_FILE } from './world6Art';

export interface TerrainSprite extends GameplaySprite {
  readonly base: string;
  /** Cuadros contiguos del mismo material: se eligen por columna y profundidad. */
  readonly columns?: number;
  readonly rows?: number;
}
const FILE = 'complementos/bloques.webp';
const MUD_FILE = 'terreno/suelo-pantano.webp';

/** La primera fila lleva pasto; las tres siguientes continúan raíces y tierra sin bordes. */
export const MUD_TERRAIN_SPRITES = {
  mudTop: { file: MUD_FILE, frame: [0, 0, 256, 256], anchor: [0, 0], base: '#56341c', columns: 6 },
  mud: { file: MUD_FILE, frame: [0, 256, 256, 256], anchor: [0, 0], base: '#56341c', columns: 6, rows: 3 },
} as const satisfies Readonly<Record<string, TerrainSprite>>;

/** El suelo nuevo de pantano convive con el terreno pintado del atlas histórico. */
export const TERRAIN_SPRITES: Readonly<Partial<Record<TexId, TerrainSprite>>> = {
  trainRoof: { file: COAST_TILES_FILE, frame: [0, 0, 313, 223], anchor: [0, 0], columns: 4, base: '#859ba0' },
  trainSide: { file: COAST_TILES_FILE, frame: [0, 223, 313, 395], anchor: [0, 0], columns: 4, base: '#145b50' },
  shipDeck: { file: COAST_TILES_FILE, frame: [0, 618, 313, 254], anchor: [0, 0], columns: 4, base: '#6b4027' },
  shipHull: { file: COAST_TILES_FILE, frame: [0, 872, 313, 382], anchor: [0, 0], columns: 4, base: '#57321e' },
  ...MUD_TERRAIN_SPRITES,
  grass: { file: FILE, frame: [42, 22, 300, 283], anchor: [0, 0], isolated: true, base: '#80542d' },
  dirt: { file: FILE, frame: [368, 52, 269, 252], anchor: [0, 0], isolated: true, base: '#80542d' },
  sandTop: { file: FILE, frame: [672, 50, 278, 254], anchor: [0, 0], isolated: true, base: '#d5b076' },
  sand: { file: FILE, frame: [991, 52, 274, 252], anchor: [0, 0], isolated: true, base: '#d5b076' },
  stone: { file: FILE, frame: [368, 337, 274, 254], anchor: [0, 0], isolated: true, base: '#a39776' },
  rockTop: { file: FILE, frame: [673, 332, 279, 259], anchor: [0, 0], isolated: true, base: '#263b48' },
  rock: { file: FILE, frame: [989, 332, 280, 259], anchor: [0, 0], isolated: true, base: '#263b48' },
  wood: { file: FILE, frame: [44, 613, 288, 248], anchor: [0, 0], isolated: true, base: '#694422' },
  crystal: { file: FILE, frame: [362, 616, 280, 238], anchor: [0, 0], isolated: true, base: '#237b7b' },
};
