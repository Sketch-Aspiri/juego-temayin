import { GROUND, PLAYER_H, PLAYER_W, T } from '../constants';
import { moveX, moveY } from '../physics';
import type { World } from '../World';
import type { Player } from './types';

export const MAX_FIREBALLS = 2;

export function createPlayer(tx: number): Player {
  return {
    x: tx * T + 4,
    y: GROUND * T - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    face: 1,
    onGround: false,
    anim: 'idle',
    frame: 0,
    animT: 0,
    runT: 0,
    coyote: 0,
    jumpBuf: 0,
    shield: false,
    fire: false,
    inv: 0,
    land: 0,
    throwT: 0,
  };
}

/** Movimiento, salto, disparo y colisiones del jugador durante un paso de simulación. */
export function updatePlayer(world: World, dt: number): void {
  const p = world.player;
  const held = world.input.held;
  const maxV = held.run ? 400 : 260;
  const acc = p.onGround ? 1700 : 1100;
  const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);

  if (dir) {
    // Derrape: frenar girando es más rápido que acelerar.
    const k = Math.sign(p.vx) !== dir && p.onGround ? 1.8 : 1;
    p.vx += dir * acc * k * dt;
    p.vx = Math.max(-maxV, Math.min(maxV, p.vx));
    p.face = dir > 0 ? 1 : -1;
  } else if (p.onGround) {
    const f = 1500 * dt;
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
  }
  if (Math.abs(p.vx) > maxV && p.onGround) p.vx -= Math.sign(p.vx) * 900 * dt;

  p.coyote = p.onGround ? 0.09 : p.coyote - dt;
  p.jumpBuf = world.input.consumeJump() ? 0.12 : p.jumpBuf - dt;

  if (world.input.consumeFire() && p.fire && world.fireballs.length < MAX_FIREBALLS) {
    world.fireballs.push({ x: p.x + p.w / 2 + p.face * 22, y: p.y + 26, vx: p.face * 520, vy: 120, t: 0, gone: false });
    p.throwT = 0.15;
    world.audio.play('fire');
  }
  if (p.throwT > 0) p.throwT -= dt;

  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -(830 + Math.abs(p.vx) * 0.25);
    p.coyote = 0;
    p.jumpBuf = 0;
    p.onGround = false;
    world.audio.play('jump');
  }
  if (!held.jump && p.vy < -300) p.vy = -300; // salto variable
  p.vy = Math.min(p.vy + 2200 * dt, 1000);

  const wasGround = p.onGround;
  if (moveX(p, p.vx * dt, world.solidAt)) p.vx = 0;
  if (p.x < world.camX) {
    p.x = world.camX;
    p.vx = Math.max(0, p.vx);
  }
  const head = moveY(p, p.vy * dt, world.solidAt);
  if (head) world.hitBlock(head[0], head[1]);
  if (!wasGround && p.onGround) p.land = 0.12;
  if (p.land > 0) p.land -= dt;
  if (p.inv > 0) p.inv -= dt;
}

/** Elige la animación y el fotograma según el estado del jugador. */
export function animatePlayer(p: Player, dt: number): void {
  p.animT += dt;
  if (!p.onGround) {
    if (p.vy < -350) {
      p.anim = 'jump';
      p.frame = p.vy < -650 ? 2 : 3;
    } else if (p.vy < 150) {
      p.anim = 'jump';
      p.frame = 4;
    } else {
      p.anim = 'fall';
      p.frame = Math.floor(p.animT * 8) % 3;
    }
  } else if (p.land > 0) {
    p.anim = 'jump';
    p.frame = 6;
  } else if (Math.abs(p.vx) > 20) {
    p.anim = 'run';
    p.runT += dt * (7 + Math.abs(p.vx) / 28);
    p.frame = Math.floor(p.runT) % PLAYER_FRAMES.run;
  } else {
    p.anim = 'idle';
    p.frame = Math.floor(p.animT * 6) % PLAYER_FRAMES.idle;
  }
}

export const PLAYER_FRAMES = { run: 7, jump: 8, fall: 7, idle: 7, win: 7 } as const;
