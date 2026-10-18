import type { BossId } from '../engine/types';
import type { SpriteRef } from './intro';

/** Generado por imagenes/import_cinematic_art.py a partir del alfa original. */
export const BOSS_VICTORY_SPRITES = {
  kaiman: {
    defeated: { file: 'cinematicas/kaiman-victoria.webp', sheetW: 1983, sheetH: 793, frame: [110, 285, 874, 418] },
    farewell: { file: 'cinematicas/kaiman-victoria.webp', sheetW: 1983, sheetH: 793, frame: [1177, 131, 714, 566] },
  },
  huayChivo: {
    defeated: { file: 'cinematicas/huayChivo-victoria.webp', sheetW: 1983, sheetH: 793, frame: [64, 102, 724, 649] },
    farewell: { file: 'cinematicas/huayChivo-victoria.webp', sheetW: 1983, sheetH: 793, frame: [1069, 31, 889, 733] },
  },
  huayPek: {
    defeated: { file: 'cinematicas/huayPek-victoria.webp', sheetW: 1774, sheetH: 887, frame: [42, 343, 817, 460] },
    farewell: { file: 'cinematicas/huayPek-victoria.webp', sheetW: 1774, sheetH: 887, frame: [993, 104, 761, 694] },
  },
  sargazo: {
    defeated: { file: 'cinematicas/sargazo-victoria.webp', sheetW: 1774, sheetH: 887, frame: [60, 220, 890, 613] },
    farewell: { file: 'cinematicas/sargazo-victoria.webp', sheetW: 1774, sheetH: 887, frame: [1028, 50, 674, 786] },
  },
  lorencillo: {
    defeated: { file: 'cinematicas/lorencillo-victoria.webp', sheetW: 1774, sheetH: 887, frame: [49, 215, 819, 597] },
    farewell: { file: 'cinematicas/lorencillo-victoria.webp', sheetW: 1774, sheetH: 887, frame: [986, 77, 750, 741] },
  },
} as const satisfies Readonly<Record<Exclude<BossId, 'puas'>, Readonly<Record<'defeated' | 'farewell', SpriteRef>>>>;

export const TEMAYIN_CINEMATIC_POSES = {
  celebrate: { file: 'cinematicas/temayin-emociones.webp', sheetW: 1774, sheetH: 887, frame: [53, 5, 731, 882] },
  grateful: { file: 'cinematicas/temayin-emociones.webp', sheetW: 1774, sheetH: 887, frame: [1010, 0, 733, 887] },
  listen: { file: 'cinematicas/temayin-aventura.webp', sheetW: 1774, sheetH: 887, frame: [34, 88, 706, 779] },
  journey: { file: 'cinematicas/temayin-aventura.webp', sheetW: 1774, sheetH: 887, frame: [905, 14, 827, 856] },
  swim: { file: 'cinematicas/temayin-viaje.webp', sheetW: 2172, sheetH: 724, frame: [27, 18, 1087, 642] },
  seated: { file: 'cinematicas/temayin-viaje.webp', sheetW: 2172, sheetH: 724, frame: [1391, 0, 689, 714] },
} as const satisfies Readonly<Record<string, SpriteRef>>;

export const CINEMATIC_DECK_BACKGROUND = 'cinematicas/cubierta-chetumal.webp';
export const CINEMATIC_TRAIN_BACKGROUND = 'cinematicas/interior-tren.webp';
