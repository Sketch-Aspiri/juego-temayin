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

  it('al bajar a PHASE2_HP pasa a la fase 2, el agua sube y aparecen troncos a la deriva', () => {
    const { world, boss } = setup();
    const before = world.level.water;
    const platforms = world.platforms.length;
    boss.hp = K.PHASE2_HP + 1;
    enter('exposed', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.phase2).toBe(true);
    expect(boss.phase).toBe(2);
    expect(boss.st).toBe('rising');
    expect(world.platforms.length).toBe(platforms + K.DRIFT_LOGS.length);
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

  it('al bajar a PHASE3_HP entra en frenesí: ruge sin recibir daño y luego sigue', () => {
    const { world, boss } = setup();
    boss.phase = 2;
    boss.hp = K.PHASE3_HP + 1;
    enter('exposed', boss);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.phase).toBe(3);
    expect(boss.st).toBe('enrage');
    expect(boss.hittable).toBe(false);
    run(world, boss, K.ENRAGE_TIME + 0.05);
    expect(boss.st).toBe('walk');
  });

  it('en la fase 3 el coletazo lanza tres olas (dos hacia delante), también junto al muro', () => {
    const { world, boss } = setup();
    boss.phase = 3;
    boss.x = 76 * T;
    world.player.x = 64 * T;
    enter('tailPrep', boss);
    run(world, boss, K.TAIL_PREP_TIME[2] + STEP * 2);
    expect(boss.waves.length).toBe(3);
    expect(boss.waves.filter((w) => w.dir === boss.face).length).toBe(2);
    // La ola trasera sale de la arena; la segunda delantera ya viaja tras la primera.
    run(world, boss, 0.6);
    const front = boss.waves.filter((w) => w.dir === boss.face && !(w.wait && w.wait > 0));
    expect(front.length).toBe(2);
    expect(Math.abs(front[0].x - front[1].x)).toBeGreaterThan(K.WAVE_GAP * 0.8);
  });

  it('en la fase 3 emerge dos veces antes de quedar expuesto', () => {
    const { world, boss } = setup();
    const p = world.player;
    p.x = 66 * T;
    p.y = 4 * T; // en el aire, lejos del hocico
    boss.phase = 3;
    // Fuerza la emboscada: lleva demasiados ataques sin sumergirse.
    boss.lastAttack = 'bite';
    (boss as unknown as { sinceDive: number }).sinceDive = K.MAX_ATTACKS_WITHOUT_DIVE;
    enter('walk', boss);
    const seen: KaimanState[] = [];
    for (let t = 0; t < 12 && boss.st !== 'exposed'; t += STEP) {
      p.inv = 10;
      boss.update(world, STEP);
      if (seen[seen.length - 1] !== boss.st) seen.push(boss.st);
    }
    expect(seen.filter((s) => s === 'emerge').length).toBe(2);
    expect(boss.st).toBe('exposed');
  });

  it('el escupitajo abre las fauces (el fuego daña) y lanza bolas de lodo que hieren', () => {
    const { world, boss } = setup();
    const p = world.player;
    boss.x = 76 * T;
    p.x = 66 * T;
    p.y = 12 * T - p.h;
    p.shield = true;
    p.inv = 0;
    enter('spitPrep', boss);
    expect(boss.jawsOpen).toBe(true);
    run(world, boss, K.SPIT_PREP_TIME[0] + STEP * 2);
    expect(boss.st).toBe('spit');
    expect(boss.mud.length).toBe(K.SPIT_BALLS[0]);
    for (let i = 0; i < K.FIRE_HITS_PER_HP; i++) boss.onFireball(world);
    expect(boss.hp).toBe(K.KAIMAN_HP - 1);
    run(world, boss, 2);
    expect(p.shield).toBe(false);
    expect(boss.mud.length).toBe(0);
  });

  it('el golpe al mangle hace caer propágulos con aviso: uno sobre el jugador', () => {
    const { world, boss } = setup();
    const p = world.player;
    boss.phase = 2;
    boss.x = 76 * T;
    p.x = 66 * T;
    p.y = 12 * T - p.h;
    p.shield = true;
    p.inv = 0;
    enter('slamPrep', boss);
    run(world, boss, K.SLAM_PREP_TIME[1] + STEP * 2);
    expect(boss.st).toBe('slam');
    expect(boss.propagules.length).toBe(K.PROPAGULES[1]);
    expect(boss.propagules.some((s) => Math.abs(s.x - (p.x + p.w / 2)) < 1)).toBe(true);
    // Durante el aviso no hace daño.
    run(world, boss, K.PROPAGULE_WARN[1] * 0.8);
    expect(p.shield).toBe(true);
    run(world, boss, 1.2);
    expect(p.shield).toBe(false);
  });

  it('la pelea completa se puede ganar: recorre las tres fases y usa todo el repertorio', () => {
    const { world, boss } = setup();
    const p = world.player;
    p.x = 64 * T;
    const attacks = new Set<string>();
    const phases = new Set<number>();
    let t = 0;
    for (; t < 240 && boss.st !== 'gone'; t += STEP) {
      p.inv = 10; // invulnerable: solo se mide el ritmo de la pelea
      if (boss.st === 'exposed' && boss.t > 0.2) {
        p.inv = 0;
        dropOnBack(world, boss);
        p.inv = 0;
      } else if (boss.st !== 'exposed') {
        // Se mueve de lado a lado para provocar ataques cercanos y lejanos.
        p.x = (Math.sin(t / 3) > 0 ? 65 : 81) * T;
        p.y = 12 * T - p.h;
        p.vy = 0;
      }
      boss.update(world, STEP);
      if (boss.lastAttack) attacks.add(boss.lastAttack);
      phases.add(boss.phase);
    }
    expect(boss.st).toBe('gone');
    expect([...phases].sort()).toEqual([1, 2, 3]);
    expect([...attacks].sort()).toEqual(['bite', 'dive', 'slam', 'spit', 'tail']);
    expect(t).toBeLessThan(180);
  });
});
