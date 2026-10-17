import { beforeEach, describe, expect, it } from 'vitest';
import { STEP, T } from '../../constants';
import { makeRng } from '../../rng';
import { type Crab, clearCrabs, fireSalvo, type Shell, shellHarmful, stepShells, throwCrab } from './hazards';
import { ARENA, LEFT, RIGHT, setup } from './lorencillo.fixture';
import { CANNON_WARN, MAX_CRABS, SHELL_FLIGHT, SHELL_RADIUS } from './tuning';

const MIN_WARNING = 0.6;
let shells: Shell[];
let crabs: Crab[];
beforeEach(() => { shells = []; crabs = []; });

describe('Cañonazos', () => {
  it('cada salva marca la caída y avisa al menos 0,6 s antes de poder herir', () => {
    // Organizar
    const { world } = setup();
    fireSalvo(shells, 3000, world.player.x, LEFT, RIGHT, 1, makeRng(5));
    const mark = shells[0].x;
    world.player.x = mark - world.player.w / 2;
    world.player.y = 12 * T - world.player.h;
    world.player.inv = 0;
    world.player.shield = true;
    // Actuar
    let t = 0;
    while (world.player.shield && t < 5) { stepShells(world, shells, STEP); t += STEP; }
    // Comprobar
    expect(world.player.shield).toBe(false);
    expect(t).toBeGreaterThanOrEqual(MIN_WARNING);
    expect(t).toBeGreaterThanOrEqual(CANNON_WARN + SHELL_FLIGHT - STEP * 2);
  });

  it('las balas no son dañinas durante el aviso y las marcas quedan dentro de la arena', () => {
    const { world } = setup();
    fireSalvo(shells, 3000, world.player.x, LEFT, RIGHT, 2, makeRng(9));
    expect(shells.length).toBe(3);
    for (const s of shells) {
      expect(shellHarmful(s)).toBe(false);
      expect(s.x).toBeGreaterThanOrEqual(LEFT + SHELL_RADIUS);
      expect(s.x).toBeLessThanOrEqual(RIGHT - SHELL_RADIUS);
    }
  });

  it('se retiran tras explotar', () => {
    const { world } = setup();
    fireSalvo(shells, 3000, world.player.x, LEFT, RIGHT, 1, makeRng(1));
    for (let t = 0; t < 6; t += STEP) stepShells(world, shells, STEP);
    expect(shells).toHaveLength(0);
  });
});

describe('Piratas cangrejo del mástil', () => {
  it('nace dentro de la arena aunque el jefe esté pegado a un borde', () => {
    // Organizar
    const { world } = setup();
    const minTx = ARENA[0] + 1;
    const maxTx = ARENA[1] - 1;
    const cases: ReadonlyArray<readonly [number, 1 | -1]> = [
      [LEFT, -1], [LEFT, 1], [RIGHT - T, 1], [RIGHT - T, -1],
    ];
    for (const [fromX, side] of cases) {
      // Actuar
      const list: Crab[] = [];
      throwCrab(world, list, fromX, side, ARENA);
      // Comprobar
      const tx = Math.floor(list[0].x / T);
      expect(tx).toBeGreaterThanOrEqual(minTx);
      expect(tx).toBeLessThanOrEqual(maxTx);
    }
  });

  it('nunca hay más de dos vivos', () => {
    const { world } = setup();
    const thrown = [1, 2, 3, 4, 5].map((i) => throwCrab(world, crabs, LEFT + i * T, 1, ARENA));
    expect(thrown.filter(Boolean)).toHaveLength(MAX_CRABS);
    expect(world.enemies.filter((e) => e.id === 'pirateCrab' && e.alive)).toHaveLength(MAX_CRABS);
  });

  it('permite lanzar otro cuando uno cae y los retira todos al limpiar', () => {
    const { world } = setup();
    throwCrab(world, crabs, LEFT + T, 1, ARENA);
    throwCrab(world, crabs, LEFT + 3 * T, 1, ARENA);
    world.killEnemy(crabs[0], false);
    expect(throwCrab(world, crabs, LEFT + 5 * T, 1, ARENA)).toBe(true);
    clearCrabs(crabs);
    expect(world.enemies.filter((e) => e.id === 'pirateCrab' && e.alive && e.dead === 0)).toHaveLength(0);
    expect(crabs).toHaveLength(0);
  });
});
