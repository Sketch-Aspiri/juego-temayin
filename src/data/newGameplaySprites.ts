import type { GameplaySprite } from './gameplaySprites';

/** Arte generado para los elementos que carecían de sprite independiente. */
export const NEW_GAMEPLAY_SPRITES = {
  quill: { file: 'proyectiles/pua.webp', frame: [129, 241, 1915, 241], anchor: [0.5, 0.5] },
  fruit: { file: 'proyectiles/fruto.webp', frame: [193, 105, 1023, 995], anchor: [0.5, 0.5] },
  wisp: { file: 'proyectiles/fuego-fatuo.webp', frame: [256, 97, 682, 1197], anchor: [0.5, 0.5] },
  algaeBall: { file: 'proyectiles/bola-sargazo.webp', frame: [109, 79, 1075, 1078], anchor: [0.5, 0.5] },
  waterWave: { file: 'proyectiles/ola-agua.webp', frame: [45, 96, 1689, 684], anchor: [0.5, 1] },
  spectralWave: { file: 'proyectiles/onda-espectral.webp', frame: [349, 82, 985, 857], anchor: [0.5, 1] },
  awning: { file: 'complementos/toldo.webp', frame: [13, 160, 2147, 445], anchor: [0, 0] },
  mud: { file: 'proyectiles/lodo.webp', frame: [296, 239, 745, 747], anchor: [0.5, 0.5] },
  propagule: { file: 'proyectiles/propagulo-mangle.webp', frame: [401, 62, 220, 1391], anchor: [0.5, 1] },
  kaimanSpit: { file: 'bosses/kaiman-escupitajo.webp', frame: [90, 257, 1631, 535], anchor: [0.5, 1] },
  kaimanSlam: { file: 'bosses/kaiman-mangle.webp', frame: [111, 51, 1338, 931], anchor: [0.5, 1] },
  cannonball: { file: 'proyectiles/bala-canon.webp', frame: [247, 207, 792, 791], anchor: [0.5, 0.5] },
  cannonSmoke: { file: 'proyectiles/humo-canon.webp', frame: [160, 136, 1860, 500], anchor: [1, 0.5] },
} as const satisfies Readonly<Record<string, GameplaySprite>>;

export type NewGameplaySpriteId = keyof typeof NEW_GAMEPLAY_SPRITES;
