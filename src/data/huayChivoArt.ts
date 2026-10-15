import type { Frame } from '../engine/render/artCache';
import type { ChivoState } from '../engine/bosses/huayChivo';

export interface ChivoArt {
  readonly file: string;
  readonly frame: Frame;
  /** Coordenadas dentro del atlas: punto entre pezuñas, o base del efecto. */
  readonly anchor: readonly [number, number];
  readonly scale: number;
}
const ACTIONS = 'bosses/huayChivo-acciones.webp';
const ORIGINAL = 'bosses/huayChivo.webp';
const EFFECTS = 'proyectiles/huayChivo-efectos.webp';
/** La escala anatómica permanece fija: no se iguala la altura de posturas diferentes. */
const BODY_SCALE = 0.27;

export const CHIVO_POSES = {
  rest: { file: ORIGINAL, frame: [42, 64, 427, 466], anchor: [255.5, 530], scale: BODY_SCALE },
  run: { file: ORIGINAL, frame: [517, 139, 488, 390], anchor: [761, 529], scale: BODY_SCALE },
  horn: { file: ORIGINAL, frame: [1035, 142, 494, 389], anchor: [1282, 531], scale: BODY_SCALE },
  blink: { file: ORIGINAL, frame: [36, 539, 474, 420], anchor: [273, 959], scale: BODY_SCALE },
  dazed: { file: ORIGINAL, frame: [556, 571, 441, 385], anchor: [776.5, 956], scale: BODY_SCALE },
  dead: { file: ORIGINAL, frame: [1006, 718, 527, 238], anchor: [1269.5, 956], scale: BODY_SCALE },
  paw: { file: ACTIONS, frame: [6, 74, 459, 331], anchor: [309, 401], scale: BODY_SCALE },
  crouch: { file: ACTIONS, frame: [467, 87, 447, 323], anchor: [684, 395], scale: BODY_SCALE },
  leap: { file: ACTIONS, frame: [914, 18, 395, 321], anchor: [1105, 339], scale: BODY_SCALE },
  land: { file: ACTIONS, frame: [1320, 103, 448, 303], anchor: [1544, 402], scale: BODY_SCALE },
  rear: { file: ACTIONS, frame: [52, 421, 397, 438], anchor: [213, 858], scale: BODY_SCALE },
  call: { file: ACTIONS, frame: [477, 410, 447, 458], anchor: [663, 860], scale: BODY_SCALE },
  hurt: { file: ACTIONS, frame: [924, 467, 368, 392], anchor: [1140, 858], scale: BODY_SCALE },
  nightfall: { file: ACTIONS, frame: [1337, 451, 410, 408], anchor: [1539, 858], scale: BODY_SCALE },
} as const satisfies Readonly<Record<string, ChivoArt>>;

export const CHIVO_STATE_POSE: Readonly<Record<ChivoState, keyof typeof CHIVO_POSES>> = {
  sleep: 'rest', intro: 'rest', idle: 'rest', land: 'land', nightfall: 'nightfall',
  paw: 'paw', crouch: 'crouch', call: 'call', turn: 'paw',
  charge: 'run', leap: 'leap', rear: 'rear', horn: 'horn', recover: 'rest',
  fade: 'blink', hidden: 'blink', appear: 'blink',
  dazed: 'dazed', hurt: 'hurt', dead: 'dead', gone: 'dead',
};
/** Centros de ojos medidos en los PNG: la señal sigue la cabeza al agacharse o encabritarse. */
export const CHIVO_EYES: Readonly<Record<keyof typeof CHIVO_POSES, readonly [number, number]>> = {
  rest: [392, 232], run: [947, 366], horn: [1436, 453], blink: [380, 650],
  dazed: [895, 793], dead: [1394, 886], paw: [407, 316], crouch: [814, 336],
  leap: [1257, 207], land: [1673, 297], rear: [310, 511], call: [746, 496],
  hurt: [1201, 670], nightfall: [1649, 498],
};

export const CHIVO_EFFECTS = {
  smoke0: [80, 179, 335, 375], smoke1: [528, 52, 408, 509], smoke2: [976, 40, 527, 527],
  wave: [33, 672, 669, 270], stucco: [792, 688, 133, 188],
  torchOff: [1037, 627, 253, 356], torchOn: [1290, 550, 211, 431],
} as const satisfies Readonly<Record<string, Frame>>;
export const CHIVO_EFFECT_FILE = EFFECTS;
export const CHIVO_ART_FILES = [ACTIONS, EFFECTS, 'escenarios/arcada-izamal-noche.webp'] as const;
/** Las dos versiones comparten escala y punto de mecha, aunque la llama cambia el recorte. */
export const CHIVO_TORCH_ART = {
  on: { frame: CHIVO_EFFECTS.torchOn, anchor: [1428, 650], scale: 0.15 },
  off: { frame: CHIVO_EFFECTS.torchOff, anchor: [1174, 650], scale: 0.15 },
} as const;
