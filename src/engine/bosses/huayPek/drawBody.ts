import { TAU } from '../../constants';
import type { Ctx } from '../../render/drawUtils';

/**
 * Huay Pek procedural (respaldo mientras carga la hoja pintada): perro espectral
 * azul noche con llamas turquesa en el lomo y la cola, mirando a la derecha, con el
 * origen en el centro de la base de su caja (110 × 80 px). Es un ser de leyenda,
 * no un animal real: orejas grandes, pelaje de sombra y mirada brillante.
 */

/** Cómo lleva los ojos: cerrados (dormido / desvaneciéndose), abiertos, encendidos o rojos (aviso). */
export type EyeLook = 'closed' | 'open' | 'lit' | 'red';

const COL = {
  outline: '#0b1026',
  fur: '#1f2a5c',
  furDark: '#141c40',
  chest: '#9aa7d6',
  ear: '#b8e6a0',
  flame: 'rgba(90,230,225,.85)',
  nose: '#0b1026',
  paw: '#e8ecf8',
} as const;

const EYE_COL: Readonly<Record<Exclude<EyeLook, 'closed'>, string>> = {
  open: '#7fe0d0',
  lit: '#d8fff4',
  red: '#ff5e5b',
};

const LINE = 3;
const FLAME_FREQ = 6;

function fillStroke(c: Ctx, fill: string): void {
  c.fillStyle = fill;
  c.fill();
  c.stroke();
}

function drawTail(c: Ctx, clock: number): void {
  const sway = Math.sin(clock * FLAME_FREQ) * 4;
  c.beginPath();
  c.moveTo(-40, -50);
  c.quadraticCurveTo(-70, -60 + sway, -66, -88 + sway);
  c.quadraticCurveTo(-50, -100 + sway, -44, -82);
  c.quadraticCurveTo(-52, -70, -30, -58);
  c.closePath();
  fillStroke(c, COL.furDark);
  c.strokeStyle = COL.flame;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-62, -70 + sway);
  c.quadraticCurveTo(-74, -92 + sway, -56, -96 + sway);
  c.stroke();
}

function drawLegs(c: Ctx, step: number): void {
  for (const [x, ph] of [[-34, 0], [-18, Math.PI], [22, Math.PI], [38, 0]] as const) {
    const lift = Math.max(0, Math.sin(step + ph)) * 5;
    c.beginPath();
    c.rect(x - 6, -28, 12, 26 - lift);
    fillStroke(c, COL.fur);
    c.beginPath();
    c.ellipse(x + 2, -3 - lift, 9, 5, 0, 0, TAU);
    fillStroke(c, COL.paw);
  }
}

function drawHead(c: Ctx, eyes: EyeLook, open: number): void {
  // Orejas grandes con el interior claro.
  for (const ex of [26, 44]) {
    c.beginPath();
    c.moveTo(ex - 10, -70);
    c.lineTo(ex, -102);
    c.lineTo(ex + 10, -68);
    c.closePath();
    fillStroke(c, COL.fur);
  }
  c.beginPath();
  c.moveTo(38, -72);
  c.lineTo(44, -94);
  c.lineTo(50, -70);
  c.fillStyle = COL.ear;
  c.fill();
  c.beginPath();
  c.ellipse(38, -60, 24, 20, 0, 0, TAU);
  fillStroke(c, COL.fur);
  // Hocico (se abre al ladrar).
  c.beginPath();
  c.moveTo(52, -66);
  c.lineTo(72, -58 - open * 4);
  c.lineTo(58, -48 + open * 6);
  c.closePath();
  fillStroke(c, COL.chest);
  c.beginPath();
  c.arc(71, -58 - open * 4, 3, 0, TAU);
  c.fillStyle = COL.nose;
  c.fill();
  drawEye(c, 46, -64, eyes);
}

function drawEye(c: Ctx, x: number, y: number, eyes: EyeLook): void {
  if (eyes === 'closed') {
    c.beginPath();
    c.moveTo(x - 5, y);
    c.quadraticCurveTo(x, y + 3, x + 5, y);
    c.stroke();
    return;
  }
  c.beginPath();
  c.ellipse(x, y, eyes === 'lit' ? 6 : 4, eyes === 'lit' ? 6 : 3, 0, 0, TAU);
  c.fillStyle = EYE_COL[eyes];
  c.fill();
}

/**
 * Perro completo. `squash` (0..1) lo agazapa antes de saltar; `open` (0..1) abre el
 * hocico al ladrar o aullar.
 */
export function drawSpectralDog(c: Ctx, clock: number, eyes: EyeLook, squash: number, open: number): void {
  c.save();
  c.scale(1 + squash * 0.12, 1 - squash * 0.2);
  c.strokeStyle = COL.outline;
  c.lineWidth = LINE;
  c.lineJoin = 'round';
  drawTail(c, clock);
  drawLegs(c, clock * 8);
  c.beginPath();
  c.ellipse(0, -42, 46, 20, 0, 0, TAU);
  fillStroke(c, COL.fur);
  // Llamas espectrales en el lomo.
  c.strokeStyle = COL.flame;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-30, -58);
  c.quadraticCurveTo(-8, -66 + Math.sin(clock * FLAME_FREQ) * 3, 14, -58);
  c.stroke();
  c.strokeStyle = COL.outline;
  c.lineWidth = LINE;
  drawHead(c, eyes, open);
  c.restore();
}
