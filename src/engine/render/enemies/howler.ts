import { TAU } from '../../constants';
import { HOWLER_STATE } from '../../entities/enemies/howler';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, drawAtlasFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/**
 * Cuadros reales de `enemies/howler.webp` (`howler.atlas.json`), en el orden de
 * `HOWLER_STATE`: reposo, grito, brazo atrás con fruto, lanzar. Anclaje entre las patas.
 */
const FRAMES: readonly AtlasFrame[] = [
  { x: 83, y: 121, w: 490, h: 454, ax: 375, ay: 568 },
  { x: 661, y: 129, w: 487, h: 448, ax: 935, ay: 570 },
  { x: 54, y: 706, w: 536, h: 446, ax: 320, ay: 1145 },
  { x: 589, y: 705, w: 636, h: 446, ax: 765, ay: 1145 },
];
/** ~450 px de alto en la hoja → ~68 px en pantalla (la cola sobresale de la caja de 40). */
const SCALE = 0.15;
const BREATH_SPEED = 3;
const BREATH_AMOUNT = 0.02;
/** Aplastado al morir pisado. */
const SQUASH = 0.45;

const FUR = '#3a2418';
const MANE = '#8a3f1c';

/** Saraguato procedural: respaldo mientras la imagen no ha cargado. */
function drawHowlerFallback(c: Ctx, state: number): void {
  c.lineCap = 'round';
  c.strokeStyle = FUR;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-12, -18);
  c.bezierCurveTo(-34, -24, -30, -58, -14, -54);
  c.stroke();
  c.fillStyle = FUR;
  c.beginPath();
  c.ellipse(-2, -16, 16, 13, -0.2, 0, TAU);
  c.fill();
  c.fillStyle = MANE;
  c.beginPath();
  c.ellipse(8, -22, 9, 11, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#4a4040';
  c.beginPath();
  c.ellipse(11, -30, 8, 7, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(14, -32, 2.6, 0, TAU);
  c.fill();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(15, -32, 1.4, 0, TAU);
  c.fill();
  if (state === HOWLER_STATE.howl || state === HOWLER_STATE.throw) {
    c.fillStyle = '#b5303a';
    c.beginPath();
    c.ellipse(16, -26, 3, 4, 0, 0, TAU);
    c.fill();
  }
  if (state !== HOWLER_STATE.throw) {
    c.fillStyle = '#f2c21b';
    c.beginPath();
    c.ellipse(state === HOWLER_STATE.windup ? -14 : 12, state === HOWLER_STATE.windup ? -36 : -14, 6, 4.5, 0.4, 0, TAU);
    c.fill();
  }
}

/** Mono saraguato (mira a la derecha en la hoja); el cuadro sigue su máquina de estados. */
export const drawHowler: EnemyDrawFn = (c, assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, SQUASH);
  else if (e.state === HOWLER_STATE.rest) c.scale(1, 1 + Math.sin(e.t * BREATH_SPEED) * BREATH_AMOUNT);
  const frame = FRAMES[e.dead ? HOWLER_STATE.rest : e.state] ?? FRAMES[0];
  if (!drawAtlasFrame(c, assets.howler, frame, SCALE)) drawHowlerFallback(c, e.state);
};
