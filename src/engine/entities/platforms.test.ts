import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { buildLevel } from '../level/build';
import type { Op } from '../level/types';
import { World } from '../World';
import {
  CAR_TILES,
  createPlatform,
  moverProgress,
  platformReach,
  TRAIN_STOP_TIME,
  trainProgress,
  type MovingPlatform,
} from './platforms';

const silent = new AudioEngine();
silent.muted = true;

/** Tren de 1 vagón con el techo en la fila 8 sobre un hoyo, que avanza 6 bloques a 2 bloques/s. */
const TRAIN_OPS: readonly Op[] = [['pit', 10, 30], ['train', 10, 8, 1, 2, 6]];

function makeWorld(ops: readonly Op[] = TRAIN_OPS): World {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'jungle' as const, ops };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

function run(world: World, seconds: number): void {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
}

/** Coloca al jugador de pie sobre el centro de la plataforma. */
function standOn(world: World, m: MovingPlatform): void {
  const p = world.player;
  p.x = m.x + m.w / 2 - p.w / 2;
  p.y = m.y - p.h;
  p.vx = 0;
  p.vy = 0;
}

describe('DSL de plataformas móviles', () => {
  it('buildLevel traduce train y mover a BuiltLevel.platforms', () => {
    const lvl = buildLevel({
      id: 't', name: 'Prueba', width: 40, theme: 'jungle',
      ops: [['train', 5, 10, 2, 3, 8], ['mover', 20, 9, 3, 4, -2, 5]],
    });
    expect(lvl.platforms).toEqual([
      { kind: 'train', x: 5, y: 10, cars: 2, speed: 3, range: 8 },
      { kind: 'mover', x: 20, y: 9, length: 3, dx: 4, dy: -2, period: 5 },
    ]);
  });

  it('el alcance cubre el largo de la plataforma más su recorrido', () => {
    expect(platformReach({ kind: 'train', x: 10, y: 8, cars: 2, speed: 2, range: 6 })).toEqual({ x0: 10, x1: 10 + 2 * CAR_TILES - 1 + 6 });
    expect(platformReach({ kind: 'mover', x: 20, y: 8, length: 3, dx: -4, dy: 0, period: 4 })).toEqual({ x0: 16, x1: 22 });
  });
});

describe('movimiento', () => {
  it('el tren espera en la estación, recorre y vuelve', () => {
    expect(trainProgress(0, 6, 2)).toBe(0);
    expect(trainProgress(TRAIN_STOP_TIME + 1.5, 6, 2)).toBeCloseTo(0.5);
    expect(trainProgress(TRAIN_STOP_TIME + 3 + 0.5, 6, 2)).toBe(1);
    expect(trainProgress(2 * TRAIN_STOP_TIME + 3 + 1.5, 6, 2)).toBeCloseTo(0.5);
  });

  it('la plataforma genérica oscila entre su origen y el destino', () => {
    expect(moverProgress(0, 4)).toBeCloseTo(0);
    expect(moverProgress(2, 4)).toBeCloseTo(1);
    expect(moverProgress(4, 4)).toBeCloseTo(0);
  });

  it('una plataforma lejos de la cámara no se mueve hasta acercarse', () => {
    const world = makeWorld([['mover', 70, 8, 3, 0, 3, 2]]);
    run(world, 1);
    expect(world.platforms[0].y).toBe(8 * T);
    expect(createPlatform({ kind: 'mover', x: 70, y: 8, length: 3, dx: 0, dy: 3, period: 2 }).w).toBe(3 * T);
  });
});

describe('jugador sobre plataformas móviles', () => {
  it('el jugador sobre un vagón se desplaza con él', () => {
    const world = makeWorld();
    const m = world.platforms[0];
    standOn(world, m);
    const offset = world.player.x - m.x;
    run(world, TRAIN_STOP_TIME + 2);
    expect(m.x).toBeGreaterThan(10 * T + T);
    expect(world.player.x - m.x).toBeCloseTo(offset, 0);
    expect(world.player.y + world.player.h).toBeCloseTo(m.y, 0);
    expect(world.phase).toBe('play');
  });

  it('cayendo desde arriba no atraviesa el vagón', () => {
    const world = makeWorld();
    const m = world.platforms[0];
    standOn(world, m);
    world.player.y -= 3 * T;
    world.player.vy = 900;
    run(world, 0.6);
    expect(world.player.onGround).toBe(true);
    expect(world.player.y + world.player.h).toBeCloseTo(m.y, 0);
  });

  it('desde abajo se atraviesa (plataforma de un solo sentido)', () => {
    const world = makeWorld([['mover', 10, 8, 4, 0, 0, 1]]);
    const m = world.platforms[0];
    const p = world.player;
    p.x = m.x + T;
    p.y = m.y + m.h + 2;
    p.vy = -900;
    world.input.held.jump = true; // sin soltar el salto, para que no se recorte
    run(world, 0.25);
    expect(p.y + p.h).toBeLessThan(m.y);
  });

  it('una plataforma que sube recoge al jugador y lo lleva hacia arriba', () => {
    const world = makeWorld([['pit', 10, 30], ['mover', 10, 10, 4, 0, -4, 4]]);
    const m = world.platforms[0];
    standOn(world, m);
    run(world, 2);
    expect(m.y).toBeCloseTo(6 * T, 0);
    expect(world.player.y + world.player.h).toBeCloseTo(m.y, 0);
  });

  it('al saltar se separa de la plataforma', () => {
    const world = makeWorld();
    const m = world.platforms[0];
    standOn(world, m);
    run(world, 0.1);
    world.input.press('jump');
    run(world, 0.2);
    expect(world.player.y + world.player.h).toBeLessThan(m.y - T);
  });
});
