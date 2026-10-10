import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { arenaSurface } from './flood';
import { Kaiman, type KaimanState } from './index';
import * as K from './tuning';

const silent = new AudioEngine();
silent.muted = true;

const ARENA: readonly [number, number] = [62, 83];

function setup(): { world: World; boss: Kaiman } {
  const def = getLevel('2-7');
  if (!def) throw new Error('falta el nivel 2-7');
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
  const boss = world.boss;
  if (!(boss instanceof Kaiman)) throw new Error('el jefe de 2-7 debe ser el Kaimán');
  return { world, boss };
}

const enter = (s: KaimanState, boss: Kaiman): void => {
  boss.st = s;
  boss.t = 0;
};

/** Coloca al jugador cayendo justo sobre el lomo del jefe. */
function dropOnBack(world: World, boss: Kaiman): void {
  const p = world.player;
  p.x = boss.x + boss.w / 2 - p.w / 2;
  p.y = boss.y - p.h + 10;
  p.vy = 300;
  p.inv = 0;
}

const run = (world: World, boss: Kaiman, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) boss.update(world, STEP);
};

describe('Kaimán Moreleti', () => {
  it('despierta al entrar en la arena, la cierra y fija la cámara', () => {
    const { world, boss } = setup();
    expect(boss.lockCamera).toBe(false);
    world.player.x = (ARENA[0] + 2) * T;
    boss.update(world, STEP);
    expect(boss.intro).toBe(true);
    expect(boss.lockCamera).toBe(true);
    expect(world.tileAt(ARENA[0] - 1, 5)).toBe('X');
  });

  it('no se le puede golpear bajo el agua ni en la presentación', () => {
    const { boss } = setup();
    for (const s of ['intro', 'dive', 'submerged', 'warn', 'hurt', 'rising'] as const) {
      enter(s, boss);
      expect(boss.hittable, s).toBe(false);
    }
    enter('exposed', boss);
    expect(boss.hittable).toBe(true);
  });

  it('pisarlo solo hace daño con el lomo expuesto; si no, hiere al jugador', () => {
    const { world, boss } = setup();
    enter('walk', boss);
    world.player.shield = true;
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.KAIMAN_HP);
    expect(world.player.shield).toBe(false);

    enter('exposed', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.KAIMAN_HP - 1);
    expect(boss.st).toBe('hurt');
    expect(world.player.vy).toBeLessThan(0);
  });

  it('el fuego solo daña con las fauces abiertas', () => {
    const { world, boss } = setup();
    enter('walk', boss);
    for (let i = 0; i < 4; i++) boss.onFireball(world);
    expect(boss.hp).toBe(K.KAIMAN_HP);

    enter('gape', boss);
    expect(boss.jawsOpen).toBe(true);
    for (let i = 0; i < K.FIRE_HITS_PER_HP; i++) boss.onFireball(world);
    expect(boss.hp).toBe(K.KAIMAN_HP - 1);
  });

  it('a mitad de vida pasa a la fase 2 y el agua de la arena sube', () => {
    const { world, boss } = setup();
    const before = world.level.water;
    boss.hp = K.KAIMAN_HP / 2 + 1;
    enter('exposed', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.phase2).toBe(true);
    expect(boss.st).toBe('rising');
    expect(boss.hittable).toBe(false);

    run(world, boss, K.RISE_TIME * 0.98);
    expect(arenaSurface(world.level.water, ARENA[0], ARENA[1])).toBeCloseTo(K.PHASE2_SURFACE, 1);
    // El agua fuera de la arena no cambia y las zonas originales no se mutan.
    expect(arenaSurface(world.level.water, 16, 22)).toBe(11);
    expect(arenaSurface(before, ARENA[0], ARENA[1])).toBe(11.5);
    run(world, boss, 0.1);
    expect(boss.st).toBe('walk');
  });

  it('sumergido nada bajo el jugador, avisa y emerge hiriéndolo', () => {
    const { world, boss } = setup();
    const p = world.player;
    p.x = 68 * T;
    p.y = 12 * T - p.h;
    enter('submerged', boss);
    run(world, boss, K.SUBMERGED_TIME[0] + STEP * 2);
    expect(boss.st).toBe('warn');
    expect(Math.abs(boss.x + boss.w / 2 - (p.x + p.w / 2))).toBeLessThan(T);

    p.shield = true;
    p.inv = 0;
    run(world, boss, K.WARN_TIME[0] + 0.05);
    expect(boss.st).toBe('emerge');
    expect(p.shield).toBe(false);
  });

  it('el coletazo lanza una ola que viaja y hiere al jugador', () => {
    const { world, boss } = setup();
    const p = world.player;
    boss.x = 75 * T;
    p.x = 66 * T;
    p.y = 12 * T - p.h;
    p.shield = true;
    p.inv = 0;
    enter('tailPrep', boss);
    run(world, boss, K.TAIL_PREP_TIME[0] + STEP * 2);
    expect(boss.waves.length).toBe(1);
    run(world, boss, 1.5);
    expect(p.shield).toBe(false);
  });

  it('muere a 0 PV, abre el muro de salida y libera la cámara', () => {
    const { world, boss } = setup();
    const exit = ARENA[1] + 1;
    expect(world.tileAt(exit, 5)).toBe('X');
    boss.hp = 1;
    enter('exposed', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(0);
    expect(boss.st).toBe('dead');
    expect(boss.lockCamera).toBe(true);
    run(world, boss, K.DEAD_TIME + 0.1);
    expect(boss.st).toBe('gone');
    expect(boss.lockCamera).toBe(false);
    expect(boss.hudVisible).toBe(false);
    expect(world.tileAt(exit, 5)).toBe(' ');
  });
});
