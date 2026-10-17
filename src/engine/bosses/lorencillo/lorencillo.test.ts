import { describe, expect, it } from 'vitest';
import { STEP, T } from '../../constants';
import type { World } from '../../World';
import { LEFT, RIGHT, setup } from './lorencillo.fixture';
import { ARENA } from './lorencillo.fixture';
import { type LorenState, type Lorencillo } from './index';
import * as K from './tuning';

const MIN_WARNING = 0.6;

const enter = (boss: Lorencillo, st: LorenState): void => { boss.st = st; boss.t = 0; };
const run = (world: World, boss: Lorencillo, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) boss.update(world, STEP);
};

/** Avanza hasta que se cumpla `done` y devuelve los segundos transcurridos. */
function until(world: World, boss: Lorencillo, done: () => boolean, max = 10): number {
  let t = 0;
  while (!done() && t < max) { boss.update(world, STEP); t += STEP; }
  expect(done()).toBe(true);
  return t;
}

/** Coloca al jugador cayendo justo sobre la espalda del jefe, con escudo. */
function dropOnBack(world: World, boss: Lorencillo): void {
  const p = world.player;
  p.x = boss.x + boss.w / 2 - p.w / 2;
  p.y = boss.y - p.h + 10;
  p.vy = 300;
  p.inv = 0;
  p.shield = true;
}

/** Deja al jefe expuesto y le quita un PV con dos bolas de fuego. */
function hitOnce(world: World, boss: Lorencillo): void {
  enter(boss, 'exposed');
  boss.onFireball(world);
  boss.onFireball(world);
}

describe('Lorencillo', () => {
  it('despierta al entrar en la arena, cierra la entrada y fija la cámara', () => {
    const { world, boss } = setup();
    expect(boss.lockCamera).toBe(false);
    world.player.x = (ARENA[0] + 2) * T;
    boss.update(world, STEP);
    expect(boss.intro).toBe(true);
    expect(boss.lockCamera).toBe(true);
    expect(world.solid(ARENA[0] - 1, 5)).toBe(true);
  });

  it('solo se le puede golpear con la espalda expuesta', () => {
    const { boss } = setup();
    const states: readonly LorenState[] = [
      'sleep', 'intro', 'idle', 'advance', 'warn', 'lunge', 'cannon', 'mast', 'hurt', 'dead', 'gone',
    ];
    for (const s of states) {
      enter(boss, s);
      expect(boss.hittable, s).toBe(false);
    }
    enter(boss, 'exposed');
    expect(boss.hittable).toBe(true);
  });

  it('la estocada avisa al menos 0,6 s y termina con la espalda expuesta', () => {
    const { world, boss } = setup();
    boss.x = LEFT + 8 * T;
    world.player.x = boss.x - 100;
    enter(boss, 'advance');
    until(world, boss, () => boss.st === 'warn');
    expect(until(world, boss, () => boss.st === 'lunge')).toBeGreaterThanOrEqual(MIN_WARNING);
    until(world, boss, () => boss.st !== 'lunge');
    expect(boss.st).toBe('exposed');
    expect(boss.x).toBeGreaterThanOrEqual(LEFT);
    expect(boss.x + boss.w).toBeLessThanOrEqual(RIGHT);
  });

  it('la estocada hiere al jugador; el resto de estados de ataque no', () => {
    const { world, boss } = setup();
    boss.x = LEFT + 8 * T;
    for (const [st, harmful] of [['lunge', true], ['advance', false], ['warn', false], ['exposed', false]] as const) {
      enter(boss, st);
      const p = world.player;
      p.x = boss.x + 10; p.y = boss.y + 40; p.vy = 0; p.inv = 0; p.shield = true;
      boss.update(world, STEP);
      expect(p.shield, st).toBe(!harmful);
    }
  });

  it('pisarlo expuesto quita un PV y rebota; en plena estocada hiere al jugador', () => {
    const { world, boss } = setup();
    enter(boss, 'lunge');
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.LORENCILLO_HP);
    expect(world.player.shield).toBe(false);

    enter(boss, 'exposed');
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.LORENCILLO_HP - 1);
    expect(boss.st).toBe('hurt');
    expect(world.player.vy).toBeLessThan(0);
    expect(world.player.shield).toBe(true);
  });

  it('el fuego fuera de la ventana no daña; dos bolas quitan un PV y solo uno por ventana', () => {
    const { world, boss } = setup();
    enter(boss, 'lunge');
    boss.onFireball(world);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.LORENCILLO_HP);

    enter(boss, 'exposed');
    boss.onFireball(world);
    expect(boss.hp).toBe(K.LORENCILLO_HP);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.LORENCILLO_HP - 1);
    boss.onFireball(world);
    boss.onFireball(world);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.LORENCILLO_HP - 1);
  });

  it('a 4 PV empieza la fase 2 (barco inclinado)', () => {
    const { world, boss } = setup();
    expect(boss.stage).toBe(1);
    boss.hp = K.PHASE2_HP + 1;
    hitOnce(world, boss);
    expect(boss.hp).toBe(K.PHASE2_HP);
    until(world, boss, () => boss.st === 'idle');
    expect(boss.stage).toBe(2);
    expect(world.popups.some((p) => p.txt === '¡EL BARCO SE INCLINA!')).toBe(true);
  });

  it('en la fase 2 la cubierta avisa y arrastra al jugador apoyado', () => {
    const { world, boss } = setup();
    boss.phase = 2;
    enter(boss, 'idle');
    boss.t = -100; // sin atacar mientras se observa la cubierta
    world.player.onGround = true;
    until(world, boss, () => boss.tilt.phase === 'warn');
    until(world, boss, () => boss.tilt.phase === 'active');
    expect(Math.abs(boss.tilt.dir)).toBe(1);
    expect(boss.lean).toBe(boss.tilt.dir);
  });

  it('en la fase 1 la cubierta permanece plana', () => {
    const { world, boss } = setup();
    enter(boss, 'idle');
    boss.t = -100;
    run(world, boss, 10);
    expect(boss.tilt.phase).toBe('rest');
  });

  it('desde el mástil lanza cangrejos (máx. 2) y los retira al morir', () => {
    const { world, boss } = setup();
    boss.x = LEFT + 8 * T;
    enter(boss, 'mast');
    run(world, boss, K.MAST_TIME[0] + 0.5);
    run(world, boss, 0);
    const alive = (): number => world.enemies.filter((e) => e.id === 'pirateCrab' && e.alive && e.dead === 0).length;
    expect(alive()).toBeGreaterThan(0);
    expect(alive()).toBeLessThanOrEqual(K.MAX_CRABS);
    boss.hp = 1;
    hitOnce(world, boss);
    expect(alive()).toBe(0);
  });

  it('al morir abre el muro de salida y libera la cámara', () => {
    const { world, boss } = setup();
    boss.hp = 1;
    hitOnce(world, boss);
    expect(boss.st).toBe('dead');
    run(world, boss, K.DEAD_TIME + 0.1);
    expect(boss.st).toBe('gone');
    expect(world.solid(ARENA[1] + 1, 0)).toBe(false);
    expect(boss.lockCamera).toBe(false);
    expect(world.session.coins).toBeGreaterThan(0);
  });

  it('juega solo: encadena ataques sin quedarse atascado', () => {
    const { world, boss } = setup();
    world.player.x = (ARENA[0] + 3) * T;
    const seen = new Set<LorenState>();
    for (let t = 0; t < 60; t += STEP) {
      world.player.inv = 1000;
      boss.update(world, STEP);
      seen.add(boss.st);
    }
    for (const s of ['idle', 'warn', 'lunge', 'exposed'] as const) expect(seen.has(s), s).toBe(true);
  });
});
