import { isReady, type Assets } from '../assets';
import { TAU } from '../constants';
import type { Fireball, Item, Particle, Player, Popup, Quill } from '../entities/types';
import { POPUP_LIFETIME, SPARK_LIFETIME } from '../entities/particles';
import { outlined, type Ctx } from './drawUtils';
import { drawSwimPose } from './playerSwim';
import { drawCacao, drawItemArt } from './props';
import { drawPlayerMechanics } from './playerMechanics';
import { drawFireballArt, drawQuillArt } from './projectileSprites';
import { PLAYER_SPRITES } from '../../data/playerSprites';
import { drawAtlasFrame } from './enemies/atlas';

// Hoja de sprites del jugador.
const PLAYER_CELL_W = 170;
const PLAYER_CELL_H = 160;
const ANIM_ROW = { run: 0, jump: 1, fall: 2, idle: 3, win: 4 } as const;

export function drawPlayerSprite(c: Ctx, assets: Assets, p: Player, camX: number, dying: boolean, dyingT: number, now: number): void {
  if (!isReady(assets.player)) return;
  if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) return;
  const cx = p.x + p.w / 2 - camX;
  const by = p.y + p.h;

  if (p.shield) drawShieldAura(c, cx, by, now);

  c.save();
  c.translate(cx, by);
  if (p.face < 0) c.scale(-1, 1);
  if (dying) c.rotate(Math.min(dyingT, 0.4) * 0.5);
  const frames = PLAYER_SPRITES[dying ? 'fall' : p.anim];
  let frame = frames[dying ? 0 : p.frame] ?? frames[0];
  if (p.throwT > 0 && !dying) {
    frame = PLAYER_SPRITES.jump[3];
  }
  if (p.fire) {
    c.shadowColor = '#ff7a1a';
    c.shadowBlur = 12 + Math.sin(now / 80) * 4;
  }
  if (!dying && (drawPlayerMechanics(c, p) || (p.swimming && drawSwimPose(c, p)))) {
    c.restore();
    return;
  }
  drawAtlasFrame(c, assets.player, frame, frame.scale);
  c.restore();
}

function drawShieldAura(c: Ctx, cx: number, by: number, now: number): void {
  const t = now / 300;
  c.fillStyle = `rgba(255,210,60,${0.18 + Math.sin(t) * 0.07})`;
  c.beginPath();
  c.ellipse(cx, by - 40, 46, 52, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(255,220,90,.7)';
  c.lineWidth = 2;
  c.stroke();
}

/** Icono de la cabeza del jugador (para el menú / HUD de canvas). */
export function drawLifeIcon(c: Ctx, assets: Assets, x: number, y: number, scale: number): void {
  if (!isReady(assets.player)) return;
  c.drawImage(assets.player, 0, ANIM_ROW.idle * PLAYER_CELL_H, PLAYER_CELL_W, PLAYER_CELL_H, x, y, PLAYER_CELL_W * scale, PLAYER_CELL_H * scale);
}

export function drawItemSprite(c: Ctx, it: Item, camX: number, now: number): void {
  const x = it.x + it.w / 2 - camX;
  const y = it.y + it.h / 2 + Math.sin(now / 150) * 1.5;
  drawItemArt(c, it.kind, x, y, now);
}

export function drawFireballs(c: Ctx, list: readonly Fireball[], camX: number): void {
  for (const f of list) {
    if (drawFireballArt(c, f, camX)) continue;
    c.save();
    c.translate(f.x - camX, f.y);
    c.rotate(f.t * 20 * Math.sign(f.vx));
    c.fillStyle = '#ff4d12';
    c.beginPath();
    c.arc(0, 0, 9, 0, TAU);
    c.fill();
    c.fillStyle = '#ffb02e';
    c.beginPath();
    c.arc(2, -1, 6, 0, TAU);
    c.fill();
    c.fillStyle = '#fff3a0';
    c.beginPath();
    c.arc(3, -2, 3, 0, TAU);
    c.fill();
    c.restore();
  }
}

/** Fruto (zapote) que lanza el saraguato. */
function drawFruit(c: Ctx, x: number, y: number): void {
  c.fillStyle = '#8a4b1f';
  c.strokeStyle = '#2b1608';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(x, y, 8, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,220,170,.55)';
  c.beginPath();
  c.ellipse(x - 3, y - 3, 3, 2, -0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#3f7a2a';
  c.fillRect(x - 1, y - 11, 2, 5);
}

export function drawQuills(c: Ctx, list: readonly Quill[], camX: number): void {
  for (const q of list) {
    if (drawQuillArt(c, q, camX)) continue;
    if (q.kind === 'fruit') {
      drawFruit(c, q.x - camX, q.y);
      continue;
    }
    c.save();
    c.translate(q.x - camX, q.y);
    c.rotate(Math.atan2(q.vy, q.vx));
    c.fillStyle = '#3b1f0c';
    c.beginPath();
    c.moveTo(14, 0);
    c.lineTo(-12, -5);
    c.lineTo(-12, 5);
    c.fill();
    c.fillStyle = '#f39c12';
    c.beginPath();
    c.moveTo(14, 0);
    c.lineTo(2, -3);
    c.lineTo(2, 3);
    c.fill();
    c.restore();
  }
}

export function drawParticles(c: Ctx, list: readonly Particle[], popups: readonly Popup[], camX: number): void {
  for (const q of list) {
    const x = q.x - camX;
    switch (q.kind) {
      case 'coin':
        drawCacao(c, x, q.y, q.t * 25);
        break;
      case 'brick':
        c.save();
        c.translate(x, q.y);
        c.rotate(q.rot);
        c.fillStyle = '#c4622d';
        c.fillRect(-8, -8, 16, 16);
        c.fillStyle = '#5a2a10';
        c.fillRect(-8, -1, 16, 2);
        c.restore();
        break;
      case 'spark':
        c.globalAlpha = Math.max(0, 1 - q.t / SPARK_LIFETIME);
        c.fillStyle = q.col;
        c.fillRect(x - 2, q.y - 2, 4, 4);
        c.globalAlpha = 1;
        break;
      case 'dust':
        c.globalAlpha = Math.max(0, 0.6 - q.t * 1.2);
        c.fillStyle = '#d8c3a0';
        c.beginPath();
        c.arc(x, q.y, 6 + q.t * 20, 0, TAU);
        c.fill();
        c.globalAlpha = 1;
        break;
    }
  }
  c.font = 'bold 18px "Trebuchet MS", sans-serif';
  c.textAlign = 'center';
  for (const u of popups) {
    c.globalAlpha = Math.max(0, 1 - u.t / POPUP_LIFETIME);
    outlined(c, u.txt, u.x + 20 - camX, u.y - u.t * 50, '#fff');
    c.globalAlpha = 1;
  }
}
