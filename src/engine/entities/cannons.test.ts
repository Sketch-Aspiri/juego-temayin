import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, START_LIVES, STEP, T } from '../constants';
import { Input } from '../input';
import { buildLevel } from '../level/build';
import type { LevelDef, Op } from '../level/types';
import { World } from '../World';
import {
  CANNON_FIRST_DELAY,
  CANNON_RELOAD_TIME,
  CANNON_WARN_TIME,
  CANNONBALL_RADIUS,
  CANNONBALL_SPEED,
} from './cannons';

const level = (ops: readonly Op[]): LevelDef => ({
  id: 'prueba-cañones',
  name: 'Prueba',
  width: 60,
  theme: 'fortress',
  ops: [...ops, ['flag', 50], ['temple', 51]],
});

function makeWorld(ops: readonly Op[]): World {
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({ def: level(ops), input: new Input(), audio, session: { score: 0, coins: 0, lives: START_LIVES } });
}

function run(world: World, seconds: number): void {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
}

describe('cañones de baluarte', () => {
  it('se registran con su dirección al construir el nivel', () => {
    const built = buildLevel(level([['cannon', 20, 9, -1], ['cannon', 30, 6, 1]]));
    expect(built.cannons).toEqual([
      { x: 20, y: 9, dir: -1 },
      { x: 30, y: 6, dir: 1 },
    ]);
    // Los dos bloques siguen siendo sólidos: el cañón se pisa como plataforma.
    expect(built.grid[9][20]).toBe('<');
    expect(built.grid[6][31]).toBe('>');
  });

  it('avisa con la mecha antes de disparar y la bala sale por la boca', () => {
    const world = makeWorld([['cannon', 20, 9, -1]]);
    const cannon = world.cannons[0];

    run(world, CANNON_FIRST_DELAY - 0.05);
    expect(cannon.state).toBe('idle');
    run(world, 0.1);
    expect(cannon.state).toBe('warn');
    expect(world.cannonballs).toHaveLength(0);

    run(world, CANNON_WARN_TIME);
    expect(world.cannonballs).toHaveLength(1);
    const ball = world.cannonballs[0];
    expect(ball.vx).toBe(-CANNONBALL_SPEED);
    expect(ball.x).toBeLessThan(20 * T);
    expect(ball.y).toBe(9.5 * T);
    expect(cannon.state).toBe('idle');
    expect(cannon.timer).toBeGreaterThan(CANNON_RELOAD_TIME - 0.1);
  });

  it('no dispara mientras su boca está fuera de la pantalla', () => {
    const world = makeWorld([['cannon', 40, 9, -1]]);
    run(world, CANNON_FIRST_DELAY + CANNON_WARN_TIME + CANNON_RELOAD_TIME);
    expect(world.cannons[0].state).toBe('idle');
    expect(world.cannonballs).toHaveLength(0);
  });

  it('la bala revienta al chocar con un bloque', () => {
    const world = makeWorld([['cannon', 20, 9, -1], ['row', 15, 9, 'X']]);
    run(world, CANNON_FIRST_DELAY + CANNON_WARN_TIME + 0.05);
    expect(world.cannonballs).toHaveLength(1);
    const flight = (5 * T) / CANNONBALL_SPEED;
    run(world, flight);
    expect(world.cannonballs).toHaveLength(0);
    expect(world.particles.length).toBeGreaterThan(0);
  });

  it('hiere al jugador que la recibe de lado', () => {
    const world = makeWorld([['cannon', 12, GROUND - 1, -1]]);
    world.player.shield = true;
    run(world, CANNON_FIRST_DELAY + CANNON_WARN_TIME + (10 * T) / CANNONBALL_SPEED);
    expect(world.player.shield).toBe(false);
    expect(world.phase).toBe('play');
    expect(world.cannonballs).toHaveLength(0);
  });

  it('pisarla la destruye y hace rebotar al jugador sin daño', () => {
    const world = makeWorld([]);
    const p = world.player;
    p.shield = true;
    const ballY = 8 * T;
    world.cannonballs.push({ x: p.x + p.w / 2, y: ballY, vx: 0, t: 0, gone: false });
    p.y = ballY - CANNONBALL_RADIUS - p.h - 2;
    p.vy = 300;
    const score = world.session.score;

    for (let i = 0; i < 20 && world.cannonballs.length > 0; i++) world.update(STEP);

    expect(world.cannonballs).toHaveLength(0);
    expect(p.vy).toBeLessThan(0);
    expect(p.shield).toBe(true);
    expect(world.phase).toBe('play');
    expect(world.session.score).toBeGreaterThan(score);
  });
});
