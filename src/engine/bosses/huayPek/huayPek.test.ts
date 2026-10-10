import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { barkWaves, behindPlayerX, stepShockWaves } from './attacks';
import { fogAlpha } from './fog';
import { HuayPek, type HuayPekState } from './index';
import * as K from './tuning';

const silent = new AudioEngine();
silent.muted = true;

const ARENA: readonly [number, number] = [62, 83];

function setup(): { world: World; boss: HuayPek } {
  const def = getLevel('4-5');
  if (!def) throw new Error('falta el nivel 4-5');
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
  const boss = world.boss;
  if (!(boss instanceof HuayPek)) throw new Error('el jefe de 4-5 debe ser el Huay Pek');
  return { world, boss };
}

const enter = (s: HuayPekState, boss: HuayPek): void => {
  boss.st = s;
  boss.t = 0;
};

/** Coloca al jugador cayendo justo sobre el lomo del jefe. */
function dropOnBack(world: World, boss: HuayPek): void {
  const p = world.player;
  p.x = boss.x + boss.w / 2 - p.w / 2;
  p.y = boss.y - p.h + 10;
  p.vy = 300;
  p.inv = 0;
}

/** Jugador de pie en la columna `tx`, con escudo para detectar golpes sin morir. */
function standAt(world: World, tx: number): void {
  const p = world.player;
  p.x = tx * T;
  p.y = GROUND * T - p.h;
  p.vy = 0;
  p.inv = 0;
  p.shield = true;
}

const run = (world: World, boss: HuayPek, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) boss.update(world, STEP);
};

describe('Huay Pek', () => {
  it('despierta al entrar en la arena, la cierra y fija la cámara', () => {
    const { world, boss } = setup();
    expect(boss.lockCamera).toBe(false);
    world.player.x = (ARENA[0] + 2) * T;
    boss.update(world, STEP);
    expect(boss.intro).toBe(true);
    expect(boss.lockCamera).toBe(true);
    expect(world.tileAt(ARENA[0] - 1, 5)).toBe('X');
  });

  it('solo es golpeable con los ojos encendidos', () => {
    const { boss } = setup();
    for (const s of ['intro', 'prowl', 'growl', 'bark', 'leap', 'fade', 'hidden', 'warn', 'lunge', 'hurt', 'rising'] as const) {
      enter(s, boss);
      expect(boss.hittable, s).toBe(false);
      expect(boss.eyesLit, s).toBe(false);
    }
    enter('vulnerable', boss);
    expect(boss.eyesLit).toBe(true);
    expect(boss.hittable).toBe(true);
  });

  it('pisarlo con los ojos apagados hiere al jugador; con los ojos encendidos le quita vida', () => {
    const { world, boss } = setup();
    enter('prowl', boss);
    world.player.shield = true;
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.HUAY_PEK_HP);
    expect(world.player.shield).toBe(false);

    enter('vulnerable', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.HUAY_PEK_HP - 1);
    expect(boss.st).toBe('hurt');
    expect(world.player.vy).toBeLessThan(0);
  });

  it('el fuego solo daña con los ojos encendidos', () => {
    const { world, boss } = setup();
    for (const s of ['prowl', 'lunge', 'warn'] as const) {
      enter(s, boss);
      for (let i = 0; i < 4; i++) boss.onFireball(world);
    }
    expect(boss.hp).toBe(K.HUAY_PEK_HP);

    enter('vulnerable', boss);
    for (let i = 0; i < K.FIRE_HITS_PER_HP; i++) boss.onFireball(world);
    expect(boss.hp).toBe(K.HUAY_PEK_HP - 1);
  });

  it('a mitad de vida aúlla, la niebla cubre la arena y se acelera', () => {
    const { world, boss } = setup();
    expect(fogAlpha(boss.fog)).toBe(0);
    boss.hp = K.HUAY_PEK_HP / 2 + 1;
    enter('vulnerable', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.phase2).toBe(true);
    expect(boss.st).toBe('rising');
    expect(boss.hittable).toBe(false);

    run(world, boss, K.RISE_TIME + STEP * 2);
    expect(boss.fog).toBe(1);
    expect(fogAlpha(boss.fog)).toBeCloseTo(K.FOG_ALPHA);
    expect(boss.st).toBe('prowl');
    // En la fase 2 acecha más deprisa.
    boss.x = 76 * T;
    standAt(world, 64);
    const x0 = boss.x;
    run(world, boss, 0.2);
    expect(x0 - boss.x).toBeGreaterThan(K.PROWL_SPEED * 0.2 * 1.1);
  });

  it('la onda de choque daña al jugador en el suelo y se esquiva saltando', () => {
    const { world } = setup();
    const left = ARENA[0] * T;
    const right = (ARENA[1] + 1) * T;
    standAt(world, 66);
    let waves = barkWaves(72 * T, -1, false);
    for (let t = 0; t < 2; t += STEP) waves = stepShockWaves(world, waves, STEP, left, right);
    expect(world.player.shield).toBe(false);

    const { world: w2 } = setup();
    standAt(w2, 66);
    w2.player.y -= 3 * T; // en el aire, sobre la onda
    waves = barkWaves(72 * T, -1, false);
    for (let t = 0; t < 2; t += STEP) waves = stepShockWaves(w2, waves, STEP, left, right);
    expect(w2.player.shield).toBe(true);
    expect(waves).toHaveLength(0);
  });

  it('el ladrido suelta una onda en la fase 1 y dos en la fase 2', () => {
    expect(barkWaves(0, 1, false)).toHaveLength(1);
    expect(barkWaves(0, 1, true)).toHaveLength(2);
  });

  it('se desvanece en la niebla y reaparece a la espalda del jugador', () => {
    const { world, boss } = setup();
    standAt(world, 70);
    world.player.face = 1;
    enter('fade', boss);
    run(world, boss, K.FADE_TIME + STEP * 2);
    expect(boss.st).toBe('hidden');
    run(world, boss, K.HIDDEN_TIME[0] + STEP * 2);
    expect(boss.st).toBe('warn');
    const p = world.player;
    expect(boss.x + boss.w / 2).toBeLessThan(p.x + p.w / 2);
    expect(boss.face).toBe(1);
  });

  it('si no cabe a la espalda del jugador, reaparece delante', () => {
    const { world } = setup();
    standAt(world, ARENA[0] + 1);
    world.player.face = 1;
    const x = behindPlayerX(world, K.HUAY_PEK_W, ARENA[0] * T, (ARENA[1] + 1) * T);
    expect(x).toBeGreaterThan(world.player.x);
  });

  it('tras la embestida choca y se le encienden los ojos', () => {
    const { world, boss } = setup();
    standAt(world, 66);
    boss.x = 74 * T;
    boss.face = 1;
    enter('lunge', boss);
    run(world, boss, K.LUNGE_MAX_TIME);
    expect(boss.st).toBe('vulnerable');
  });

  it('recorre todos sus ataques y siempre deja una ventana con los ojos encendidos', () => {
    const { world, boss } = setup();
    standAt(world, 66);
    world.player.inv = 999; // el jugador no recibe daño durante la simulación
    boss.update(world, STEP); // despierta y cierra la arena
    enter('prowl', boss);
    const seen = new Set<HuayPekState>();
    for (let t = 0; t < 30; t += STEP) {
      boss.update(world, STEP);
      seen.add(boss.st);
      expect(boss.x).toBeGreaterThanOrEqual(boss.left);
      expect(boss.x + boss.w).toBeLessThanOrEqual(boss.right);
    }
    for (const s of ['growl', 'bark', 'crouch', 'leap', 'fade', 'hidden', 'warn', 'lunge', 'vulnerable'] as const) {
      expect(seen.has(s), s).toBe(true);
    }
  });

  it('muere a 0 PV, abre el muro de salida y libera la cámara', () => {
    const { world, boss } = setup();
    const exit = ARENA[1] + 1;
    expect(world.tileAt(exit, 5)).toBe('X');
    boss.hp = 1;
    enter('vulnerable', boss);
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
