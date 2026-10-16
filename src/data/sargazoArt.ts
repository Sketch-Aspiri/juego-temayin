import type { Frame } from '../engine/render/artCache';

export const SARGAZO_ACTION_FILE = 'bosses/sargazo-acciones.webp';
export const SARGAZO_ALLY_FILE = 'mecanicas/tortugas-akumal.webp';
export const SARGAZO_ARENA_FILE = 'escenarios/akumal-submarino.webp';
export const SARGAZO_ART_FILES = [SARGAZO_ACTION_FILE, SARGAZO_ALLY_FILE, SARGAZO_ARENA_FILE] as const;
/** Escala fija del personaje: las poses horizontales no se estiran a la altura de las verticales. */
export const SARGAZO_SCALE = 0.29;
export const SARGAZO_POSES = {
  swim: [7, 104, 483, 250], surge: [460, 80, 440, 321], whirlpool: [870, 27, 434, 398],
  net: [1290, 66, 483, 346], core: [20, 469, 440, 379], hurt: [455, 474, 440, 373],
  rage: [892, 417, 428, 436], dead: [1295, 621, 469, 228],
} as const satisfies Readonly<Record<string, Frame>>;
export const SARGAZO_EFFECTS = {
  whirlpool: [51, 468, 411, 397], seed: [530, 545, 264, 257],
  netLoop: [840, 493, 521, 352], pulse: [1401, 520, 314, 304],
} as const satisfies Readonly<Record<string, Frame>>;
/** Ancla en el centro del caparazón a la altura donde se apoya el jugador. */
export const AKUMAL_TURTLES = {
  swim: { frame: [19, 164, 451, 240], anchor: [235, 170] },
  net: { frame: [455, 105, 419, 327], anchor: [665, 180] },
  air: { frame: [887, 57, 448, 384], anchor: [1105, 195] },
  boost: { frame: [1300, 57, 464, 393], anchor: [1535, 190] },
} as const satisfies Readonly<Record<string, { readonly frame: Frame; readonly anchor: readonly [number, number] }>>;
