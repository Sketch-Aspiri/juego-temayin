import { TAU } from '../../constants';
import { ANT_SPACING, antsLeft } from '../../entities/enemies/ants';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, drawLazyFrame, footFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/** Paleta de las arrieras (Atta): rojizas, cargando trozos de hoja. */
const OUTLINE = '#2a0f05';
const BODY = '#8a3414';
const SHINE = '#c8622e';
const LEAF = '#5fae3c';
const LEAF_DARK = '#3d7f25';
const STEP_SPEED = 16;
const BOB_SPEED = 8;
const DEAD_SQUASH = 0.4;

/** Cuadros de `enemies/ants.webp` (`ants.atlas.json`): cuatro pasos, mirando a la derecha. */
const ANTS_FILE = 'enemies/ants.webp';
const FRAMES: readonly AtlasFrame[] = [
  footFrame(63, 184, 537, 365),
  footFrame(692, 187, 536, 362),
  footFrame(60, 764, 547, 375),
  footFrame(689, 771, 554, 382),
];
/** ~540 px de ancho en la hoja → ~24 px por hormiga (un poco más que su hueco de 20). */
const SCALE = 0.045;
/** Pasos por segundo de la animación pintada. */
const ART_STEP_RATE = 10;

function drawLeaf(c: Ctx, sway: number): void {
  c.save();
  c.translate(2, -18);
  c.rotate(-0.35 + sway * 0.05);
  c.fillStyle = LEAF;
  c.strokeStyle = LEAF_DARK;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-8, 2);
  c.quadraticCurveTo(-6, -9, 4, -10);
  c.quadraticCurveTo(10, -4, 8, 3);
  c.lineTo(3, 0);
  c.lineTo(-1, 4);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(-6, 1);
  c.lineTo(5, -7);
  c.stroke();
  c.restore();
}

function segment(c: Ctx, x: number, y: number, rx: number, ry: number): void {
  c.fillStyle = BODY;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = SHINE;
  c.beginPath();
  c.ellipse(x - rx * 0.2, y - ry * 0.4, rx * 0.45, ry * 0.3, 0, 0, TAU);
  c.fill();
}

/** Una hormiga mirando a la derecha, con el origen bajo su cuerpo. */
function drawAnt(c: Ctx, t: number): void {
  const step = Math.sin(t * STEP_SPEED);
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.4;
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const lx = -2 + i * 3;
    const swing = (i % 2 ? step : -step) * 3;
    c.beginPath();
    c.moveTo(lx, -6);
    c.lineTo(lx + 2 + swing, -3);
    c.lineTo(lx + swing * 1.4, 0);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(7, -9);
  c.quadraticCurveTo(11, -15, 14, -13 + step);
  c.stroke();
  segment(c, -6, -7, 4.5, 3.5);
  segment(c, 0, -7, 2.8, 2.3);
  segment(c, 6, -8, 3.6, 3.2);
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(7.5, -9, 1.2, 0, TAU);
  c.fill();
  // mandíbulas sujetando la hoja
  c.beginPath();
  c.moveTo(9, -7);
  c.lineTo(8, -14);
  c.stroke();
  drawLeaf(c, step);
}

/** Fila de arrieras: dibuja tantas hormigas como queden, cada una con su hoja. */
export const drawAnts: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, DEAD_SQUASH);
  const n = antsLeft(e);
  for (let i = 0; i < n; i++) {
    const t = e.t + i * 0.37;
    c.save();
    c.translate(-e.w / 2 + ANT_SPACING / 2 + i * ANT_SPACING, -Math.abs(Math.sin(t * BOB_SPEED)) * 1.2);
    const frame = FRAMES[Math.floor(t * ART_STEP_RATE) % FRAMES.length];
    if (!drawLazyFrame(c, ANTS_FILE, frame, SCALE)) drawAnt(c, t);
    c.restore();
  }
};
