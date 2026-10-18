import type { SpriteRef } from './intro';
import type { EnemyId } from '../engine/types';

/** Recortes alfa medidos por imagenes/import_hanal_pixan_art.mjs. */
const sprite = (name: string, frame: SpriteRef['frame']): SpriteRef => ({
  file: `temporada/hanal-pixan/${name}.webp`, sheetW: 1254, sheetH: 1254, frame,
});
export const HANAL_PIXAN_BACKGROUND = 'portada/palenque-hanal-pixan.webp';
export const HANAL_PIXAN_SPRITES = {
  temayin: sprite('temayin', [108, 3, 1027, 1251]),
  temayina: sprite('temayina', [135, 7, 916, 1236]),
  toh: sprite('toh', [18, 9, 1235, 1227]),
  coati: sprite('coati', [79, 11, 1166, 1229]),
  bat: sprite('murcielago', [16, 191, 1229, 796]),
  alux: sprite('alux', [122, 38, 1081, 1181]),
  ants: sprite('hormiga-arriera', [18, 162, 1221, 891]),
  firefly: sprite('luciernaga', [34, 33, 1201, 1164]),
} as const;
export const HANAL_PIXAN_ENEMIES: Readonly<Partial<Record<EnemyId, SpriteRef>>> = {
  coati: HANAL_PIXAN_SPRITES.coati, bat: HANAL_PIXAN_SPRITES.bat,
  alux: HANAL_PIXAN_SPRITES.alux, ants: HANAL_PIXAN_SPRITES.ants,
};
export const HANAL_PIXAN_ART_FILES: readonly string[] = [HANAL_PIXAN_BACKGROUND,
  ...Object.values(HANAL_PIXAN_SPRITES).map(art => art.file)];
