import { describe, expect, it } from 'vitest';
import { LEVEL_5_1 } from '../data/levels/world5/5-1-cancun';
import { AudioEngine } from './audio';
import { START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

const MAX_CROSSING_STEPS = Math.ceil(15 / STEP);
const MAX_FALL_STEPS = Math.ceil(3 / STEP);
const LAUNCH_DELAYS = Array.from({ length: 24 }, (_, step) => step);
const CROSSINGS = [
  { name: 'tren', start: 63, floor: 10, end: 89, platform: 0, destination: 78 },
  { name: 'plataforma móvil', start: 117, floor: 9, end: 131, platform: 1, destination: 124 },
] as const;

function make(start: number, floor: number): World {
  const audio = new AudioEngine();
  audio.muted = true;
  const world = new World({
    def: LEVEL_5_1, input: new Input(), audio,
    session: { score: 0, coins: 0, lives: START_LIVES },
  });
  // Aislamos los cruces: siguen activas la gravedad, las plataformas y la cámara.
  world.enemies = [];
  world.player.x = start * T + 1;
  world.player.y = floor * T - world.player.h;
  world.player.onGround = true;
  world.camX = world.player.x - 300;
  return world;
}

describe('fosos secos de Cancún', () => {
  it.each([76, 124])('caer debajo del transporte en %s mata en lugar de permitir nadar', start => {
    const world = make(start, 13);
    world.player.onGround = false;
    for (let step = 0; step < MAX_FALL_STEPS && world.phase === 'play'; step++) world.update(STEP);
    expect(world.phase).toBe('dying');
    expect(world.player.swimming).toBe(false);
    expect(world.hudState(0).oxygen).toBeNull();
  });

  it.each(CROSSINGS)('no se cruza el foso del $name con un salto en carrera sin transporte', crossing => {
    for (const delay of LAUNCH_DELAYS) {
      const world = make(crossing.start, crossing.floor);
      world.platforms = [];
      world.player.vx = 400;
      world.input.press('right');
      world.input.press('run');
      for (let step = 0; step < MAX_FALL_STEPS && world.phase === 'play'; step++) {
        if (step === delay) world.input.press('jump');
        world.update(STEP);
      }
      expect(world.player.x, `salto tras ${delay} pasos`).toBeLessThan(crossing.end * T);
      expect(world.phase, `salto tras ${delay} pasos`).toBe('dying');
    }
  });

  it.each(CROSSINGS)('permite subir al $name, viajar y saltar al muelle de salida', crossing => {
    const world = make(crossing.start, crossing.floor);
    const platform = world.platforms[crossing.platform];
    let boarded = false;
    let exiting = false;
    world.input.press('right');
    world.input.press('jump');
    for (let step = 0; step < MAX_CROSSING_STEPS && world.player.x < crossing.end * T && world.phase === 'play'; step++) {
      if (!boarded && platform.rider) { boarded = true; world.input.reset(); }
      if (boarded && !exiting && platform.x >= crossing.destination * T - 1) {
        exiting = true;
        world.input.press('right');
        world.input.press('run');
        world.input.press('jump');
      }
      world.update(STEP);
    }
    expect(boarded).toBe(true);
    expect(world.phase).toBe('play');
    expect(world.player.x).toBeGreaterThanOrEqual(crossing.end * T);
    expect(world.player.swimming).toBe(false);
    expect(world.session.lives).toBe(START_LIVES);
  });
});
