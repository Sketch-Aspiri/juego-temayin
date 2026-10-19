import type { SpriteRef } from './intro';
import type { Frame } from '../engine/render/artCache';
import { CAMAZOTZ_ART_FILES } from './camazotzArt';

export const WORLD7_EFFECTS_FILE = 'mundo7/efectos-camazotz.webp';
export const WORLD7_BRAZIER_FILE = 'mundo7/brasero-jade.webp';
export const WORLD7_BRAZIER_FRAME = [256, 24, 752, 1128] as const satisfies Frame;
export const WORLD7_EFFECTS = {
  bolt: [0, 108, 581, 355], shard: [644, 0, 413, 526], mote: [1103, 35, 433, 464],
  gust: [0, 550, 543, 444], wave: [546, 568, 568, 416], sun: [1117, 536, 419, 473],
} as const satisfies Readonly<Record<string, Frame>>;
export const REUNION_SPRITE: SpriteRef = {
  file: 'mundo7/reencuentro.webp', sheetW: 1536, sheetH: 1024, frame: [0, 0, 1536, 1024],
};
export const WORLD7_ART_FILES: readonly string[] = [
  ...CAMAZOTZ_ART_FILES,
  WORLD7_EFFECTS_FILE, WORLD7_BRAZIER_FILE, REUNION_SPRITE.file, 'backgrounds/rioBec.webp',
  'bosses/camazotz.webp', 'backgrounds/batCave.webp', 'backgrounds/throne.webp',
  'mundo7/calakmul-amanecer.webp',
];

/** Se aíslan las poses del atlas histórico que rozan las de al lado. */
export const CAMAZOTZ_FRAMES = {
  rest: [19, 93, 373, 324], fly: [398, 1, 451, 429], dive: [859, 100, 381, 309],
  stalk: [10, 503, 404, 289], invoke: [429, 449, 448, 356], dazed: [838, 552, 406, 248],
  eclipse: [6, 808, 451, 382], beam: [428, 820, 502, 420], defeated: [914, 924, 325, 276],
} as const satisfies Readonly<Record<string, Frame>>;
