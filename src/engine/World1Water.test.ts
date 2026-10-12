import { describe, expect, it } from 'vitest';
import { getLevel } from '../data/worlds';
import { AudioEngine } from './audio';
import { GROUND, ROWS, START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

const MAX_ESCAPE_STEPS = 12 / STEP;
const STROKE_PERIOD = Math.round(0.3 / STEP);
const STROKE_HOLD = Math.round(0.12 / STEP);

function submerged(id: string, x: number, y: number): World {
  const audio = new AudioEngine();
  audio.muted = true;
  const world = new World({
    def: getLevel(id)!, input: new Input(), audio,
    session: { score: 0, coins: 0, lives: START_LIVES },
  });
  // Aislamos la ruta de salida: colisiones, cámara, corrientes y oxígeno siguen activos.
  world.enemies = [];
  world.player.x = x * T;
  world.player.y = y * T - world.player.h;
  return world;
}

function swimRightUntil(world: World, reached: () => boolean): void {
  world.input.press('right');
  world.input.press('run');
  for (let step = 0; step < MAX_ESCAPE_STEPS && world.phase === 'play' && !reached(); step++) {
    if (step % STROKE_PERIOD === 0) world.input.press('jump');
    if (step % STROKE_PERIOD === STROKE_HOLD) world.input.release('jump');
    world.update(STEP);
  }
}

describe('salidas del agua del Mundo 1', () => {
  it.each(Array.from({ length: 22 }, (_, i) => 155.1 + i))(
    '1-4 permite recuperarse tras caer bajo la pasarela en %s', x => {
      const world = submerged('1-4', x, ROWS);
      const p = world.player;
      const recovered = () => p.onGround && !p.swimming && (p.y + p.h <= 8 * T || p.x >= 177 * T);
      swimRightUntil(world, recovered);
      expect(world.phase).toBe('play');
      expect(recovered(), `sin salida en ${p.x / T},${p.y / T}`).toBe(true);
    },
  );

  it.each([132.1, 136, 139.1, 140.1, 142.1])('1-5 permite salir del túnel desde %s por el hueco superior', x => {
    const world = submerged('1-5', x, GROUND);
    const p = world.player;
    let emergedThroughOpening = false;
    const escaped = () => {
      if (p.x >= 141 * T && p.x < 144 * T && p.y + p.h <= 6 * T) emergedThroughOpening = true;
      return p.x >= 144 * T && p.onGround && !p.swimming;
    };
    swimRightUntil(world, escaped);
    expect(world.phase).toBe('play');
    expect(escaped(), `sin salida en ${p.x / T},${p.y / T}`).toBe(true);
    expect(emergedThroughOpening).toBe(true);
    expect(p.oxygen).toBeGreaterThan(0);
  });

  it('1-5 contiene el agua con una pared y deja libre el hueco de arriba', () => {
    const world = submerged('1-5', 142.1, GROUND);
    for (let y = 6; y < ROWS; y++) expect(world.solid(144, y)).toBe(true);
    for (const x of [141, 142, 143]) {
      for (let y = 0; y < GROUND; y++) expect(world.solid(x, y)).toBe(false);
    }
    const initialY = world.player.y;
    world.input.press('right');
    for (let step = 0; step < 2 / STEP; step++) world.update(STEP);
    expect(world.phase).toBe('play');
    expect(Math.floor((world.player.x + world.player.w - 1) / T)).toBeLessThan(144);
    expect(world.player.y).toBeCloseTo(initialY);
  });
});
