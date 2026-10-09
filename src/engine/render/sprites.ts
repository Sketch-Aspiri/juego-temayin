import { isReady, type Assets } from '../assets';
import { TAU, VW } from '../constants';
import type { Enemy, Fireball, Item, Particle, Player, Popup, Quill } from '../entities/types';
import { POPUP_LIFETIME, SPARK_LIFETIME } from '../entities/particles';
import { drawChili, drawCoin, drawLife, drawShield, outlined, type Ctx } from './drawUtils';

// Hoja de sprites del jugador.
const PLAYER_CELL_W = 170;
const PLAYER_CELL_H = 160;
const PLAYER_SCALE = 0.6;
const ANIM_ROW = { run: 0, jump: 1, fall: 2, idle: 3, win: 4 } as const;

export function drawPlayerSprite(c: Ctx, assets: Assets, p: Player, camX: number, dying: boolean, dyingT: number, now: number): void {
  if (!isReady(assets.player)) return;
  if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) return;
  const cx = p.x + p.w / 2 - camX;
  const by = p.y + p.h;

  if (p.shield) {
    const t = now / 300;
    c.fillStyle = `rgba(255,210,60,${0.18 + Math.sin(t) * 0.07})`;
    c.beginPath();
    c.ellipse(cx, by - 40, 46, 52, 0, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(255,220,90,.7)';
    c.lineWidth = 2;
    c.stroke();
  }

  c.save();
  c.translate(cx, by);
  if (p.face < 0) c.scale(-1, 1);
  if (dying) c.rotate(Math.min(dyingT, 0.4) * 0.5);
  let row: number = ANIM_ROW[dying ? 'fall' : p.anim];
  let fr = dying ? 0 : p.frame;
  if (p.throwT > 0 && !dying) {
    row = ANIM_ROW.jump; // pose de lanzar
    fr = 3;
  }
  if (p.fire) {
    c.shadowColor = '#ff7a1a';
    c.shadowBlur = 12 + Math.sin(now / 80) * 4;
  }
  c.drawImage(
    assets.player,
    fr * PLAYER_CELL_W, row * PLAYER_CELL_H, PLAYER_CELL_W, PLAYER_CELL_H,
    (-PLAYER_CELL_W * PLAYER_SCALE) / 2, -158 * PLAYER_SCALE, PLAYER_CELL_W * PLAYER_SCALE, PLAYER_CELL_H * PLAYER_SCALE,
  );
  c.restore();
}

/** Icono de la cabeza del jugador (para el menú / HUD de canvas). */
export function drawLifeIcon(c: Ctx, assets: Assets, x: number, y: number, scale: number): void {
  if (!isReady(assets.player)) return;
  c.drawImage(assets.player, 0, ANIM_ROW.idle * PLAYER_CELL_H, PLAYER_CELL_W, PLAYER_CELL_H, x, y, PLAYER_CELL_W * scale, PLAYER_CELL_H * scale);
}

function drawBat(c: Ctx, e: Enemy): void {
  const flap = Math.sin(e.t * 18);
  c.fillStyle = '#3b2a52';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 4, -14);
    c.quadraticCurveTo(side * 22, -14 - flap * 14, side * 30, -8 + flap * 6);
    c.quadraticCurveTo(side * 22, -6, side * 16, -2);
    c.quadraticCurveTo(side * 10, -8, side * 4, -4);
    c.fill();
  }
  c.fillStyle = '#54397a';
  c.beginPath();
  c.ellipse(0, -10, 9, 11, 0, 0, TAU);
  c.fill();
  // orejas
  c.fillStyle = '#3b2a52';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 3, -19);
    c.lineTo(side * 8, -29);
    c.lineTo(side * 9, -17);
    c.fill();
  }
  // ojos y colmillos
  c.fillStyle = '#ff4d4d';
  c.beginPath();
  c.arc(-3.5, -12, 2, 0, TAU);
  c.arc(3.5, -12, 2, 0, TAU);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-3, -5, 1.5, 3);
  c.fillRect(1.5, -5, 1.5, 3);
}

export function drawEnemySprite(c: Ctx, assets: Assets, e: Enemy, camX: number): void {
  const x = e.x - camX;
  if (x < -60 || x > VW + 60) return;
  c.save();
  c.translate(x + e.w / 2, e.y + e.h);
  if (e.flip) {
    c.translate(0, -e.h / 2);
    c.scale(1, -1);
    c.translate(0, e.h / 2);
  }
  if (e.id === 'bat') {
    c.translate(0, 0);
    if (e.vx > 0) c.scale(-1, 1);
    drawBat(c, e);
  } else if (e.id === 'coati') {
    // Coatí guardián (se puede pisar).
    if (e.vx < 0) c.scale(-1, 1);
    const s = 0.78;
    const row = e.dead ? 1 : 0;
    const fr = e.dead ? Math.min(6, Math.floor(e.dead * 14)) : Math.floor(e.t * 12) % 8;
    if (isReady(assets.coati)) c.drawImage(assets.coati, fr * 140, row * 80, 140, 80, -70 * s, -79 * s, 140 * s, 80 * s);
  } else {
    // Erizo del Caribe (no se puede pisar).
    if (e.vx < 0) c.scale(-1, 1);
    const s = 0.72;
    const row = e.dead ? 2 : 0;
    const fr = e.dead ? Math.min(2, Math.floor(e.dead * 8)) : Math.floor(e.t * 10) % 9;
    if (isReady(assets.urchin)) c.drawImage(assets.urchin, fr * 90, row * 80, 90, 80, -45 * s, -79 * s, 90 * s, 80 * s);
  }
  c.restore();
}

export function drawItemSprite(c: Ctx, it: Item, camX: number, now: number): void {
  const x = it.x + it.w / 2 - camX;
  const y = it.y + it.h / 2 + Math.sin(now / 150) * 1.5;
  if (it.kind === 'life') drawLife(c, x, y);
  else if (it.kind === 'fire') drawChili(c, x, y, 1, now);
  else drawShield(c, x, y);
}

export function drawFireballs(c: Ctx, list: readonly Fireball[], camX: number): void {
  for (const f of list) {
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

export function drawQuills(c: Ctx, list: readonly Quill[], camX: number): void {
  for (const q of list) {
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
        drawCoin(c, x, q.y, q.t * 25);
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
