import { GOAL_PAN_RATE, GOAL_VIEW_WIDTH, GROUND, T, VW } from './constants';
import { makeParticle } from './entities/particles';
import type { World } from './World';

/** Secuencia de meta (bandera, bonus, fuegos artificiales). Extraída de World para mantenerlo pequeño. */

const FLAG_SLIDE_SPEED = 320;
const FIREWORK_COLORS = ['#ffd23f', '#ff5e5b', '#3fb34a', '#4fc3f7', '#fff'];
const FIREWORK_SPARKS = 26;

export function reachFlag(world: World): void {
  const p = world.player;
  world.phase = 'flag';
  world.phaseT = 0;
  world.audio.play('flag');
  const bonus = Math.max(100, Math.round(((GROUND * T - (p.y + p.h)) / (9 * T)) * 50) * 100);
  world.addScore(bonus, p.x, p.y);
  p.x = world.level.flagX * T + T / 2 - p.w - 2;
  p.vx = 0;
  p.vy = 0;
  p.face = 1;
}

export function updateFlag(world: World, dt: number): void {
  panToGoal(world, dt);
  const p = world.player;
  const ground = GROUND * T;
  const flagBottom = ground - 2 * T;
  if (p.y + p.h < ground) {
    p.y = Math.min(p.y + FLAG_SLIDE_SPEED * dt, ground - p.h);
    p.anim = 'fall';
    p.frame = 0;
  } else if (world.flagY < flagBottom) {
    p.anim = 'idle';
    p.frame = 0;
  }
  if (world.flagY < flagBottom) world.flagY += FLAG_SLIDE_SPEED * dt;

  if (p.y + p.h >= ground && world.flagY >= flagBottom) {
    p.anim = 'win';
    p.frame = Math.floor(world.phaseT * 9) % 7;
    if (Math.random() < dt * 4) firework(world);
    // Bonus por el tiempo sobrante.
    if (world.timeLeft > 0 && world.phaseT > 1) {
      const n = Math.min(world.timeLeft, 3);
      world.timeLeft -= n;
      world.session.score += n * 50;
      if (Math.floor(world.phaseT * 20) % 3 === 0) world.audio.play('tick');
    }
  }
  if (world.phaseT > 6 && world.timeLeft <= 0) {
    world.phase = 'done';
    world.phaseT = 0;
  }
}

/** Durante la meta, desliza la cámara (solo hacia delante) hasta encuadrar la pirámide completa. */
export function panToGoal(world: World, dt: number): void {
  const target = Math.min(world.level.templeX * T + GOAL_VIEW_WIDTH - VW, world.width * T - VW);
  if (target > world.camX) world.camX += (target - world.camX) * Math.min(1, dt * GOAL_PAN_RATE);
}

export function firework(world: World): void {
  const x = world.camX + 200 + Math.random() * (VW - 400);
  const y = 80 + Math.random() * 180;
  const col = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  for (let i = 0; i < FIREWORK_SPARKS; i++) {
    const a = (i / FIREWORK_SPARKS) * Math.PI * 2;
    const s = 120 + Math.random() * 80;
    world.particles.push(makeParticle('spark', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, col }));
  }
  world.audio.play('firework');
}
