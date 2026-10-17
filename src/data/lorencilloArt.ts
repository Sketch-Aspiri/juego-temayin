import type { LorenState } from '../engine/bosses/lorencillo';
import type { Frame } from '../engine/render/artCache';

/**
 * Ocho acciones nuevas medidas por alfa, junto a preparación y derrota del atlas
 * histórico. Escala única y anclas en las aletas: el sable no desplaza el cuerpo.
 */
export interface LorenArt {
  readonly file: string;
  readonly frame: Frame;
  /** Centro inferior del recorte, dentro del atlas: punto de apoyo en cubierta. */
  readonly anchor: readonly [number, number];
  readonly scale: number;
}

export const LORENCILLO_FILE = 'bosses/lorencillo.webp';
export const LORENCILLO_ACTIONS_FILE = 'bosses/lorencillo-acciones.webp';
const BODY_SCALE = 0.26;

const pose = (frame: Frame): LorenArt => ({
  file: LORENCILLO_FILE,
  frame,
  anchor: [frame[0] + frame[2] / 2, frame[1] + frame[3]],
  scale: BODY_SCALE,
});

/** Anclas medidas sobre las aletas de apoyo, sin centrar por el largo del sable. */
const action = (frame: Frame, anchor: readonly [number, number]): LorenArt => ({
  file: LORENCILLO_ACTIONS_FILE, frame, anchor, scale: BODY_SCALE,
});

export const LORENCILLO_POSES = {
  rest: action([20, 39, 420, 381], [232, 420]),
  advance: action([452, 81, 437, 333], [698, 414]),
  lunge: action([865, 81, 511, 334], [1110, 415]),
  prepare: pose([54, 555, 442, 396]),
  exposed: action([1395, 54, 368, 360], [1584, 414]),
  cannon: action([31, 466, 439, 374], [245, 840]),
  climb: action([493, 443, 307, 409], [648, 852]),
  throw: action([864, 487, 411, 350], [1090, 837]),
  rally: action([1367, 465, 388, 373], [1560, 838]),
  defeated: pose([1053, 605, 431, 361]),
} as const satisfies Readonly<Record<string, LorenArt>>;

/** Pose de cada estado: obliga a TypeScript a cubrir los estados nuevos. */
export const LORENCILLO_STATE_POSE: Readonly<Record<LorenState, keyof typeof LORENCILLO_POSES>> = {
  sleep: 'rest', intro: 'rest', idle: 'rest', advance: 'advance', warn: 'prepare', lunge: 'lunge',
  exposed: 'exposed', cannon: 'cannon', mast: 'climb', rally: 'rally', hurt: 'exposed', dead: 'defeated', gone: 'defeated',
};
