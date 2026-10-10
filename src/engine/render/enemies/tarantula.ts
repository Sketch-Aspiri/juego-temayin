import { isReady } from '../../assets';
import { TAU } from '../../constants';
import { TARANTULA_STATE } from '../../entities/enemies/tarantula';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, drawAtlasFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/** Cuadros reales de `enemies/tarantula.png` (`tarantula.atlas.json`); anclaje bajo las patas. */
const OPEN: AtlasFrame = { x: 41, y: 142, w: 620, h: 386, ax: 350, ay: 520 };
const TUCKED: AtlasFrame = { x: 780, y: 191, w: 406, h: 323, ax: 985, ay: 505 };
const HANGING: AtlasFrame = { x: 143, y: 568, w: 418, h: 576, ax: 350, ay: 1135 };
const LANDING: AtlasFrame = { x: 646, y: 823, w: 569, h: 339, ax: 930, ay: 1150 };
/** ~620 px de ancho en la hoja → ~52 px en pantalla (caja de 36×26). */
const SCALE = 0.085;
/** Altura de la hebra propia del cuadro colgante (desde la base): ahí empieza la nuestra. */
const SPRITE_THREAD_TOP = (HANGING.ay - HANGING.y) * SCALE;
const STEP_FPS = 7;
const LANDING_POSE_TIME = 0.25;
const SQUASH = 0.5;
/** Lomo del dibujo procedural (respaldo). */
const FALLBACK_BACK = 22;

/** Hilo de seda desde el anclaje (`baseY`) hasta el lomo. */
function drawThread(c: Ctx, e: Enemy, fromSprite: number): void {
  const top = e.baseY - (e.y + e.h);
  c.strokeStyle = 'rgba(240, 240, 250, 0.85)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, top);
  c.lineTo(0, -fromSprite);
  c.stroke();
}

function pickFrame(e: Enemy): AtlasFrame {
  if (e.dead) return TUCKED;
  if (e.state === TARANTULA_STATE.hang || e.state === TARANTULA_STATE.drop) return HANGING;
  if (e.timer > -LANDING_POSE_TIME) return LANDING;
  return Math.floor(e.t * STEP_FPS) % 2 ? OPEN : LANDING;
}

/** Tarántula procedural: respaldo mientras la imagen no ha cargado. */
function drawTarantulaFallback(c: Ctx, e: Enemy): void {
  const step = Math.sin(e.t * STEP_FPS * 2) * 2;
  c.strokeStyle = '#3a1608';
  c.lineWidth = 3.5;
  c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const lift = (i % 2 ? step : -step) * side;
      c.beginPath();
      c.moveTo(side * 4, -12);
      c.quadraticCurveTo(side * (12 + i * 2), -22 + lift, side * (14 + i * 3), -1);
      c.stroke();
    }
  }
  c.fillStyle = '#9c4a1a';
  c.beginPath();
  c.ellipse(-6, -14, 12, 10, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#d97a2b';
  c.beginPath();
  c.ellipse(8, -12, 8, 7, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(11, -14, 2, 0, TAU);
  c.arc(7, -15, 1.6, 0, TAU);
  c.fill();
}

/**
 * Tarántula: cuelga con el cuadro "bajando de una hebra" y un hilo hasta su anclaje;
 * al aterrizar pasa por "aterrizaje" y camina alternando patas abiertas/aterrizaje.
 */
export const drawTarantula: EnemyDrawFn = (c, assets, e) => {
  const hanging = !e.dead && (e.state === TARANTULA_STATE.hang || e.state === TARANTULA_STATE.drop);
  if (hanging) drawThread(c, e, isReady(assets.tarantula) ? SPRITE_THREAD_TOP : FALLBACK_BACK);
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, SQUASH);
  if (!drawAtlasFrame(c, assets.tarantula, pickFrame(e), SCALE)) drawTarantulaFallback(c, e);
};
