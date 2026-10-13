import { describe, expect, it } from 'vitest';
import { LEVEL_5_2 } from '../data/levels/world5/5-2-puerto-morelos';
import { AudioEngine } from './audio';
import { START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

const MAX_STEPS = Math.ceil(6 / STEP);
const BLOCKS = [
  { x: 99, y: 6, floor: 11, kind: 'shield' },
  { x: 100, y: 4, floor: 9, kind: 'snorkel' },
  { x: 101, y: 2, floor: 7, kind: 'fire' },
] as const;

function make(): World {
  const audio = new AudioEngine();
  audio.muted = true;
  const world = new World({
    def: LEVEL_5_2, input: new Input(), audio, fromCheckpoint: true,
    session: { score: 0, coins: 0, lives: START_LIVES },
  });
  // Aislamos los bloques: las colisiones, la gravedad y la cámara siguen activas.
  world.enemies = [];
  return world;
}

function climb(world: World): void {
  world.input.press('right');
  for (let step = 0; step < MAX_STEPS && world.player.x < 103 * T; step++) {
    if (world.player.onGround && !world.input.held.jump) world.input.press('jump');
    if (world.player.vy > 0) world.input.release('jump');
    world.update(STEP);
  }
  world.input.reset();
}

/** Se acerca al premio con aceleración real y, si hace falta, un único salto. */
function moveTo(world: World, target: number, jump = false): void {
  const p = world.player, input = world.input;
  input.reset();
  let launched = false;
  for (let step = 0; step < MAX_STEPS && world.phase === 'play'; step++) {
    const dx = target * T - p.x;
    const speed = Math.max(-180, Math.min(180, dx * 4));
    input.release('left'); input.release('right');
    if (p.vx < speed - 10) input.press('right');
    if (p.vx > speed + 10) input.press('left');
    if (jump && p.onGround && !launched) { input.press('jump'); launched = true; }
    if (p.vy > 0) input.release('jump');
    world.update(STEP);
    if (Math.abs(dx) < 5 && Math.abs(p.vx) < 20 && p.onGround) break;
  }
  input.reset();
}

describe('bloques del checkpoint de Puerto Morelos', () => {
  it.each(BLOCKS)('se golpea el bloque de $kind desde su peldaño sin correr', block => {
    const world = make();
    world.player.x = block.x * T + 2;
    world.player.y = block.floor * T - world.player.h;
    world.player.onGround = true;
    world.input.press('jump');
    for (let step = 0; step < MAX_STEPS && world.tileAt(block.x, block.y) !== 'U'; step++) world.update(STEP);
    expect(world.phase).toBe('play');
    expect(world.tileAt(block.x, block.y)).toBe('U');
    expect(world.items.some(item => item.kind === block.kind)).toBe(true);
  });

  it('sube desde Toh y activa los tres bloques sin quedarse atrapado bajo el primero', () => {
    const world = make();
    climb(world);
    expect(world.phase).toBe('play');
    expect(world.player.x).toBeGreaterThanOrEqual(103 * T);
    for (const block of BLOCKS) expect(world.tileAt(block.x, block.y)).toBe('U');
  });

  it('recoge el chile y el snorkel saltando y regresando por encima de los bloques', () => {
    const world = make();
    climb(world);
    moveTo(world, 102.05);
    moveTo(world, 101.05, true);
    expect(world.player.fire).toBe(true);
    moveTo(world, 99.8);
    expect(world.player.snorkel).toBeGreaterThan(0);
    expect(world.phase).toBe('play');
    expect(world.session.lives).toBe(START_LIVES);
  });
});
