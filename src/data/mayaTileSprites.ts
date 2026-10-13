import type { GameplaySprite } from './gameplaySprites';

/** Arte de fantasía inspirado en piedra, jade y cacao; no reproduce glifos históricos. */
export const MAYA_TILE_SPRITES = {
  reward: { file: 'complementos/cofre-cacao.webp', frame: [103, 95, 1049, 1055], anchor: [0, 0] },
  spent: { file: 'complementos/cofre-vacio.webp', frame: [102, 92, 1052, 1061], anchor: [0, 0] },
  brick: { file: 'complementos/sillar-fragil.webp', frame: [101, 108, 1052, 1036], anchor: [0, 0] },
  columnCap: { file: 'complementos/estela-remate.webp', frame: [32, 186, 1710, 516], anchor: [0, 0] },
  columnBody: { file: 'complementos/estela-cuerpo.webp', frame: [47, 77, 1681, 730], anchor: [0, 0] },
} as const satisfies Readonly<Record<string, GameplaySprite>>;
