import { describe, expect, it } from 'vitest';
import { STEP, T } from '../../constants';
import { makeRng } from '../../rng';
import { fireSalvo, landingSurface, type Shell, stepShells, throwCrab } from './hazards';
import { ARENA, LEFT, RIGHT, setup } from './lorencillo.fixture';
import * as K from './tuning';

describe('Lorencillo: dificultad y ventanas justas', () => {
  it.each([1, 2] as const)('la fase %i encadena sus estocadas con aviso en cada una', phase => {
    const { world, boss } = setup();
    world.player.x = LEFT + 8 * T;
    boss.x = LEFT + 11 * T;
    boss.phase = phase;
    boss.setState('advance');
    let lunges = 0, warning = 0;
    for (let t = 0; t < 8 && !boss.hittable; t += STEP) {
      const previous = boss.st;
      if (previous === 'warn') warning += STEP;
      boss.update(world, STEP);
      if (boss.st === 'lunge' && previous === 'warn') {
        expect(warning).toBeGreaterThanOrEqual(0.6);
        warning = 0;
        lunges++;
      }
    }
    expect(lunges).toBe(K.byPhase(K.LUNGES, phase));
    expect(boss.hittable).toBe(true);
  });

  it('un disparo en una ventana caducada no se suma a los de la siguiente', () => {
    const { world, boss } = setup();
    boss.setState('exposed');
    boss.onFireball(world);
    boss.t = K.EXPOSED_TIME[0];
    boss.update(world, STEP);
    boss.setState('exposed');
    boss.onFireball(world);
    expect(boss.hp).toBe(K.LORENCILLO_HP);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.LORENCILLO_HP - 1);
  });

  it('la transición anuncia la fase 2, limpia peligros y da tiempo para recolocarse', () => {
    const { world, boss } = setup();
    boss.hp = K.PHASE2_HP + 1;
    boss.setState('exposed');
    boss.onFireball(world); boss.onFireball(world);
    for (let t = 0; t <= K.HURT_TIME; t += STEP) boss.update(world, STEP);
    expect(boss.st).toBe('rally');
    expect(boss.phase).toBe(2);
    expect(boss.shells).toHaveLength(0);
    expect(boss.crabs).toHaveLength(0);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.PHASE2_HP);
    expect(boss.hittable).toBe(false);
    for (let t = STEP; t < K.RALLY_TIME - STEP; t += STEP) boss.update(world, STEP);
    expect(boss.st).toBe('rally');
    expect(boss.lean).toBe(0);
  });

  it('el sable extendido hiere dentro de su alcance y deja libre la zona superior del salto', () => {
    const { world, boss } = setup();
    boss.face = 1;
    boss.setState('lunge');
    const p = world.player;
    p.x = boss.x + boss.w + 20; p.y = boss.y + boss.h / 2;
    p.inv = 0; p.shield = true;
    boss.update(world, STEP);
    expect(p.shield).toBe(false);
    p.inv = 0; p.shield = true; p.y = boss.y - p.h - 10;
    boss.update(world, STEP);
    expect(p.shield).toBe(true);
  });

  it('los cañonazos alcanzan las cofas y su marca coincide con la colisión', () => {
    const { world } = setup();
    const tx = ARENA[0] + 5;
    world.grid[8][tx] = 'X';
    const x = (tx + 0.5) * T;
    expect(landingSurface(world, x)).toBe(8 * T);
    const shells: Shell[] = [];
    fireSalvo(shells, LEFT, x, LEFT, RIGHT, 2, makeRng(3), world);
    const mark = shells[0];
    expect(mark.impactY).toBe(8 * T);
    world.player.x = mark.x - world.player.w / 2;
    world.player.y = mark.impactY - world.player.h;
    world.player.inv = 0; world.player.shield = true;
    for (let t = 0; t < K.CANNON_WARN + K.SHELL_FLIGHT + STEP; t += STEP) stepShells(world, shells, STEP);
    expect(world.player.shield).toBe(false);
  });

  it('las salvas conservan tres marcas separadas incluso junto a ambas bordas', () => {
    for (const position of [LEFT, LEFT + T, (LEFT + RIGHT) / 2, RIGHT - T, RIGHT]) {
      for (let seed = 0; seed < 20; seed++) {
        const shells: Shell[] = [];
        fireSalvo(shells, LEFT, position, LEFT, RIGHT, 2, makeRng(seed));
        expect(shells).toHaveLength(3);
        for (let i = 0; i < shells.length; i++) for (let j = i + 1; j < shells.length; j++) {
          expect(Math.abs(shells[i].x - shells[j].x)).toBeGreaterThanOrEqual(K.SHELL_RADIUS * 2 + T);
        }
      }
    }
  });

  it('los cangrejos salen desde la altura real del mástil, con impulso visible', () => {
    const { world, boss } = setup();
    const origin = 12 * T - K.MAST_HEIGHT - T;
    throwCrab(world, boss.crabs, boss.x, -1, ARENA, origin);
    const crab = boss.crabs[0];
    expect(crab.y + crab.h).toBe(origin);
    expect(crab.onGround).toBe(false);
    expect(crab.vy).toBeLessThan(0);
  });

  it('el mástil añade una salva solo en la segunda fase', () => {
    for (const phase of [1, 2] as const) {
      const { world, boss } = setup();
      boss.phase = phase;
      boss.x = RIGHT - boss.w - T;
      world.player.x = LEFT + 2 * T;
      boss.setState('idle');
      // El selector determinista acaba ofreciendo el mástil sin alterar su reloj.
      for (let t = 0; t < 60 && boss.st !== 'mast'; t += STEP) boss.update(world, STEP);
      expect(boss.st).toBe('mast');
      expect(boss.shells.length > 0).toBe(phase === 2);
    }
  });
});
