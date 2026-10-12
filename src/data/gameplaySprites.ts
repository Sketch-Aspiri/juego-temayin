import type { Frame } from '../engine/render/artCache';

export interface GameplaySprite {
  readonly file: string;
  readonly frame: Frame;
  /** Ancla normalizada: centro de impacto o superficie de apoyo. */
  readonly anchor: readonly [number, number];
}

const MECHANICS = 'mecanicas/mecanicas.webp';
const PROPS = 'complementos/utileria.webp';
const PLAYER = 'personajes/jugador-mecanicas.webp';

/** Recortes del arte existente que faltaba conectar a las mecánicas jugables. */
export const GAMEPLAY_SPRITES = {
  boat: { file: PROPS, frame: [935, 79, 584, 273], anchor: [0, 54 / 273] },
  turtle: { file: PROPS, frame: [1043, 717, 480, 266], anchor: [67 / 480, 13 / 266] },
  palapa: { file: PROPS, frame: [28, 330, 487, 354], anchor: [0, 0] },
  cannon: { file: PROPS, frame: [566, 386, 531, 304], anchor: [0, 0] },
  hoop: { file: MECHANICS, frame: [668, 368, 265, 261], anchor: [139 / 265, 144 / 261] },
  log: { file: MECHANICS, frame: [994, 154, 517, 149], anchor: [0, 0] },
  rope: { file: MECHANICS, frame: [751, 0, 111, 350], anchor: [0.5, 0] },
  fragile: { file: MECHANICS, frame: [44, 464, 531, 177], anchor: [0, 0] },
  sargassum: { file: MECHANICS, frame: [17, 739, 592, 239], anchor: [0, 1] },
  resin: { file: MECHANICS, frame: [628, 776, 398, 185], anchor: [0, 1] },
  // Se excluyen la cuerda superior y la pelota ya en vuelo para evitar duplicarlas.
  hanging: { file: PLAYER, frame: [105, 548, 264, 410], anchor: [155 / 264, 60 / 410] },
  swinging: { file: PLAYER, frame: [555, 571, 400, 375], anchor: [168 / 400, 49 / 375] },
  throwing: { file: PLAYER, frame: [1025, 600, 386, 365], anchor: [0.5, 1] },
} as const satisfies Readonly<Record<string, GameplaySprite>>;

export type GameplaySpriteId = keyof typeof GAMEPLAY_SPRITES;
