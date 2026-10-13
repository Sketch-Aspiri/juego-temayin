import { TOH_POSES } from './tohSprites';
import { TEMAYIN_EXPRESSIONS } from './temayinExpressions';

/**
 * Cinemática de introducción (AGENTS.md §4.1): cuenta la historia antes del
 * nivel 1-1. Solo datos; `ui/screens/IntroScreen.tsx` la reproduce.
 */

/** Recorte de una hoja de sprites: archivo, tamaño de la hoja y rectángulo [x, y, w, h]. */
export interface SpriteRef {
  file: string;
  sheetW: number;
  sheetH: number;
  frame: readonly [x: number, y: number, w: number, h: number];
  /** Aísla la silueta cuando el rectángulo invade otra pose del atlas. */
  isolated?: boolean;
}

/** Movimiento de entrada o en bucle de un personaje (clases `intro-actor--<anim>`). */
export type ActorAnim = 'enter-left' | 'enter-right' | 'float' | 'carried' | 'fly-in' | 'descend' | 'still';

export interface IntroActor {
  sprite: SpriteRef;
  /** Posición horizontal del centro, en % del escenario. */
  x: number;
  /** Distancia del suelo, en % del escenario. */
  bottom: number;
  /** Alto del sprite, en % del escenario. */
  height: number;
  flip?: boolean;
  anim: ActorAnim;
  /** Brillo del Sol de Jade entre las manos. */
  glow?: boolean;
}

/** Efectos de escena dibujados con CSS/SVG. */
export type IntroEffect = 'sunrise' | 'bats' | 'eclipse' | 'train';

/** Luz de la escena (filtro de color sobre el fondo). */
export type IntroTone = 'dawn' | 'day' | 'night' | 'eclipse' | 'dusk';

export interface IntroScene {
  id: string;
  background: string;
  tone: IntroTone;
  /** Quién habla; sin `speaker` es el narrador. */
  speaker?: string;
  text: string;
  actors: readonly IntroActor[];
  effects: readonly IntroEffect[];
}

const TEMAYINA_SHEET = { file: 'personajes/temayina.webp', sheetW: 1536, sheetH: 1024 } as const;
const TOH_SHEET = { file: 'personajes/toh.webp', sheetW: 1536, sheetH: 1024 } as const;
/** `imagenes/nuevos/jefes/camazotz.atlas.json` y `complementos/historia.atlas.json`. */
const CAMAZOTZ_SHEET = { file: 'bosses/camazotz.webp', sheetW: 1254, sheetH: 1254 } as const;
const STORY_SHEET = { file: 'complementos/historia.webp', sheetW: 1536, sheetH: 1024 } as const;

export const SPRITES = {
  ...TEMAYIN_EXPRESSIONS,
  temayinaStand: { ...TEMAYINA_SHEET, frame: [67, 8, 362, 504] },
  temayinaSun: { ...TEMAYINA_SHEET, frame: [63, 512, 368, 493] },
  temayinaCaptive: { ...TEMAYINA_SHEET, frame: [589, 550, 315, 429] },
  tohPerch: { ...TOH_SHEET, frame: TOH_POSES.perch.frame, isolated: true },
  tohFly: { ...TOH_SHEET, frame: TOH_POSES.flyDown.frame, isolated: true },
  camazotzNight: { ...CAMAZOTZ_SHEET, frame: [398, 1, 451, 429] },
  camazotzEclipse: { ...CAMAZOTZ_SHEET, frame: [6, 808, 451, 382], isolated: true },
  sunDormant: { ...STORY_SHEET, frame: [65, 12, 444, 433] },
  shadowCage: { ...STORY_SHEET, frame: [33, 451, 506, 555] },
  bat: { file: 'enemies/bat.webp', sheetW: 1254, sheetH: 1254, frame: [593, 216, 648, 313] },
  train: { file: 'complementos/tren.webp', sheetW: 1774, sheetH: 887, frame: [20, 100, 1745, 345] },
} as const satisfies Readonly<Record<string, SpriteRef>>;

/** Primer nivel de la campaña: la cinemática se muestra antes de jugarlo por primera vez. */
export const INTRO_LEVEL_ID = '1-1';

export const INTRO_SCENES: readonly IntroScene[] = [
  {
    id: 'palenque',
    background: 'backgrounds/ruins.webp',
    tone: 'dawn',
    text: 'En lo profundo de la selva de Palenque vive Temayin, el jaguar guardián de las ruinas.',
    actors: [{ sprite: SPRITES.alegre, x: 30, bottom: 12, height: 72, anim: 'enter-left' }],
    effects: [],
  },
  {
    id: 'sol-de-jade',
    background: 'backgrounds/ruins.webp',
    tone: 'day',
    text: 'Su compañera, Temayina, custodia el Sol de Jade: la joya que cada mañana hace salir el sol sobre la península de Yucatán.',
    actors: [
      { sprite: SPRITES.carinoso, x: 24, bottom: 12, height: 62, anim: 'still' },
      { sprite: SPRITES.temayinaSun, x: 70, bottom: 4, height: 64, flip: true, anim: 'enter-right', glow: true },
    ],
    effects: ['sunrise'],
  },
  {
    id: 'camazotz',
    background: 'backgrounds/ruins.webp',
    tone: 'night',
    text: 'Pero una noche, Camazotz, el señor murciélago de Xibalbá, descendió sobre Palenque envuelto en sombras.',
    actors: [
      { sprite: SPRITES.sorprendido, x: 16, bottom: 12, height: 56, anim: 'still' },
      { sprite: SPRITES.temayinaStand, x: 66, bottom: 4, height: 62, flip: true, anim: 'still' },
      { sprite: SPRITES.camazotzNight, x: 34, bottom: 38, height: 58, anim: 'descend' },
    ],
    effects: ['bats'],
  },
  {
    id: 'secuestro',
    background: 'backgrounds/ruins.webp',
    tone: 'eclipse',
    text: 'Se llevó a Temayina y al Sol de Jade. Si llega a su trono, la península quedará para siempre bajo un eclipse.',
    actors: [
      { sprite: SPRITES.preocupado, x: 22, bottom: 12, height: 58, anim: 'still' },
      { sprite: SPRITES.camazotzEclipse, x: 62, bottom: 50, height: 46, flip: true, anim: 'float' },
      { sprite: SPRITES.sunDormant, x: 80, bottom: 58, height: 14, anim: 'float' },
      { sprite: SPRITES.temayinaCaptive, x: 64, bottom: 14, height: 36, anim: 'carried' },
      { sprite: SPRITES.shadowCage, x: 64, bottom: 12, height: 42, anim: 'carried' },
    ],
    effects: ['eclipse', 'bats'],
  },
  {
    id: 'tren',
    background: 'backgrounds/river.webp',
    tone: 'dusk',
    text: 'Camazotz huyó por las vías del Tren Maya hacia la gran pirámide de Calakmul, y dejó a un lugarteniente custodiando cada tramo.',
    actors: [{ sprite: SPRITES.decidido, x: 22, bottom: 12, height: 62, anim: 'still' }],
    effects: ['train', 'bats'],
  },
  {
    id: 'toh',
    background: 'backgrounds/jungle.webp',
    tone: 'day',
    speaker: 'Toh',
    text: '¡Temayin! Soy Toh, el pájaro reloj. Sube al Tren Maya: te guiaré estación por estación hasta rescatarla.',
    actors: [
      { sprite: SPRITES.atento, x: 30, bottom: 12, height: 66, anim: 'still' },
      { sprite: SPRITES.tohPerch, x: 68, bottom: 42, height: 34, flip: true, anim: 'fly-in' },
    ],
    effects: [],
  },
];

/** Todas las imágenes que usa la cinemática (para precargarlas). */
export const INTRO_FILES: readonly string[] = [
  ...new Set([
    ...INTRO_SCENES.map((s) => s.background),
    ...Object.values(SPRITES).map((s) => s.file),
  ]),
];
