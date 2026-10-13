import type { GameplaySprite } from './gameplaySprites';
import type { TexId } from '../engine/render/textures';

interface TerrainSprite extends GameplaySprite { readonly base: string }
const FILE = 'complementos/bloques.webp';

/** Se aprovecha el terreno pintado del atlas existente, sin sus tubos ni cajas antiguas. */
export const TERRAIN_SPRITES: Readonly<Partial<Record<TexId, TerrainSprite>>> = {
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
