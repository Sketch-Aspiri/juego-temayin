import { TAU } from '../../constants';
import { CRAB_STATE } from '../../entities/enemies/blueCrab';
import type { Ctx } from '../drawUtils';
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
  drawLegs(c, e.dead ? 0 : e.t);
  drawShell(c, up);
  drawClaw(c, -1, up, e.t);
  drawClaw(c, 1, up, e.t);
};
