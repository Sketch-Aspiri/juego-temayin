import { TAU } from '../../constants';
import { AXOLOTL_STATE, axolotlAlpha } from '../../entities/enemies/axolotl';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, centerFrame, drawLazyFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/** Ajolote fantasma: cuerpo rosa pálido translúcido con branquias plumosas. */
const BODY = '#f3c6d6';
const BELLY = '#fde6ee';
const GILL = '#e0708f';
const OUTLINE = 'rgba(120,60,90,.8)';
const EYE = '#2a1220';
const TAIL_SPEED = 5;
const TAIL_WAVE = 3;
const DEAD_FADE = 0.4;

/** Cuadros de `enemies/axolotl.webp` (`axolotl.atlas.json`, anclaje en el centro). */
const AXOLOTL_FILE = 'enemies/axolotl.webp';
const ART = {
  swim: centerFrame(93, 265, 456, 198),
  tail: centerFrame(727, 266, 431, 220),
  appear: centerFrame(91, 786, 452, 277),
  fade: centerFrame(716, 786, 452, 278),
} as const satisfies Readonly<Record<string, AtlasFrame>>;
/** ~450 px de largo en la hoja → ~47 px en pantalla (caja de 40 × 20). */
const ART_SCALE = 0.105;
/** Cambios de cuadro por segundo al nadar. */
const ART_SWIM_RATE = 3;

function axolotlFrame(e: Enemy): AtlasFrame {
  if (e.dead || e.state === AXOLOTL_STATE.fade || e.state === AXOLOTL_STATE.hidden) return ART.fade;
  if (e.state === AXOLOTL_STATE.appear) return ART.appear;
  return Math.floor(e.t * ART_SWIM_RATE) % 2 ? ART.tail : ART.swim;
}

/** Tres branquias plumosas a cada lado de la cabeza. */
function gills(c: Ctx, cy: number): void {
  c.strokeStyle = GILL;
  c.lineWidth = 2;
  c.beginPath();
  for (const [dx, dy] of [[-3, -9], [0, -10], [3, -8]] as const) {
    c.moveTo(12, cy - 3);
    c.lineTo(12 + dx, cy + dy);
  }
  c.stroke();
}

/** Ajolote procedural mirando a la derecha, centrado en (0, cy). */
function drawProcedural(c: Ctx, cy: number, t: number): void {
  const flick = Math.sin(t * TAIL_SPEED) * TAIL_WAVE;
  c.fillStyle = BODY;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-8, cy);
  c.quadraticCurveTo(-18, cy - 4 + flick, -22, cy + flick);
  c.quadraticCurveTo(-18, cy + 4 + flick, -8, cy + 3);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(0, cy, 13, 7, 0, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(1, cy + 3, 9, 3, 0, 0, TAU);
  c.fill();
  gills(c, cy);
  c.fillStyle = EYE;
  c.beginPath();
  c.arc(9, cy - 2, 1.6, 0, TAU);
  c.fill();
}

/** Ajolote fantasma: translúcido con `globalAlpha`; al morir se desvanece. */
export const drawAxolotl: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  const alpha = e.dead ? Math.max(0, 1 - e.dead / DEAD_FADE) : axolotlAlpha(e);
  c.globalAlpha = alpha;
  const cy = -e.h / 2;
  if (!drawLazyFrame(c, AXOLOTL_FILE, axolotlFrame(e), ART_SCALE, 0, cy)) drawProcedural(c, cy, e.t);
  c.globalAlpha = 1;
};
