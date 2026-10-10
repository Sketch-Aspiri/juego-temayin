import { T, TAU } from '../../constants';
import { MORAY_STATE, morayLair } from '../../entities/enemies/moray';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';
import { drawLazyFrame, type AtlasFrame } from './atlas';

const MORAY_FILE = 'enemies/moray.webp';
const ART_SCALE = 0.11;
/** El ancla sigue la cabeza de contacto, no el centro del cuerpo enroscado. */
const FRAMES: readonly AtlasFrame[] = [
  { x: 117, y: 206, w: 434, h: 381, ax: 454, ay: 369 },
  { x: 644, y: 164, w: 584, h: 413, ax: 1140, ay: 258 },
  { x: 44, y: 701, w: 603, h: 423, ax: 558, ay: 834 },
  { x: 668, y: 744, w: 541, h: 389, ax: 1140, ay: 936 },
];

/** Paleta de la morena verde (Gymnothorax funebris), común en el golfo y el Caribe. */
const OUTLINE = '#142414';
const SKIN = '#819f29';
const SKIN_DARK = '#526b22';
const BELLY = '#a9c46a';
const CREVICE = 'rgba(10,14,12,.85)';
/** Grosor del cuerpo (px). */
const BODY = 14;
/** Hasta dónde se dibuja el cuerpo dentro de la grieta (se recorta). */
const TAIL_DEPTH = 30;
const WAVE_SPEED = 7;
const WAVE_AMPLITUDE = 2.5;
/** Lienzo grande para el recorte del lado del agua. */
const CLIP_SIZE = 400;

/** Gira el lienzo para que +x apunte hacia el agua abierta (de la grieta a la boca). */
function orient(c: Ctx, dx: number, dy: number): void {
  if (dx !== 0) c.scale(dx, 1);
  else c.rotate(dy > 0 ? Math.PI / 2 : -Math.PI / 2);
}

/** Cuerpo ondulante desde dentro de la grieta hasta la cabeza (en x = 0). */
function drawBody(c: Ctx, from: number, t: number): void {
  c.lineCap = 'round';
  for (const [color, width] of [[OUTLINE, BODY + 4], [SKIN, BODY]] as const) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(from, 0);
    for (let x = from; x <= 0; x += 4) c.lineTo(x, Math.sin(x / 9 + t * WAVE_SPEED) * WAVE_AMPLITUDE);
    c.stroke();
  }
  c.fillStyle = SKIN_DARK;
  for (let x = from + 6; x < -6; x += 11) c.fillRect(x, -4 + Math.sin(x / 9 + t * WAVE_SPEED) * WAVE_AMPLITUDE, 3, 3);
}

/** Cabeza mirando a +x; `open` (0..1) abre la boca. */
function drawHead(c: Ctx, open: number): void {
  const gape = open * 6;
  c.fillStyle = SKIN;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-6, -8);
  c.quadraticCurveTo(10, -9, 15, -2 - gape);
  c.lineTo(4, 0);
  c.lineTo(15, 2 + gape);
  c.quadraticCurveTo(8, 8, -6, 7);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = BELLY;
  c.beginPath();
  c.ellipse(2, 5, 7, 2, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#f4f0c8';
  c.beginPath();
  c.arc(5, -4, 2.6, 0, TAU);
  c.fill();
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(5.6, -4, 1.3, 0, TAU);
  c.fill();
}

const mouthOpen = (e: Enemy): number =>
  e.state === MORAY_STATE.strike ? 1 : e.state === MORAY_STATE.peek ? 0.35 + Math.sin(e.t * 9) * 0.15 : 0.15;

/**
 * La hoja pintada gira con la salida de la grieta y se recorta en su plano.
 * La cabeza permanece en su caja de contacto al cambiar de pose; el dibujo
 * procedural sirve de respaldo mientras carga la hoja.
 */
export const drawMoray: EnemyDrawFn = (c, _assets, e) => {
  c.translate(0, -e.h / 2);
  const lair = morayLair(e);
  if (lair) orient(c, lair.dx, lair.dy);
  const frame = FRAMES[e.dead ? MORAY_STATE.retract : e.state] ?? FRAMES[0];
  if (e.dead || !lair) {
    if (!drawLazyFrame(c, MORAY_FILE, frame, ART_SCALE)) drawHead(c, 0.6);
    return;
  }
  // La boca de la grieta está medio bloque detrás del centro del bloque de agua.
  const mouth = -(lair.ext + T / 2);
  c.fillStyle = CREVICE;
  c.beginPath();
  c.ellipse(mouth - 2, 0, 5, 13, 0, 0, TAU);
  c.fill();
  c.save();
  c.beginPath();
  c.rect(mouth, -CLIP_SIZE / 2, CLIP_SIZE, CLIP_SIZE);
  c.clip();
  // El cuerpo enlaza la cola pintada con la grieta incluso al extender la mordida.
  drawBody(c, mouth - TAIL_DEPTH, e.t);
  if (!drawLazyFrame(c, MORAY_FILE, frame, ART_SCALE)) drawHead(c, mouthOpen(e));
  c.restore();
};
