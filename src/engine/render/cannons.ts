import { T, TAU } from '../constants';
import { CANNONBALL_RADIUS, fuseX, muzzleX, type Cannon, type Cannonball } from '../entities/cannons';
import type { Ctx } from './drawUtils';

/** Duración del fogonazo en la boca tras disparar (s). */
const FLASH_TIME = 0.14;
const FLASH_RADIUS = 26;
/** Chispas de la mecha durante el aviso: cantidad, alcance (px) y frecuencia del parpadeo. */
const FUSE_SPARKS = 5;
const FUSE_SPREAD = 9;
const FUSE_FLICKER = 0.025;
/** Altura de la mecha sobre la culata (px). */
const FUSE_HEIGHT = 6;
/** Pulso del brillo de aviso en la boca. */
const WARN_PULSE = 0.012;
const WARN_GLOW_RADIUS = 14;
/** Estela de la bala: largo (px) y opacidad. */
const TRAIL_LENGTH = 26;
const TRAIL_ALPHA = 0.35;

/** Mecha encendida durante el aviso y fogonazo justo después del disparo. */
export function drawCannonFx(c: Ctx, cannons: readonly Cannon[], camX: number, now: number): void {
  for (const cannon of cannons) {
    const y = cannon.y * T;
    if (cannon.state === 'warn') drawFuse(c, fuseX(cannon) - camX, y - FUSE_HEIGHT, now);
    if (cannon.state === 'warn') drawWarnGlow(c, muzzleX(cannon) - camX, y + T / 2, now);
    if (cannon.sinceShot < FLASH_TIME) drawFlash(c, muzzleX(cannon) - camX, y + T / 2, cannon.sinceShot / FLASH_TIME);
  }
}

function drawFuse(c: Ctx, x: number, y: number, now: number): void {
  const seed = Math.floor(now * FUSE_FLICKER);
  c.save();
  for (let i = 0; i < FUSE_SPARKS; i++) {
    const a = ((seed * 7 + i * 13) % 360) * (TAU / 360);
    const r = FUSE_SPREAD * (0.4 + ((seed + i) % 3) / 4);
    c.fillStyle = i % 2 ? '#ffd23f' : '#ff6a1a';
    c.fillRect(x + Math.cos(a) * r - 1.5, y + Math.sin(a) * r - 1.5, 3, 3);
  }
  c.fillStyle = '#fff3b0';
  c.beginPath();
  c.arc(x, y, 3, 0, TAU);
  c.fill();
  c.restore();
}

function drawWarnGlow(c: Ctx, x: number, y: number, now: number): void {
  const pulse = 0.35 + 0.25 * Math.sin(now * WARN_PULSE);
  c.save();
  c.globalAlpha = pulse;
  c.fillStyle = '#ff7a2a';
  c.beginPath();
  c.arc(x, y, WARN_GLOW_RADIUS, 0, TAU);
  c.fill();
  c.restore();
}

function drawFlash(c: Ctx, x: number, y: number, k: number): void {
  c.save();
  c.globalAlpha = 1 - k;
  const g = c.createRadialGradient(x, y, 0, x, y, FLASH_RADIUS);
  g.addColorStop(0, '#fffbe0');
  g.addColorStop(0.45, '#ffb347');
  g.addColorStop(1, 'rgba(255, 106, 26, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, FLASH_RADIUS, 0, TAU);
  c.fill();
  c.restore();
}

/** Balas de hierro con brillo y una estela tenue detrás. */
export function drawCannonballs(c: Ctx, balls: readonly Cannonball[], camX: number): void {
  for (const b of balls) {
    const x = b.x - camX;
    const back = -Math.sign(b.vx);
    c.save();
    c.globalAlpha = TRAIL_ALPHA;
    c.fillStyle = '#d9d2c3';
    c.fillRect(Math.min(x, x + back * TRAIL_LENGTH), b.y - CANNONBALL_RADIUS / 2, TRAIL_LENGTH, CANNONBALL_RADIUS);
    c.globalAlpha = 1;
    const g = c.createRadialGradient(x - 4, b.y - 4, 1, x, b.y, CANNONBALL_RADIUS);
    g.addColorStop(0, '#8d949c');
    g.addColorStop(0.5, '#3b3f45');
    g.addColorStop(1, '#16181b');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, b.y, CANNONBALL_RADIUS, 0, TAU);
    c.fill();
    c.strokeStyle = '#0b0c0e';
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  }
}
