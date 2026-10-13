import type { Frame } from '../engine/render/artCache';

export const TOH_FILE = 'personajes/toh.webp';

interface TohPose {
  readonly frame: Frame;
  /** Apoyo de las patas, en coordenadas del atlas. */
  readonly footX: number;
  readonly footY: number;
}

/** Recortes completos del atlas; las poses solapadas se aíslan por su silueta alfa. */
export const TOH_POSES = {
  perch: { frame: [24, 20, 446, 452], footX: 330, footY: 332 },
  perchLook: { frame: [522, 20, 399, 454], footX: 815, footY: 332 },
  perchTail: { frame: [1088, 15, 427, 425], footX: 1215, footY: 335 },
  flyUp: { frame: [20, 460, 562, 529], footX: 300, footY: 870 },
  flyDown: { frame: [503, 568, 555, 377], footX: 730, footY: 810 },
  point: { frame: [970, 555, 554, 456], footX: 1255, footY: 905 },
} as const satisfies Readonly<Record<string, TohPose>>;

export type TohPoseId = keyof typeof TOH_POSES;
