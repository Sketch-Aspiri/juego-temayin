import type { Frame } from '../engine/render/artCache';

export interface ScenerySprite {
  readonly file: string;
  readonly frame: Frame;
  /** Ancla normalizada dentro del recorte; coincide con suelo o centro de la llama. */
  readonly anchor: readonly [number, number];
}

export const SCENERY_SPRITES = {
  arcade: { file: 'escenarios/arcada-izamal.webp', frame: [24, 105, 1488, 775], anchor: [0.5, 1] },
  lair: { file: 'escenarios/guarida-puas.webp', frame: [19, 111, 1504, 775], anchor: [0.5, 1] },
  torch: { file: 'complementos/utileria.webp', frame: [1191, 346, 249, 332], anchor: [185 / 249, 90 / 332] },
  ceiba: { file: 'complementos/vegetacion.webp', frame: [9, 7, 619, 507], anchor: [0.5, 1] },
  mangrove: { file: 'complementos/vegetacion.webp', frame: [549, 527, 548, 484], anchor: [0.5, 1] },
  vines: { file: 'complementos/vegetacion.webp', frame: [1155, 527, 314, 486], anchor: [0.5, 0] },
  log: { file: 'mecanicas/mecanicas.webp', frame: [994, 154, 517, 149], anchor: [0, 0] },
} as const satisfies Readonly<Record<string, ScenerySprite>>;

export type ScenerySpriteId = keyof typeof SCENERY_SPRITES;
