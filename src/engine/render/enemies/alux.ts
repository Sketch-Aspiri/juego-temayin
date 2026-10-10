import { TAU } from '../../constants';
import { ALUX_STATE, aluxLoot } from '../../entities/enemies/alux';
import type { Enemy } from '../../entities/types';
import type { Ctx } from '../drawUtils';
import type { EnemyDrawFn } from './types';

/**
 * Alux: pequeño ser de barro del monte yucateco, con corona de hojas y cara
 * traviesa (no maligna, AGENTS.md §9). Lleva un morral de cacao cuando ha robado.
 */
const CLAY = '#b0703f';
const CLAY_DARK = '#7a4522';
const CLAY_LIGHT = '#d4955e';
const LEAF = '#4f9a3a';
const LEAF_DARK = '#2f6a26';
const SACK = '#c9a46a';
const SACK_DARK = '#8a6a3a';
const OUTLINE = '#3a2010';
const STEP_SPEED_ROAM = 10;
const STEP_SPEED_FLEE = 26;
const STEP_SWING = 3;
const DEAD_SQUASH = 0.45;

function legs(c: Ctx, e: Enemy): void {
  const speed = e.state === ALUX_STATE.flee ? STEP_SPEED_FLEE : STEP_SPEED_ROAM;
  const s = Math.sin(e.t * speed) * STEP_SWING;
  c.fillStyle = CLAY_DARK;
  c.fillRect(-6 + s, -8, 5, 8);
  c.fillRect(1 - s, -8, 5, 8);
}

function body(c: Ctx): void {
  c.fillStyle = CLAY;
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, -14, 9, 8, 0, 0, TAU);
  c.fill();
  c.stroke();
  // Cabeza grande, redonda.
  c.beginPath();
  c.arc(1, -25, 9, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = CLAY_LIGHT;
  c.beginPath();
  c.arc(-2, -28, 3, 0, TAU);
  c.fill();
}

/** Corona de hojas del monte. */
function leaves(c: Ctx, t: number): void {
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * 0.6 + Math.sin(t * 3 + i) * 0.08;
    c.fillStyle = i === 1 ? LEAF : LEAF_DARK;
    c.beginPath();
    c.ellipse(1 + Math.cos(a) * 9, -33 + Math.sin(a) * 4, 3, 7, a + Math.PI / 2, 0, TAU);
    c.fill();
  }
}

/** Ojos grandes y sonrisa traviesa (más amplia cuando huye con el botín). */
function face(c: Ctx, fleeing: boolean): void {
  c.fillStyle = '#fff';
  for (const x of [0, 6]) {
    c.beginPath();
    c.arc(x, -26, 2.8, 0, TAU);
    c.fill();
  }
  c.fillStyle = '#111';
  for (const x of [1, 7]) {
    c.beginPath();
    c.arc(x, -26, 1.4, 0, TAU);
    c.fill();
  }
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(4, -22, fleeing ? 3.5 : 2.5, 0.15 * Math.PI, 0.85 * Math.PI);
  c.stroke();
}

/** Morral de cacao a la espalda. */
function sack(c: Ctx): void {
  c.fillStyle = SACK;
  c.strokeStyle = SACK_DARK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(-10, -16, 6, 7, -0.2, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = '#6b3a1a';
  c.beginPath();
  c.ellipse(-10, -22, 2.5, 1.6, 0, 0, TAU);
  c.fill();
}

export const drawAlux: EnemyDrawFn = (c, _assets, e) => {
  if (e.vx < 0) c.scale(-1, 1);
  if (e.dead) c.scale(1, DEAD_SQUASH);
  legs(c, e);
  if (aluxLoot(e) > 0) sack(c);
  body(c);
  leaves(c, e.t);
  face(c, e.state === ALUX_STATE.flee);
};
