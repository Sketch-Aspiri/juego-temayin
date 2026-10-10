import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import type { Op } from '../../level/types';
import { World } from '../../World';
import type { Enemy } from '../types';
import { createEnemy, ENEMIES, updateEnemies } from '.';
import { WHEEL_HOP_SPEED, WHEEL_SPEED } from './wheel';

const silent = new AudioEngine();
silent.muted = true;

/** Nivel plano con una columna (pared) en la 30 y una escalera de bajada en la 50. */
const OPS: readonly Op[] = [['col', 30, 3], ['stairs', 50, 3, -1]];

function makeWorld(): World {
  const def = { id: 't', name: 'Prueba', width: 80, theme: 'jungle' as const, ops: OPS };
  return new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
}

function spawnWheel(world: World, tx: number, ty = GROUND - 1): Enemy {
  const e = createEnemy({ id: 'wheel', tx, ty });
  e.active = true;
  world.enemies.push(e);
  return e;
}

const step = (world: World, e: Enemy, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) {
    e.t += STEP;
    ENEMIES[e.id].move(e, world, STEP);
  }
};

describe('rueda de henequén (wheel)', () => {
  it('rueda a su velocidad y rebota al tocar el suelo', () => {
    const world = makeWorld();
    const e = spawnWheel(world, 20);
    step(world, e, STEP / 2); // un solo paso: apoyada en el suelo, rebota
    expect(Math.abs(e.vx)).toBe(WHEEL_SPEED);
    expect(e.vy).toBe(-WHEEL_HOP_SPEED);
    step(world, e, 0.15);
    expect(e.y + e.h).toBeLessThan(GROUND * T - 10);
  });

  it('da la vuelta al chocar con una pared', () => {
    const world = makeWorld();
    const e = spawnWheel(world, 27);
    e.vx = WHEEL_SPEED;
    step(world, e, 2);
    expect(e.vx).toBeLessThan(0);
    expect(e.x + e.w).toBeLessThanOrEqual(30 * T);
  });

  it('baja por los escalones sin quedarse atascada', () => {
    const world = makeWorld();
    const e = spawnWheel(world, 50, GROUND - 4);
    e.vx = WHEEL_SPEED;
    step(world, e, 3);
    expect(e.x).toBeGreaterThan(53 * T);
    expect(e.y + e.h).toBeLessThanOrEqual(GROUND * T);
  });

  it('no se puede pisar: caerle encima hace daño', () => {
    const world = makeWorld();
    const e = spawnWheel(world, 20);
    const p = world.player;
    p.x = e.x + e.w / 2 - p.w / 2;
    p.y = e.y - p.h + 6;
    p.vy = 300;
    updateEnemies(world, STEP);
    expect(e.dead).toBe(0);
    expect(world.phase).toBe('dying');
  });

  it('una bola de fuego la destruye', () => {
    const world = makeWorld();
    const e = spawnWheel(world, 20);
    world.player.x = 10 * T;
    world.fireballs.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: 0, vy: 0, t: 0, gone: false });
    world.update(STEP);
    expect(e.dead).toBeGreaterThan(0);
  });
});
