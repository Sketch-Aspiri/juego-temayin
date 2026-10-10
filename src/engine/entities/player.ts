import { GROUND, OXYGEN_MAX, PLAYER_H, PLAYER_W, T } from '../constants';
import { moveX, moveY } from '../physics';
import type { World } from '../World';
import { bounceHammocks } from './hammocks';
import { updateRopes } from './ropes';
import { throwBall } from './ball';
import { clampSeabed, currentDrift, isSwimming, swimStep, trySurfaceLeap, updateOxygen } from './swim';
import type { Player } from './types';

export const MAX_FIREBALLS = 2;

const COYOTE_TIME = 0.09;
const JUMP_BUFFER_TIME = 0.12;
const LAND_TIME = 0.12;

export function createPlayer(tx: number): Player {
  return {
    x: tx * T + 4,
    swinging: null,
    ropeCooldown: 0,
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
    swimming: false,
    oxygen: OXYGEN_MAX,
    snorkel: 0,
    strokeT: 0,
    ball: false,
  };
}

/** Movimiento, salto, disparo y colisiones del jugador durante un paso de simulación. */
export function updatePlayer(world: World, dt: number): void {
  const p = world.player;
  shoot(world, dt);
  if (updateRopes(world, dt)) return;
  const previousFeet = p.y + p.h;
  p.jumpBuf = world.input.consumeJump() ? JUMP_BUFFER_TIME : p.jumpBuf - dt;
  p.swimming = isSwimming(world.level.water, p);
  if (p.swimming) swimStep(world, dt);
  else {
    runStep(world, dt);
    jumpStep(world, dt);
  }
  moveAndCollide(world, dt);
  bounceHammocks(world, previousFeet);
  updateOxygen(world, dt);
  if (p.land > 0) p.land -= dt;
  if (p.inv > 0) p.inv -= dt;
  if (p.strokeT > 0) p.strokeT -= dt;
}

function shoot(world: World, dt: number): void {
  const p = world.player;
  // La pelota tiene prioridad; si ya está en el aire, dispara el chile (ver `entities/ball.ts`).
  if (world.input.consumeFire() && !throwBall(world) && p.fire && world.fireballs.length < MAX_FIREBALLS) {
    world.fireballs.push({ x: p.x + p.w / 2 + p.face * 22, y: p.y + 26, vx: p.face * 520, vy: 120, t: 0, gone: false });
    p.throwT = 0.15;
    world.audio.play('fire');
  }
  if (p.throwT > 0) p.throwT -= dt;
}

/** Carrera en tierra: aceleración, derrape y fricción. */
function runStep(world: World, dt: number): void {
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
}

/** Salto con coyote y búfer, salto variable y gravedad normal. */
function jumpStep(world: World, dt: number): void {
  const p = world.player;
  p.coyote = p.onGround ? COYOTE_TIME : p.coyote - dt;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -(830 + Math.abs(p.vx) * 0.25);
    p.coyote = 0;
    p.jumpBuf = 0;
    p.onGround = false;
    world.audio.play('jump');
  } else trySurfaceLeap(world); // con el centro ya fuera del agua aún puede saltar a la orilla
  // Salto variable; el salto para salir del agua (strokeT > 0) no se recorta, así un
  // toque basta para subir a la orilla.
  if (!world.input.held.jump && p.vy < -300 && p.strokeT <= 0) p.vy = -300;
  p.vy = Math.min(p.vy + 2200 * dt, 1000);
}

/** Aplica velocidad + corriente contra la cuadrícula, el borde de la cámara y el fondo del agua. */
function moveAndCollide(world: World, dt: number): void {
  const p = world.player;
  const [driftX, driftY] = currentDrift(world, p, dt);
  const wasGround = p.onGround;
  if (moveX(p, p.vx * dt + driftX, world.solidAt)) p.vx = 0;
  if (p.x < world.camX) {
    p.x = world.camX;
    p.vx = Math.max(0, p.vx);
  }
  const head = moveY(p, p.vy * dt + driftY, world.solidAt);
  if (head) world.hitBlock(head[0], head[1]);
  if (p.swimming) clampSeabed(p);
  if (!wasGround && p.onGround && !p.swimming) p.land = LAND_TIME;
}

/** Elige la animación y el fotograma según el estado del jugador. */
export function animatePlayer(p: Player, dt: number): void {
  p.animT += dt;
  if (p.swimming) {
    // Brazada: pose de impulso; si no, flota con el ciclo lento de caída.
    p.anim = p.strokeT > 0 ? 'jump' : 'fall';
    p.frame = p.strokeT > 0 ? 3 : Math.floor(p.animT * 4) % PLAYER_FRAMES.fall;
  } else if (!p.onGround) {
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
