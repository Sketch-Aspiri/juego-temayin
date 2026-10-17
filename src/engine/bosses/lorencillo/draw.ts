import { LORENCILLO_POSES, LORENCILLO_STATE_POSE } from '../../../data/lorencilloArt';
import { bakedFrame } from '../../render/artCache';
import type { Ctx } from '../../render/drawUtils';
import { drawBattleCues, drawShells, drawWarnCue } from './drawHazards';
import type { Lorencillo } from './index';
import { DEAD_TIME, MAST_THROW_AT } from './tuning';

/**
 * Dibujo de Lorencillo: acciones propias con escala fija y avisos de estocada,
 * inclinación y apertura. Sin atlas, un respaldo procedural
 * (cuerpo de pez con pañuelo rojo) mantiene legible la pelea.
 */

const HURT_FLICKER = 16;
const HURT_ALPHA = 0.35;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

function bodyAlpha(b: Lorencillo): number {
  switch (b.st) {
    case 'hurt': return Math.floor(b.t * HURT_FLICKER) % 2 ? HURT_ALPHA : 1;
    case 'dead': return clamp01(1 - b.t / DEAD_TIME);
    default: return 1;
  }
}

/** Respaldo: cuerpo azul verdoso, pañuelo rojo y sable de aleta hacia delante. */
function drawFallback(c: Ctx, b: Lorencillo): void {
  c.fillStyle = '#3d8a96'; c.fillRect(-b.w / 2, -b.h, b.w, b.h);
  c.fillStyle = '#c93232'; c.fillRect(-b.w / 2, -b.h, b.w, 12);
  c.fillStyle = '#6b2a4e'; c.fillRect(-b.w / 2, -b.h / 2, b.w, b.h / 3);
  if (b.st === 'lunge') { c.fillStyle = '#cfd8dc'; c.fillRect(b.w / 2, -b.h / 2, b.w, 8); }
}

function drawBody(c: Ctx, b: Lorencillo, camX: number): void {
  c.save();
  c.translate(b.x + b.w / 2 - camX, b.y + b.h);
  if (b.face < 0) c.scale(-1, 1);
  c.globalAlpha = bodyAlpha(b);
  const throwing = b.st === 'mast' && MAST_THROW_AT.some(t => Math.abs(b.t - t) < 0.15);
  const pose = LORENCILLO_POSES[throwing ? 'throw' : LORENCILLO_STATE_POSE[b.st]];
  const image = bakedFrame(pose.file, pose.frame, pose.scale, true);
  if (image) c.drawImage(image, Math.round((pose.frame[0] - pose.anchor[0]) * pose.scale), Math.round((pose.frame[1] - pose.anchor[1]) * pose.scale));
  else drawFallback(c, b);
  c.restore();
}

export function drawLorencillo(c: Ctx, b: Lorencillo, camX: number): void {
  if (b.st === 'gone') return;
  drawShells(c, b.shells, camX);
  drawBattleCues(c, b, camX);
  drawBody(c, b, camX);
  if (b.st === 'warn') drawWarnCue(c, b.x + b.w / 2 - camX, b.y, b.t);
}
