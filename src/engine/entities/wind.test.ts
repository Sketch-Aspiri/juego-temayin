import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../audio';
import { GROUND, STEP, START_LIVES, T } from '../constants';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { World } from '../World';

const silent = new AudioEngine();
silent.muted = true;

/** Viento horizontal en 10..20 y térmica ascendente en 30..40 (filas 0..12). */
const DEF: LevelDef = {
  id: 'prueba-viento',
  name: 'Prueba de viento',
  width: 70,
  theme: 'cliff',
  ops: [
    ['wind', 10, 20, 0, 12, 2, 0],
    ['wind', 30, 40, 0, 12, 0, -6],
    ['pit', 50, 56],
    ['water', 50, 56, 8],
    ['wind', 50, 56, 0, 13, 3, 0],
    ['flag', 65],
  ],
};

/** Tiempo para que el jugador reci�n colocado se apoye en el suelo. */
const SETTLE = 0.1;

const make = () => {
  const input = new Input();
  const world = new World({ def: DEF, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  world.enemies = [];
  return { world, input };
};

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

const putOnGround = (world: World, tx: number): void => {
  const p = world.player;
  p.x = tx * T;
  p.y = GROUND * T - p.h;
  p.vx = 0;
  p.vy = 0;
};

describe('viento', () => {
  it('traduce la op a BuiltLevel.winds', () => {
    const { world } = make();
    expect(world.level.winds).toHaveLength(3);
    expect(world.level.winds[0]).toMatchObject({ x0: 10, x1: 20, vx: 2, vy: 0 });
  });

  it('desplaza a un jugador quieto en el suelo', () => {
    const { world } = make();
    putOnGround(world, 12);
    const x0 = world.player.x;
    run(world, 0.5);
    expect(world.player.x).toBeGreaterThan(x0 + T / 2);
  });

  it('no actúa nadando', () => {
    const { world } = make();
    const p = world.player;
    p.x = 52 * T;
    p.y = 9 * T;
    p.vx = 0;
    p.vy = 0;
    run(world, 0.3);
    expect(p.swimming).toBe(true);
    expect(Math.abs(p.x - 52 * T)).toBeLessThan(2);
  });

  it('una térmica eleva el salto al menos un bloque más', () => {
    // Organizar: salto sin viento
    const base = make();
    putOnGround(base.world, 5);
    run(base.world, SETTLE); // el jugador nace en el aire: primero se apoya
    base.input.press('jump');
    let baseMin = base.world.player.y;
    for (let t = 0; t < 1.2; t += STEP) { base.world.update(STEP); baseMin = Math.min(baseMin, base.world.player.y); }
    // Actuar: salto dentro de la térmica
    const up = make();
    putOnGround(up.world, 34);
    run(up.world, SETTLE);
    up.input.press('jump');
    let upMin = up.world.player.y;
    for (let t = 0; t < 1.2; t += STEP) { up.world.update(STEP); upMin = Math.min(upMin, up.world.player.y); }
    // Comprobar
    expect(baseMin - upMin).toBeGreaterThanOrEqual(T);
  });

  it('fuera de las zonas no hay deriva', () => {
    const { world } = make();
    putOnGround(world, 25);
    const x0 = world.player.x;
    run(world, 0.5);
    expect(world.player.x).toBe(x0);
  });
});
