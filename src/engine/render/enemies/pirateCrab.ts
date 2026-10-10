import { TAU } from '../../constants';
import { PIRATE_CRAB_STATE } from '../../entities/enemies/pirateCrab';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';

/** Paleta del cangrejo pirata: caparazón naranja, pañuelo rojo con lunares blancos. */
const OUTLINE = '#3a1608';
const SHELL = '#e8743a';
const SHELL_DARK = '#b8501f';
const SHELL_SHINE = '#ffc08a';
const BANDANA = '#d0283a';
const BANDANA_DOT = '#fff4e8';
const CLAW = '#f39a5e';
const STEP_SPEED = 16;
const CROUCH_SQUASH = 0.8;
const DEAD_SQUASH = 0.45;

function drawLegs(c: Ctx, t: number, airborne: boolean): void {
  c.strokeStyle = OUTLINE;
  c.lineWidth = 3;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lift = airborne ? 4 : Math.max(0, Math.sin(t * STEP_SPEED + i * 2 + (side > 0 ? Math.PI : 0))) * 3;
      const bx = side * (7 + i * 3);
      c.beginPath();
      c.moveTo(bx, -9);
      c.lineTo(bx + side * 6, -13 - lift);
      c.lineTo(bx + side * 9, -lift * 0.6);
      c.stroke();
    }
  }
}

/** Pinzas redondeadas y cerradas: un pirata de cuento, no amenazante. */
function drawClaws(c: Ctx, t: number): void {
  const wave = Math.sin(t * 6) * 2;
  for (const side of [-1, 1]) {
    c.strokeStyle = OUTLINE;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(side * 10, -13);
    c.lineTo(side * 16, -20 + side * wave);
    c.stroke();
    c.fillStyle = CLAW;
    c.beginPath();
    c.ellipse(side * 17, -23 + side * wave, 5.5, 4.5, side * 0.4, 0, TAU);
    c.fill();
    c.stroke();
  }
}

function drawShell(c: Ctx): void {
  c.fillStyle = SHELL;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-15, -9);
  c.quadraticCurveTo(-17, -24, 0, -24);
  c.quadraticCurveTo(17, -24, 15, -9);
  c.quadraticCurveTo(0, -4, -15, -9);
  c.fill();
  c.stroke();
  c.fillStyle = SHELL_DARK;
  c.beginPath();
  c.ellipse(0, -10, 11, 2.5, 0, 0, TAU);
  c.fill();
  c.fillStyle = SHELL_SHINE;
  c.beginPath();
  c.ellipse(6, -18, 4, 1.8, 0.3, 0, TAU);
  c.fill();
}

/** Ojos en pedúnculo con un pañuelo pirata anudado entre ellos. */
function drawFace(c: Ctx, dir: number): void {
  for (const side of [-1, 1]) {
    c.strokeStyle = OUTLINE;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(side * 4, -23);
    c.lineTo(side * 5, -29);
    c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(side * 5, -30, 3, 0, TAU);
    c.fill();
    c.stroke();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(side * 5 + dir, -30, 1.4, 0, TAU);
    c.fill();
  }
  c.fillStyle = BANDANA;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-12, -20);
  c.quadraticCurveTo(0, -27, 12, -20);
  c.lineTo(10, -17);
  c.quadraticCurveTo(0, -22, -10, -17);
  c.closePath();
  c.fill();
  c.stroke();
  // nudo y puntas que ondean hacia atrás
  c.beginPath();
  c.moveTo(-dir * 11, -19);
  c.lineTo(-dir * 18, -22);
  c.lineTo(-dir * 16, -16);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = BANDANA_DOT;
  for (const x of [-6, 0, 6]) c.fillRect(x - 1, -22, 2, 2);
  // sonrisa
  c.strokeStyle = OUTLINE;
  c.beginPath();
  c.arc(0, -14, 3, 0.2, Math.PI - 0.2);
  c.stroke();
}

/**
 * Cangrejo pirata procedural: de frente, con pañuelo rojo de lunares y sonrisa.
 * Se agacha antes de brincar (aviso) y encoge las patas en el aire.
 */
export const drawPirateCrab: EnemyDrawFn = (c, _assets, e) => {
  if (e.dead) c.scale(1, DEAD_SQUASH);
  else if (e.state === PIRATE_CRAB_STATE.crouch) c.scale(1.08, CROUCH_SQUASH);
  const dir = e.vx >= 0 ? 1 : -1;
  drawLegs(c, e.dead ? 0 : e.t, e.state === PIRATE_CRAB_STATE.jump);
  drawShell(c);
  drawClaws(c, e.dead ? 0 : e.t);
  drawFace(c, dir);
};
