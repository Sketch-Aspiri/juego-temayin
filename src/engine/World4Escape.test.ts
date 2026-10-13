import { describe, expect, it } from 'vitest';
import { LEVEL_4_2 } from '../data/levels/world4/4-2-xibalba';
import { AudioEngine } from './audio';
import { GROUND, START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

const MAX_ESCAPE_STEPS = Math.ceil(6 / STEP);
const STEP_ROW = 10;
const STARTS = [166.05, 166.5, 167.2, 168.1];
const DIRECTIONS = ['left', 'right'] as const;

function trapped(start: number): World {
  const audio = new AudioEngine();
  audio.muted = true;
  const world = new World({
    def: LEVEL_4_2, audio, input: new Input(),
    session: { score: 0, coins: 0, lives: START_LIVES },
  });
  // Aislamos la salida del hueco; gravedad, techo, colisiones y cámara siguen activos.
  world.enemies = [];
  world.player.x = start * T;
  world.player.y = GROUND * T - world.player.h;
  world.player.onGround = true;
  world.camX = world.player.x - 200;
  return world;
}

describe.each(DIRECTIONS)('salida del hueco de Xibalbá hacia %s', direction => {
  it.each(STARTS)('permite salir desde la columna %s sin correr', start => {
    const world = trapped(start);
    const p = world.player;
    const escaped = () => direction === 'right' ? p.x >= 171 * T : p.x + p.w <= 165 * T;
    world.input.press(direction);
    for (let step = 0; step < MAX_ESCAPE_STEPS && !escaped(); step++) {
      // Se avanza sobre el peldaño antes del segundo salto para dejar atrás el techo.
      const underRoof = p.y + p.h === STEP_ROW * T &&
        (direction === 'right' ? p.x < 169 * T : p.x + p.w > 166 * T);
      if (p.onGround && !underRoof && !world.input.held.jump) world.input.press('jump');
      if (p.vy > 0) world.input.release('jump');
      world.update(STEP);
    }
    expect(world.phase).toBe('play');
    expect(escaped()).toBe(true);
    expect(p.y + p.h).toBeLessThanOrEqual(8 * T);
    expect(world.session.lives).toBe(START_LIVES);
  });
});
