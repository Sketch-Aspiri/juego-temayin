import { TAU } from '../../constants';
import type { Ctx } from '../../render/drawUtils';
import type { KaimanState } from './index';

/**
 * Cocodrilo de Morelet procedural, mirando a la derecha, con origen en el centro de
 * la base de su caja (170 × 62 px). Verde oliva oscuro, hocico corto y ancho,
 * escamas dorsales marcadas, vientre dorado y ojos ámbar (AGENTS.md §4.4).
 */

const COL = {
  outline: '#1b2210',
  back: '#3b4a20',
  body: '#56662f',
  scute: '#2a3416',
  belly: '#d9c27a',
  mouth: '#9e2f3a',
  tooth: '#fffbe8',
  eye: '#f2b53a',
  glow: 'rgba(255,214,90,.75)',
} as const;

const WALK_STATES: ReadonlySet<KaimanState> = new Set(['walk', 'bite']);
const DIZZY_STATES: ReadonlySet<KaimanState> = new Set(['exposed', 'dead']);
const OPEN_STATES: ReadonlySet<KaimanState> = new Set(['gape', 'bite', 'pant']);
const JAW_OPEN = 0.4;
const HEAD_SCALE_X = 0.86;
const HEAD_SCALE_Y = 1.12;
const SCUTES = 7;
const LINE = 3;

function jawAngle(st: KaimanState, clock: number, roar: number): number {
  if (st === 'bite') return 0.25 + 0.25 * Math.abs(Math.sin(clock * 12));
  if (OPEN_STATES.has(st)) return JAW_OPEN;
  return roar * JAW_OPEN * 1.2;
}

function tailSwing(st: KaimanState, t: number): number {
  if (st === 'tail') return Math.sin(t * 16) * 22 * Math.max(0, 1 - t);
  if (st === 'tailPrep') return -18;
  return 0;
}

function stroke(c: Ctx, fill: string): void {
  c.fillStyle = fill;
  c.fill();
  c.stroke();
}

function drawTail(c: Ctx, swing: number): void {
  c.beginPath();
  c.moveTo(-50, -52);
  c.quadraticCurveTo(-100, -44 + swing / 2, -138, -20 + swing);
  c.lineTo(-134, -12 + swing);
  c.quadraticCurveTo(-96, -12 + swing / 3, -48, -8);
  c.closePath();
  stroke(c, COL.body);
  // Crestas de la cola.
  c.fillStyle = COL.scute;
  for (let i = 0; i < 5; i++) {
    const k = i / 5;
    const x = -60 - k * 66;
    const y = -48 + k * 24 + swing * k;
    c.beginPath();
    c.moveTo(x - 6, y + 3);
    c.lineTo(x, y - 7 + k * 3);
    c.lineTo(x + 6, y + 3);
    c.fill();
  }
}

function drawLeg(c: Ctx, x: number, phase: number, fill: string): void {
  const lift = Math.max(0, Math.sin(phase)) * 6;
  const reach = Math.cos(phase) * 5;
  c.beginPath();
  c.moveTo(x - 9, -22);
  c.lineTo(x + 9, -22);
  c.lineTo(x + 11 + reach, -4 - lift);
  c.lineTo(x + 16 + reach, -lift);
  c.lineTo(x - 10 + reach, -lift);
  c.closePath();
  stroke(c, fill);
}

function drawTorso(c: Ctx, glow: number): void {
  c.beginPath();
  c.ellipse(0, -30, 66, 26, 0, 0, TAU);
  stroke(c, COL.body);
  c.beginPath();
  c.ellipse(4, -15, 56, 10, 0, 0, Math.PI);
  c.fillStyle = COL.belly;
  c.fill();
  c.beginPath();
  c.ellipse(-4, -42, 52, 12, 0, Math.PI, TAU);
  c.fillStyle = COL.back;
  c.fill();
  // Escamas dorsales: en el lomo expuesto brillan (es el punto débil).
  for (let i = 0; i < SCUTES; i++) {
    const x = -48 + i * 15;
    const y = -52 - Math.sin((i / (SCUTES - 1)) * Math.PI) * 5;
    c.beginPath();
    c.moveTo(x - 6, y + 5);
    c.lineTo(x, y - 6);
    c.lineTo(x + 6, y + 5);
    c.closePath();
    stroke(c, glow > 0 ? COL.glow : COL.scute);
  }
  if (glow > 0) {
    c.globalAlpha = glow * 0.35;
    c.beginPath();
    c.ellipse(-4, -50, 60, 10, 0, 0, TAU);
    c.fillStyle = COL.eye;
    c.fill();
    c.globalAlpha = 1;
  }
}

function drawTeeth(c: Ctx, y: number, dir: 1 | -1): void {
  c.fillStyle = COL.tooth;
  for (let x = 14; x <= 58; x += 9) {
    c.beginPath();
    c.moveTo(x - 3, y);
    c.lineTo(x, y + dir * 6);
    c.lineTo(x + 3, y);
    c.fill();
  }
}

function drawLowerJaw(c: Ctx, angle: number): void {
  c.save();
  c.rotate(angle);
  if (angle > 0.05) drawTeeth(c, 2, -1);
  c.beginPath();
  c.moveTo(-4, 0);
  c.lineTo(60, 2);
  c.quadraticCurveTo(66, 6, 58, 12);
  c.lineTo(-2, 14);
  c.closePath();
  stroke(c, COL.belly);
  c.restore();
}

function drawUpperJaw(c: Ctx, open: boolean): void {
  if (open) drawTeeth(c, 0, 1);
  c.beginPath();
  c.moveTo(-8, 2);
  c.lineTo(-8, -20);
  c.quadraticCurveTo(4, -32, 16, -22);
  c.quadraticCurveTo(44, -18, 64, -10);
  c.quadraticCurveTo(74, -4, 66, 2);
  c.closePath();
  stroke(c, COL.body);
  // Fosas nasales en la punta del hocico.
  c.fillStyle = COL.outline;
  c.beginPath();
  c.arc(62, -9, 2.5, 0, TAU);
  c.arc(56, -11, 2.5, 0, TAU);
  c.fill();
}

/** Ojo ámbar de pupila vertical; mareado, una espiral. */
export function drawEye(c: Ctx, x: number, y: number, dizzy: boolean, clock: number): void {
  c.beginPath();
  c.arc(x, y, 8, 0, TAU);
  stroke(c, dizzy ? '#fff' : COL.eye);
  c.strokeStyle = COL.outline;
  if (dizzy) {
    c.lineWidth = 2;
    c.beginPath();
    for (let a = 0; a < TAU * 2; a += 0.3) c.lineTo(x + Math.cos(a + clock * 8) * a * 0.55, y + Math.sin(a + clock * 8) * a * 0.55);
    c.stroke();
    c.lineWidth = LINE;
    return;
  }
  c.fillStyle = COL.outline;
  c.beginPath();
  c.ellipse(x + 1, y, 2.2, 6, 0, 0, TAU);
  c.fill();
}

function drawHead(c: Ctx, angle: number, dizzy: boolean, clock: number): void {
  c.save();
  c.translate(54, -30);
  // Hocico corto y ancho del cocodrilo de Morelet.
  c.scale(HEAD_SCALE_X, HEAD_SCALE_Y);
  if (angle > 0.05) {
    c.beginPath();
    c.moveTo(-4, 0);
    c.lineTo(62, 0);
    c.lineTo(Math.cos(angle) * 60, Math.sin(angle) * 60 + 6);
    c.closePath();
    c.fillStyle = COL.mouth;
    c.fill();
  }
  drawLowerJaw(c, angle);
  drawUpperJaw(c, angle > 0.05);
  drawEye(c, 6, -24, dizzy, clock);
  c.restore();
}

/** Dibuja el cocodrilo completo en coordenadas locales (ya trasladado y volteado). */
export function drawCrocodile(c: Ctx, st: KaimanState, clock: number, t: number, roar: number): void {
  const walking = WALK_STATES.has(st);
  const phase = walking ? clock * (st === 'bite' ? 16 : 8) : 0;
  const glow = st === 'exposed' ? 0.6 + 0.4 * Math.sin(t * 10) : 0;
  c.lineJoin = 'round';
  c.lineWidth = LINE;
  c.strokeStyle = COL.outline;
  drawLeg(c, -40, phase + Math.PI, COL.back);
  drawLeg(c, 40, phase, COL.back);
  drawTail(c, tailSwing(st, t));
  drawTorso(c, glow);
  drawLeg(c, -28, phase, COL.body);
  drawLeg(c, 52, phase + Math.PI, COL.body);
  drawHead(c, jawAngle(st, clock, roar), DIZZY_STATES.has(st), clock);
}

/** Sumergido: solo asoman los ojos y las fosas nasales sobre la superficie. */
export function drawEyesAtSurface(c: Ctx, x: number, y: number, face: 1 | -1, clock: number): void {
  const bob = Math.sin(clock * 4) * 2;
  c.save();
  c.translate(x, y + bob);
  c.scale(face, 1);
  c.lineWidth = LINE;
  c.strokeStyle = COL.outline;
  c.beginPath();
  c.ellipse(-6, 0, 22, 9, 0, Math.PI, TAU);
  stroke(c, COL.body);
  c.beginPath();
  c.ellipse(40, 0, 10, 5, 0, Math.PI, TAU);
  stroke(c, COL.body);
  drawEye(c, -12, -6, false, clock);
  drawEye(c, 4, -6, false, clock);
  c.restore();
}
