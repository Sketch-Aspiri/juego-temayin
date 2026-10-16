import type { World } from '../../World';
import type { Rect } from '../../types';
import type { Sargazo } from './index';
import * as K from './tuning';

export interface SeaShot { x: number; y: number; vx: number; vy: number; wait: number; t: number }
export interface SeaTide { x: number; readonly dir: 1 | -1; readonly gapY: number; readonly gap: number; readonly speed: number }
export interface SeaVortex { readonly x: number; readonly y: number; t: number }
export const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const touches = (p: Rect, x: number, y: number, w: number, h: number): boolean =>
  p.x < x + w && p.x + p.w > x && p.y < y + h && p.y + p.h > y;

/** Salva dirigida a la posición anunciada, nunca corrige su rumbo durante el vuelo. */
export function salvo(b: Sargazo, count: number, wait = 0): void {
  const x = b.x + b.w / 2, y = b.y + b.h / 2;
  const aim = Math.atan2(b.targetY - y, b.targetX - x);
  for (let i = 0; i < count && b.shots.length < K.MAX_BALLS; i++) {
    const angle = aim + (i - (count - 1) / 2) * K.FAN_STEP;
    const speed = K.byPhase(K.BALL_SPEED, b.phase);
    b.shots.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, wait, t: 0 });
  }
}

export function startHazard(b: Sargazo, world: World): void {
  if (b.attack === 'salvo') salvo(b, K.byPhase(K.BALL_COUNT, b.phase));
  if (b.attack === 'tide') {
    const dir = b.targetX < (b.left + b.right) / 2 ? -1 : 1;
    if (b.tides.length >= 2) b.tides.shift();
    b.tides.push({ x: dir < 0 ? b.right : b.left, dir, gapY: b.targetY,
      gap: K.byPhase(K.TIDE_GAP, b.phase), speed: K.byPhase(K.TIDE_SPEED, b.phase) });
  }
  if (b.attack === 'surge') b.y = clamp(b.targetY - b.h / 2, K.SURFACE + K.DASH_MARGIN, K.FLOOR - b.h);
  if (b.attack === 'whirlpool') b.vortices.push({ x: b.targetX, y: b.targetY, t: 0 });
  if (b.attack === 'rain') {
    for (let i = 0; i < K.RAIN_COLUMNS && b.shots.length < K.MAX_BALLS; i++) {
      const x = b.left + (i + 0.5) * (b.right - b.left) / K.RAIN_COLUMNS;
      b.shots.push({ x, y: K.SURFACE + K.BALL_RADIUS, vx: 0, vy: K.RAIN_SPEED,
        wait: K.SEED_WARN + i * K.RAIN_STAGGER, t: 0 });
    }
  }
  if (b.attack === 'net') b.team.ensnare(b.targetTurtle);
  world.audio.play('roar');
}

export function stepShots(world: World, shots: SeaShot[], dt: number, left: number, right: number): void {
  let n = 0;
  for (const shot of shots) {
    if (shot.wait > 0) { shot.wait -= dt; shots[n++] = shot; continue; }
    shot.t += dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt;
    if (shot.t > K.BALL_LIFE || shot.x < left || shot.x > right || shot.y < K.SURFACE || shot.y > K.FLOOR) continue;
    if (touches(world.player, shot.x - K.BALL_RADIUS, shot.y - K.BALL_RADIUS, K.BALL_RADIUS * 2, K.BALL_RADIUS * 2)) {
      world.hurt(); continue;
    }
    shots[n++] = shot;
  }
  shots.length = n;
}

/** La cortina cruza toda la columna salvo el hueco señalado desde el aviso. */
export function stepTides(world: World, tides: SeaTide[], dt: number, left: number, right: number): void {
  let n = 0;
  for (const tide of tides) {
    tide.x += tide.dir * tide.speed * dt;
    if (tide.x < left - K.TIDE_WIDTH || tide.x > right + K.TIDE_WIDTH) continue;
    const p = world.player;
    if (p.y + p.h > K.SURFACE && p.y < K.FLOOR
      && p.x + p.w > tide.x - K.TIDE_WIDTH / 2 && p.x < tide.x + K.TIDE_WIDTH / 2
      && (p.y < tide.gapY - tide.gap / 2 || p.y + p.h > tide.gapY + tide.gap / 2)) world.hurt();
    tides[n++] = tide;
  }
  tides.length = n;
}

/** La succión se puede remontar nadando; solo el centro pequeño causa daño. */
export function stepVortices(world: World, vortices: SeaVortex[], phase: K.SeaPhase, dt: number): void {
  let n = 0;
  const p = world.player;
  for (const vortex of vortices) {
    vortex.t += dt;
    if (vortex.t > K.VORTEX_LIFE) continue;
    const dx = vortex.x - (p.x + p.w / 2), dy = vortex.y - (p.y + p.h / 2);
    const distance = Math.hypot(dx, dy);
    if (distance < K.VORTEX_CORE) world.hurt();
    if (distance < K.VORTEX_RADIUS && distance > 0) {
      const pull = K.byPhase(K.VORTEX_PULL, phase) * dt;
      p.vx += dx / distance * pull; p.vy += dy / distance * pull;
    }
    vortices[n++] = vortex;
  }
  vortices.length = n;
}
