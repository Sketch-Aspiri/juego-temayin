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

  it.each([132.1, 136, 139.1, 140.1])('1-5 permite salir del túnel desde %s hacia la escalera', x => {
    const world = submerged('1-5', x, GROUND);
    const p = world.player;
    const escaped = () => p.x >= 145 * T && p.onGround && !p.swimming;
    swimRightUntil(world, escaped);
    expect(world.phase).toBe('play');
    expect(escaped(), `sin salida en ${p.x / T},${p.y / T}`).toBe(true);
    expect(p.oxygen).toBeGreaterThan(0);
  });
});
