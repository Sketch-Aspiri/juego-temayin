import { GROUND, T } from '../../constants';
import { CHIVO_POSES, CHIVO_STATE_POSE } from '../../../data/huayChivoArt';
import { bakedFrame } from '../../render/artCache';
import type { Ctx } from '../../render/drawUtils';
import {
  drawBlinkWarning, drawCallGlow, drawDazedStars, drawEyes, drawLeapShadow, drawPawDust, drawWaves, drawWisps,
  drawStucco, drawHornCue, EYE_GREEN, EYE_RED,
} from './drawHazards';
import type { ChivoState, HuayChivo } from './index';
import { APPEAR_TIME, DEAD_TIME, FADE_TIME, GRAVITY, LEAP_JUMP } from './tuning';

/**
 * Dibujo del Huay Chivo: atlas original y ocho acciones con escala anatómica fija,
 * y, encima, los avisos procedurales (ojos, polvo, estrellas, sombra del salto). Si el
 * atlas no está listo, un respaldo procedural mantiene legible la pelea.
 */

export const FRAME_OF = CHIVO_STATE_POSE;
const FLOOR = GROUND * T;
/** Altura máxima del salto: sirve para que la sombra crezca al acercarse al suelo. */
const LEAP_APEX = (LEAP_JUMP * LEAP_JUMP) / (2 * GRAVITY);
const HURT_FLICKER = 16;
const HURT_ALPHA = 0.35;
const STARS_LIFT = 12;
/** Raspa con la pezuña trasera: a esta fracción del cuerpo por detrás del centro. */
const HOOF_BACK = 0.35;
const RED_EYES: ReadonlySet<ChivoState> = new Set(['paw', 'turn', 'crouch', 'rear']);

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

function bodyAlpha(b: HuayChivo): number {
  switch (b.st) {
    case 'fade': return clamp01(1 - b.t / FADE_TIME);
    case 'appear': return clamp01(b.t / APPEAR_TIME);
    case 'hurt': return Math.floor(b.t * HURT_FLICKER) % 2 ? HURT_ALPHA : 1;
    case 'dead': return clamp01(1 - b.t / DEAD_TIME);
    default: return 1;
  }
}

function drawBody(c: Ctx, b: HuayChivo, camX: number): void {
  c.save();
  c.translate(b.x + b.w / 2 - camX, b.y + b.h);
  if (b.face < 0) c.scale(-1, 1);
  c.globalAlpha = bodyAlpha(b);
  const pose = CHIVO_POSES[FRAME_OF[b.st]];
  const image = bakedFrame(pose.file, pose.frame, pose.scale, true);
  if (image) c.drawImage(image, Math.round((pose.frame[0] - pose.anchor[0]) * pose.scale), Math.round((pose.frame[1] - pose.anchor[1]) * pose.scale));
  else {
    c.fillStyle = '#663b85'; c.fillRect(-b.w / 2, -b.h, b.w, b.h);
    c.fillStyle = '#e8d7a6'; c.fillRect(b.w / 4, -b.h - 10, 6, 14); c.fillRect(b.w / 4 - 12, -b.h - 10, 6, 14);
  }
  c.restore();
}

/** Avisos sobre el suelo, detrás del cuerpo: teletransporte, sombra del salto y ondas. */
function drawGroundCues(c: Ctx, b: HuayChivo, camX: number): void {
  if (b.st === 'hidden') {
    if (b.decoyX !== null) drawBlinkWarning(c, b.decoyX + b.w / 2, b.y + b.h - b.eyeY, b.t, camX, false);
    drawBlinkWarning(c, b.blinkX + b.w / 2, b.y + b.h - b.eyeY, b.t, camX, true, b.eyeX - (b.x + b.w / 2));
  }
  if (b.st === 'leap') drawLeapShadow(c, b.leapX + b.w / 2, 1 - (FLOOR - (b.y + b.h)) / LEAP_APEX, camX);
  drawWaves(c, b.waves, camX);
  drawStucco(c, b.stucco, camX);
}

/** Lectura del siguiente ataque encima del cuerpo: ojos, polvo, brillo y estrellas. */
function drawCues(c: Ctx, b: HuayChivo, camX: number): void {
  if (b.st === 'paw') drawPawDust(c, b.x + b.w / 2 - b.face * b.w * HOOF_BACK - camX, b.face, b.t);
  if (RED_EYES.has(b.st)) drawEyes(c, b.eyeX - camX, b.eyeY, EYE_RED);
  if (b.st === 'rear' || b.st === 'horn') drawHornCue(c, b, camX);
  if (b.st === 'call') {
    drawCallGlow(c, b.x + b.w / 2 - camX, b.y + b.h / 2, b.t);
    drawEyes(c, b.eyeX - camX, b.eyeY, EYE_GREEN);
  }
  if (b.st === 'dazed') drawDazedStars(c, b.x + b.w / 2 - camX, b.y - STARS_LIFT, b.clock);
}

export function drawHuayChivo(c: Ctx, b: HuayChivo, camX: number): void {
  if (b.st === 'gone') return;
  drawGroundCues(c, b, camX);
  if (b.st !== 'hidden') drawBody(c, b, camX);
  drawCues(c, b, camX);
  drawWisps(c, b.wisps, camX);
}
