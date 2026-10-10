import { TAU } from '../../constants';
import { CRAB_STATE } from '../../entities/enemies/blueCrab';
import type { Ctx } from '../drawUtils';
import { type AtlasFrame, drawLazyFrame, footFrame } from './atlas';
import type { EnemyDrawFn } from './types';

/** Paleta del cangrejo azul (Cardisoma guanhumi): caparazón azul, pinzas lila-blancas. */
const OUTLINE = '#14203a';
const SHELL = '#3f74c9';
const SHELL_DARK = '#2a4f94';
const SHELL_SHINE = '#9cc4ff';
const CLAW = '#c9b6e8';
const CLAW_TIP = '#f4eefc';
const LEG = '#2f5aa8';
const STEP_SPEED = 18;
const DEAD_SQUASH = 0.45;

/** Cuadros de `enemies/blueCrab.webp` (`blueCrab.atlas.json`): dos pasos, pinzas en alto, pinzazo. */
const CRAB_FILE = 'enemies/blueCrab.webp';
const WALK_FRAMES: readonly AtlasFrame[] = [footFrame(71, 254, 538, 304), footFrame(662, 253, 552, 309)];
const CLAWS_UP_FRAMES: readonly AtlasFrame[] = [footFrame(57, 687, 562, 476), footFrame(675, 862, 539, 300)];
/** ~540 px de ancho en la hoja → ~46 px en pantalla (caja de 40 × 26). */
const SCALE = 0.085;
/** Pasos por segundo de la animación pintada. */
const ART_STEP_RATE = 7;
/** Con las pinzas en alto alterna amenaza y pinzazo, más despacio. */
const CLAW_SNAP_RATE = 3;

/** Cuadro pintado según el estado: caminar o pinzas en alto (aviso de no pisable). */
function crabFrame(up: boolean, t: number): AtlasFrame {
  if (up) return CLAWS_UP_FRAMES[Math.floor(t * CLAW_SNAP_RATE) % 2 === 0 ? 0 : 1];
  return WALK_FRAMES[Math.floor(t * ART_STEP_RATE) % WALK_FRAMES.length];
}

/** Patas articuladas, tres por lado, que alternan al caminar. */
function drawLegs(c: Ctx, t: number): void {
  c.strokeStyle = OUTLINE;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lift = Math.max(0, Math.sin(t * STEP_SPEED + i * 2 + (side > 0 ? Math.PI : 0))) * 3;
      const bx = side * (8 + i * 3);
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(bx, -10);
      c.lineTo(bx + side * 6, -14 - lift);
      c.lineTo(bx + side * 9, -lift * 0.5);
      c.stroke();
      c.strokeStyle = LEG;
      c.lineWidth = 2;
      c.stroke();
      c.strokeStyle = OUTLINE;
    }
  }
}

/** Pinza en (x, y); `up` la alza abierta y amenazante. */
function drawClaw(c: Ctx, side: number, up: boolean, t: number): void {
  const x = side * 15;
  const y = up ? -32 : -14;
  const open = up ? 0.5 + Math.sin(t * 20) * 0.15 : 0.15;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.fillStyle = CLAW;
  c.beginPath();
  c.moveTo(side * 9, -14);
  c.lineTo(x, y + 6);
  c.stroke();
  c.save();
  c.translate(x, y);
  c.rotate(up ? -side * 0.3 : side * 0.4);
  c.beginPath();
  c.ellipse(0, 0, 6.5, 5, 0, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = CLAW_TIP;
  for (const k of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 3, -1);
    c.quadraticCurveTo(side * 10, k * open * 10 - 3, side * 11, k * open * 8 - 1);
    c.lineTo(side * 5, 1);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.restore();
}

function drawShell(c: Ctx, up: boolean): void {
  c.fillStyle = SHELL;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-16, -10);
  c.quadraticCurveTo(-18, -24, 0, -25);
  c.quadraticCurveTo(18, -24, 16, -10);
  c.quadraticCurveTo(0, -4, -16, -10);
  c.fill();
  c.stroke();
  c.fillStyle = SHELL_DARK;
  c.beginPath();
  c.ellipse(0, -11, 12, 3, 0, 0, TAU);
  c.fill();
  c.fillStyle = SHELL_SHINE;
  c.beginPath();
  c.ellipse(-6, -20, 5, 2, -0.3, 0, TAU);
  c.fill();
  // ojos en pedúnculo
  for (const side of [-1, 1]) {
    c.strokeStyle = OUTLINE;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(side * 4, -24);
    c.lineTo(side * 5, -30);
    c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(side * 5, -31, 3, 0, TAU);
    c.fill();
    c.stroke();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(side * 5, up ? -30 : -31, 1.4, 0, TAU);
    c.fill();
  }
  if (up) {
    c.strokeStyle = OUTLINE;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-9, -35);
    c.lineTo(-3, -33);
    c.moveTo(9, -35);
    c.lineTo(3, -33);
    c.stroke();
  }
}

/**
 * Cangrejo azul procedural, de frente (camina de lado). Con las pinzas en alto
 * (no pisable) las abre sobre la cabeza y frunce el ceño: aviso claro al jugador.
 */
export const drawBlueCrab: EnemyDrawFn = (c, _assets, e) => {
  if (e.dead) c.scale(1, DEAD_SQUASH);
  const up = !e.dead && e.state === CRAB_STATE.clawsUp;
  if (e.vx < 0) c.scale(-1, 1);
  if (drawLazyFrame(c, CRAB_FILE, crabFrame(up, e.dead ? 0 : e.t), SCALE)) return;
  if (e.vx < 0) c.scale(-1, 1);
  drawLegs(c, e.dead ? 0 : e.t);
  drawShell(c, up);
  drawClaw(c, -1, up, e.t);
  drawClaw(c, 1, up, e.t);
};
