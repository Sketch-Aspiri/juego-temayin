import type { AnimName } from '../engine/entities/types';
import type { AtlasFrame } from '../engine/render/enemies/atlas';

export interface PlayerSpriteFrame extends AtlasFrame { readonly scale: number }

/** Altura visible compartida: cambiar de pose no encoge al jugador. */
export const PLAYER_ART_HEIGHT = 82;

/** Recortes alfa de guepardo.webp (1360×800), con los pies en su apoyo real. */
export const PLAYER_SPRITES = {
  run: [
    { x: 10, y: 22, w: 150, h: 136, ax: 85, ay: 158, scale: PLAYER_ART_HEIGHT / 136 },
    { x: 179, y: 17, w: 151, h: 141, ax: 255, ay: 158, scale: PLAYER_ART_HEIGHT / 141 },
    { x: 352, y: 25, w: 146, h: 133, ax: 425, ay: 158, scale: PLAYER_ART_HEIGHT / 133 },
    { x: 518, y: 24, w: 154, h: 134, ax: 595, ay: 158, scale: PLAYER_ART_HEIGHT / 134 },
    { x: 694, y: 23, w: 142, h: 135, ax: 765, ay: 158, scale: PLAYER_ART_HEIGHT / 135 },
    { x: 860, y: 24, w: 149, h: 134, ax: 935, ay: 158, scale: PLAYER_ART_HEIGHT / 134 },
    { x: 1031, y: 17, w: 148, h: 141, ax: 1105, ay: 158, scale: PLAYER_ART_HEIGHT / 141 },
  ],
  jump: [
    { x: 12, y: 203, w: 146, h: 115, ax: 85, ay: 318, scale: PLAYER_ART_HEIGHT / 115 },
    { x: 182, y: 187, w: 145, h: 131, ax: 255, ay: 318, scale: PLAYER_ART_HEIGHT / 131 },
    { x: 358, y: 178, w: 134, h: 140, ax: 425, ay: 318, scale: PLAYER_ART_HEIGHT / 140 },
    { x: 531, y: 174, w: 128, h: 144, ax: 595, ay: 318, scale: PLAYER_ART_HEIGHT / 144 },
    { x: 702, y: 183, w: 126, h: 135, ax: 765, ay: 318, scale: PLAYER_ART_HEIGHT / 135 },
    { x: 873, y: 199, w: 124, h: 119, ax: 935, ay: 318, scale: PLAYER_ART_HEIGHT / 119 },
    { x: 1046, y: 207, w: 117, h: 111, ax: 1105, ay: 318, scale: PLAYER_ART_HEIGHT / 111 },
    { x: 1210, y: 221, w: 129, h: 97, ax: 1275, ay: 318, scale: PLAYER_ART_HEIGHT / 97 },
  ],
  fall: [
    { x: 23, y: 357, w: 123, h: 121, ax: 85, ay: 478, scale: PLAYER_ART_HEIGHT / 121 },
    { x: 194, y: 358, w: 122, h: 120, ax: 255, ay: 478, scale: PLAYER_ART_HEIGHT / 120 },
    { x: 367, y: 362, w: 115, h: 116, ax: 425, ay: 478, scale: PLAYER_ART_HEIGHT / 116 },
    { x: 538, y: 367, w: 113, h: 111, ax: 595, ay: 478, scale: PLAYER_ART_HEIGHT / 111 },
    { x: 709, y: 367, w: 112, h: 111, ax: 765, ay: 478, scale: PLAYER_ART_HEIGHT / 111 },
    { x: 866, y: 381, w: 137, h: 97, ax: 935, ay: 478, scale: PLAYER_ART_HEIGHT / 97 },
    { x: 1038, y: 385, w: 134, h: 93, ax: 1105, ay: 478, scale: PLAYER_ART_HEIGHT / 93 },
  ],
  idle: [
    { x: 35, y: 522, w: 99, h: 116, ax: 85, ay: 638, scale: PLAYER_ART_HEIGHT / 116 },
    { x: 205, y: 523, w: 100, h: 115, ax: 255, ay: 638, scale: PLAYER_ART_HEIGHT / 115 },
    { x: 378, y: 524, w: 94, h: 114, ax: 425, ay: 638, scale: PLAYER_ART_HEIGHT / 114 },
    { x: 545, y: 526, w: 100, h: 112, ax: 595, ay: 638, scale: PLAYER_ART_HEIGHT / 112 },
    { x: 716, y: 527, w: 97, h: 111, ax: 765, ay: 638, scale: PLAYER_ART_HEIGHT / 111 },
    { x: 884, y: 525, w: 102, h: 113, ax: 935, ay: 638, scale: PLAYER_ART_HEIGHT / 113 },
    { x: 1054, y: 525, w: 101, h: 113, ax: 1105, ay: 638, scale: PLAYER_ART_HEIGHT / 113 },
  ],
  win: [
    { x: 26, y: 695, w: 118, h: 103, ax: 85, ay: 798, scale: PLAYER_ART_HEIGHT / 103 },
    { x: 198, y: 689, w: 113, h: 109, ax: 255, ay: 798, scale: PLAYER_ART_HEIGHT / 109 },
    { x: 373, y: 688, w: 103, h: 110, ax: 425, ay: 798, scale: PLAYER_ART_HEIGHT / 110 },
    { x: 544, y: 690, w: 101, h: 108, ax: 595, ay: 798, scale: PLAYER_ART_HEIGHT / 108 },
    { x: 711, y: 691, w: 108, h: 107, ax: 765, ay: 798, scale: PLAYER_ART_HEIGHT / 107 },
    { x: 882, y: 691, w: 106, h: 107, ax: 935, ay: 798, scale: PLAYER_ART_HEIGHT / 107 },
    { x: 1049, y: 692, w: 112, h: 106, ax: 1105, ay: 798, scale: PLAYER_ART_HEIGHT / 106 },
  ],
} as const satisfies Readonly<Record<AnimName, readonly PlayerSpriteFrame[]>>;
