import type { Frame } from '../engine/render/artCache';

export const CAMAZOTZ_COMBAT_FILE = 'mundo7/camazotz-combate-v2.webp';
export const CAMAZOTZ_FX_FILE = 'mundo7/camazotz-efectos-v2.webp';
export const CAMAZOTZ_ART_FILES = [CAMAZOTZ_COMBAT_FILE, CAMAZOTZ_FX_FILE] as const;
export const CAMAZOTZ_SCALE = 0.4;

/** Anclas en el cuerpo y los pies: las alas no desplazan la caja de contacto. */
export const CAMAZOTZ_POSES = {
  up: { frame: [16, 22, 462, 432], anchor: [298, 438] },
  down: { frame: [429, 139, 534, 303], anchor: [729, 430] },
  charge: { frame: [955, 163, 369, 292], anchor: [1170, 449] },
  dive: { frame: [1316, 62, 452, 376], anchor: [1568, 420] },
  land: { frame: [8, 494, 571, 347], anchor: [303, 835] },
  cast: { frame: [541, 464, 392, 364], anchor: [749, 822] },
  beam: { frame: [934, 478, 421, 363], anchor: [1208, 832] },
  exposed: { frame: [1427, 607, 329, 233], anchor: [1630, 831] },
} as const satisfies Readonly<Record<string, { frame: Frame; anchor: readonly [number, number] }>>;

/** Conserva el halo transparente de cada efecto; no aislar por componente. */
export const CAMAZOTZ_FX = {
  beamA: [0, 0, 768, 500], beamB: [768, 0, 768, 500],
  orb: [0, 500, 768, 524], wave: [768, 500, 768, 524],
} as const satisfies Readonly<Record<string, Frame>>;
