import { TAU } from '../../constants';
import { NAUYACA_STATE, REAR_TIME } from '../../entities/enemies/nauyaca';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';

/** Paleta de la nauyaca (Bothrops asper): pardo oliva con rombos oscuros y mentón amarillo. */
const OUTLINE = '#1f160c';
const SCALES = '#7d6a3a';
const DIAMONDS = '#3b2d17';
const BELLY = '#e8d9a0';
const CHIN = '#f0c419';
const GRASS = ['#2f7a2a', '#4fa83a', '#6cc04a'] as const;

const BODY_W = 8;
const OUTLINE_W = 11;
const COIL_TURNS = 1.6;
const COIL_STEPS = 24;
const TONGUE_SPEED = 14;
const DEAD_SQUASH = 0.5;

type Pt = readonly [number, number];

/** Cuerpo de serpiente: contorno, escamas, rombos (trazo discontinuo) y brillo. */
function strokeBody(c: Ctx, pts: readonly Pt[]): void {
  const path = (): void => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';
  path();
  c.strokeStyle = OUTLINE;
  c.lineWidth = OUTLINE_W;
  c.stroke();
  c.strokeStyle = SCALES;
  c.lineWidth = BODY_W;
  c.stroke();
  c.setLineDash([4, 5]);
  c.strokeStyle = DIAMONDS;
  c.lineWidth = BODY_W - 2;
  c.stroke();
  c.setLineDash([]);
  c.translate(0, 1.5);
  path();
  c.strokeStyle = 'rgba(255, 240, 190, 0.35)';
  c.lineWidth = 1.5;
  c.stroke();
  c.translate(0, -1.5);
}

/** Espiral enroscada centrada en (cx, cy); termina en el centro, donde va la cabeza. */
function coilPoints(cx: number, cy: number, r0: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= COIL_STEPS; i++) {
    const k = i / COIL_STEPS;
    const a = Math.PI + k * COIL_TURNS * TAU;
    const r = r0 * (1 - k * 0.7);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.45]);
  }
  return pts;
}

/** Cabeza triangular mirando a la derecha; `open` abre la boca con colmillos. */
function drawHead(c: Ctx, x: number, y: number, open: boolean, t: number): void {
  c.save();
  c.translate(x, y);
  if (open) {
    c.fillStyle = '#c2324a';
    c.beginPath();
    c.moveTo(2, 0);
    c.lineTo(15, -4);
    c.lineTo(15, 5);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(11, -4, 1.6, 4);
    c.fillRect(11, 1, 1.6, 4);
  } else if (Math.sin(t * TONGUE_SPEED) > 0.4) {
    c.strokeStyle = '#d6304a';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(12, 1);
    c.lineTo(18, 1);
    c.lineTo(20, -1);
    c.moveTo(18, 1);
    c.lineTo(20, 3);
    c.stroke();
  }
  c.fillStyle = SCALES;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-5, -5);
  c.quadraticCurveTo(6, -9, 13, open ? -4 : -1);
  c.lineTo(13, open ? -2 : 2);
  c.quadraticCurveTo(4, 7, -5, 4);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = CHIN;
  c.beginPath();
  c.ellipse(4, 3, 6, 1.8, 0.1, 0, TAU);
  c.fill();
  c.fillStyle = '#ffd84a';
  c.beginPath();
  c.arc(5, -3, 2.4, 0, TAU);
  c.fill();
  c.fillStyle = '#111';
  c.fillRect(4.6, -5, 1, 4);
  c.restore();
}

/** Mechones de hierba delante de la serpiente escondida. */
function drawGrass(c: Ctx, t: number): void {
  for (let i = 0; i < 7; i++) {
    const x = -20 + i * 6.5;
    const sway = Math.sin(t * 2 + i) * 2;
    c.fillStyle = GRASS[i % GRASS.length];
    c.beginPath();
    c.moveTo(x - 3, 0);
    c.quadraticCurveTo(x + sway, -10, x + sway * 2, -16 - (i % 3) * 3);
    c.quadraticCurveTo(x + 1, -8, x + 3, 0);
    c.fill();
  }
}

function drawCoiled(c: Ctx, e: Enemy, hidden: boolean): void {
  strokeBody(c, coilPoints(-2, -8, 16));
  drawHead(c, 4, hidden ? -12 : -16, false, e.t);
  c.fillStyle = BELLY;
  c.globalAlpha = 0.5;
  c.beginPath();
  c.ellipse(-2, -2, 14, 1.5, 0, 0, TAU);
  c.fill();
  c.globalAlpha = 1;
  if (hidden) drawGrass(c, e.t);
}

function drawRearing(c: Ctx, e: Enemy): void {
  const k = Math.min(1, 1 - e.timer / REAR_TIME);
  const shake = Math.sin(e.t * 60) * 1.2;
  strokeBody(c, [...coilPoints(-8, -6, 12).slice(0, COIL_STEPS - 6), [-4, -14], [-2 + shake, -22 - 6 * k], [6, -28 - 6 * k]]);
  drawHead(c, 8, -28 - 6 * k, k > 0.5, e.t);
}

function drawLunging(c: Ctx, e: Enemy): void {
  const wave = Math.sin(e.t * 30) * 3;
  strokeBody(c, [[-30, -5], [-20, -9 + wave], [-10, -5 - wave], [0, -10 + wave], [10, -10]]);
  drawHead(c, 14, -11, true, e.t);
}

/** Nauyaca procedural: enroscada (oculta en la hierba), erguida, lanzándose o replegándose. */
export const drawNauyaca: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) {
    c.scale(1, DEAD_SQUASH);
    drawCoiled(c, e, false);
    return;
  }
  switch (e.state) {
    case NAUYACA_STATE.hidden:
      drawCoiled(c, e, true);
      return;
    case NAUYACA_STATE.rear:
      drawRearing(c, e);
      return;
    case NAUYACA_STATE.lunge:
      drawLunging(c, e);
      return;
    default:
      drawCoiled(c, e, false);
  }
};
