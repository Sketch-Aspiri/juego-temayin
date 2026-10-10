import { T } from '../constants';
import type { World } from '../World';

export interface RopeDef { readonly x: number; readonly y: number; readonly length: number }
export interface Rope extends RopeDef { angle: number; speed: number }
export const ROPE_GRAVITY = 1700;
const PUMP = 2.4;
const MAX_ANGLE = 1.12;
const MAX_SPEED = 2.5;
const GRAB_DISTANCE = 30;
const RELEASE_DELAY = 0.4;
const RELEASE_JUMP = 430;

export const ropeTip = (r: Rope): readonly [number, number] =>
  [r.x + Math.sin(r.angle) * r.length, r.y + Math.cos(r.angle) * r.length];
export const createRope = (r: RopeDef): Rope => ({ ...r, angle: 0, speed: 0 });

/** Soltar conserva la velocidad tangencial; el bloqueo breve evita engancharse de inmediato. */
export function releaseRope(world: World, rope: Rope): void {
  const p = world.player;
  p.vx = Math.cos(rope.angle) * rope.length * rope.speed;
  p.vy = -Math.sin(rope.angle) * rope.length * rope.speed - RELEASE_JUMP;
  p.swinging = null;
  p.ropeCooldown = RELEASE_DELAY;
  p.jumpBuf = 0;
  p.coyote = 0;
  p.strokeT = 0.25;
  world.audio.play('jump');
}

/** Péndulo físico; izquierda/derecha bombean y una nueva pulsación de salto suelta. */
export function updateRopes(world: World, dt: number): boolean {
  const p = world.player;
  p.ropeCooldown = Math.max(0, p.ropeCooldown - dt);
  for (let i = 0; i < world.ropes.length; i++) {
    const r = world.ropes[i];
    const held = p.swinging === i;
    const dir = held ? Number(world.input.held.right) - Number(world.input.held.left) : 0;
    r.speed += (-ROPE_GRAVITY / r.length * Math.sin(r.angle) + dir * PUMP) * dt;
    r.speed *= Math.exp(-0.12 * dt);
    r.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, r.speed));
    r.angle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, r.angle + r.speed * dt));
    if (Math.abs(r.angle) >= MAX_ANGLE) r.speed *= -0.5;
    if (held) return swingPlayer(world, r, dt);
    const [x, y] = ropeTip(r);
    if (p.swinging !== null || p.onGround || p.swimming || p.ropeCooldown > 0) continue;
    if (Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) > GRAB_DISTANCE) continue;
    p.swinging = i;
    r.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx / r.length));
    p.jumpBuf = 0;
    world.input.consumeJump();
    return swingPlayer(world, r, dt);
  }
  return false;
}

function swingPlayer(world: World, r: Rope, dt: number): boolean {
  const p = world.player;
  if (world.input.consumeJump()) { releaseRope(world, r); return false; }
  const [x, y] = ropeTip(r);
  const oldX = p.x, oldY = p.y;
  p.x = Math.max(world.camX, x - p.w / 2);
  p.y = y - p.h / 2;
  if (bodyBlocked(world)) {
    p.x = oldX; p.y = oldY;
    releaseRope(world, r);
    return false;
  }
  p.vx = Math.cos(r.angle) * r.length * r.speed;
  p.vy = -Math.sin(r.angle) * r.length * r.speed;
  p.onGround = false;
  p.inv = Math.max(0, p.inv - dt);
  p.throwT = Math.max(0, p.throwT - dt);
  return true;
}

function bodyBlocked(world: World): boolean {
  const p = world.player;
  for (const x of [p.x, p.x + p.w - 1]) for (const y of [p.y, p.y + p.h - 1]) {
    if (world.solid(Math.floor(x / T), Math.floor(y / T))) return true;
  }
  return false;
}
