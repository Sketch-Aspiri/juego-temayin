import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import type { LightSource } from '../../render/lighting';
import { World } from '../../World';
import { callWisps, wispHarmful } from './hazards';
import { type ChivoState, HuayChivo } from './index';
import * as K from './tuning';

const silent = new AudioEngine();
silent.muted = true;

const ARENA: readonly [number, number] = [63, 85];
const LEFT = ARENA[0] * T;
const RIGHT = (ARENA[1] + 1) * T;
/** Tiempo mínimo entre un aviso y el primer estado dañino, también en la fase 3. */
const MIN_WARNING = 0.6;

function setup(): { world: World; boss: HuayChivo } {
  const def = getLevel('3-5');
  if (!def) throw new Error('falta el nivel 3-5');
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio: silent });
  const boss = world.boss;
  if (!(boss instanceof HuayChivo)) throw new Error('el jefe de 3-5 debe ser Huay Chivo');
  // Lejos del jefe e invulnerable salvo que la prueba diga lo contrario.
  world.player.x = LEFT + T;
  world.player.inv = 1000;
  return { world, boss };
}

const enter = (boss: HuayChivo, st: ChivoState): void => {
  boss.st = st;
  boss.t = 0;
};

const run = (world: World, boss: HuayChivo, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) boss.update(world, STEP);
};

/** Avanza hasta que se cumpla `done` y devuelve los segundos transcurridos. */
function until(world: World, boss: HuayChivo, done: () => boolean, max = 10): number {
  let t = 0;
  while (!done() && t < max) { boss.update(world, STEP); t += STEP; }
  expect(done()).toBe(true);
  return t;
}

/** Coloca al jugador cayendo justo sobre el lomo del jefe, vulnerable y con escudo. */
function dropOnBack(world: World, boss: HuayChivo): void {
  const p = world.player;
  p.x = boss.x + boss.w / 2 - p.w / 2;
  p.y = boss.y - p.h + 10;
  p.vy = 300;
  p.inv = 0;
  p.shield = true;
}

/** Deja al jefe aturdido y le quita un PV con dos bolas de fuego. */
function hitOnce(world: World, boss: HuayChivo): void {
  enter(boss, 'dazed');
  boss.onFireball(world);
  boss.onFireball(world);
}

describe('Huay Chivo', () => {
  it('despierta al entrar en la arena, cierra la columna 62 y fija la cámara', () => {
    const { world, boss } = setup();
    world.player.x = (ARENA[0] + 2) * T;
    boss.update(world, STEP);
    expect(boss.intro).toBe(true);
    expect(boss.lockCamera).toBe(true);
    expect(world.solid(ARENA[0] - 1, 5)).toBe(true);
  });

  it('solo se le puede golpear aturdido', () => {
    const { boss } = setup();
    const states: readonly ChivoState[] = [
      'intro', 'idle', 'fade', 'hidden', 'appear', 'paw', 'charge', 'turn',
      'crouch', 'leap', 'land', 'rear', 'horn', 'recover', 'call', 'hurt', 'nightfall', 'dead', 'sleep', 'gone',
    ];
    for (const s of states) {
      enter(boss, s);
      expect(boss.hittable, s).toBe(false);
    }
    enter(boss, 'dazed');
    expect(boss.hittable).toBe(true);
  });

  it('en la fase 3 cada aviso dura al menos 0,6 s antes del ataque', () => {
    const { world, boss } = setup();
    boss.phase = 3;
    boss.x = 2900;
    const cases: readonly [ChivoState, () => boolean][] = [
      ['paw', () => boss.st === 'charge'],
      ['turn', () => boss.st === 'charge'],
      ['crouch', () => boss.st === 'leap'],
      ['rear', () => boss.st === 'horn'],
      ['call', () => boss.wisps.some(wispHarmful)],
    ];
    for (const [st, attack] of cases) {
      boss.x = 2900; boss.wisps.length = 0;
      enter(boss, st);
      expect(until(world, boss, attack), st).toBeGreaterThanOrEqual(MIN_WARNING);
    }
    enter(boss, 'fade');
    until(world, boss, () => boss.st === 'hidden');
    expect(until(world, boss, () => boss.st === 'paw')).toBeGreaterThanOrEqual(MIN_WARNING);
  });

  it('el teletransporte avisa en el arco de destino, lejos del jugador', () => {
    const { world, boss } = setup();
    world.player.x = 2950;
    enter(boss, 'fade');
    until(world, boss, () => boss.st === 'hidden');
    const target = boss.blinkX;
    until(world, boss, () => boss.st === 'paw');
    expect(boss.x).toBe(target);
    expect(Math.abs(boss.x + boss.w / 2 - (world.player.x + world.player.w / 2))).toBeGreaterThanOrEqual(K.BLINK_MIN_DIST);
  });

  it('la embestida termina aturdido contra el borde', () => {
    const { world, boss } = setup();
    boss.x = 2900; boss.face = 1;
    enter(boss, 'charge');
    until(world, boss, () => boss.st !== 'charge');
    expect(boss.st).toBe('dazed');
    expect(boss.x).toBe(RIGHT - boss.w);
  });

  it('en la fase 3 da media vuelta y queda aturdido en el borde contrario', () => {
    const { world, boss } = setup();
    boss.phase = 3;
    boss.x = 2900; boss.face = 1;
    enter(boss, 'charge');
    until(world, boss, () => boss.st !== 'charge');
    expect(boss.st).toBe('turn');
    expect(boss.x).toBe(RIGHT - boss.w);
    until(world, boss, () => boss.st === 'charge');
    until(world, boss, () => boss.st !== 'charge');
    expect(boss.st).toBe('dazed');
    expect(boss.x).toBe(LEFT);
  });

  it('pisarlo aturdido le quita un PV y rebota; en plena embestida hiere al jugador', () => {
    const { world, boss } = setup();
    enter(boss, 'charge');
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP);
    expect(world.player.shield).toBe(false);
    expect(world.player.vy).toBeLessThan(0);

    enter(boss, 'dazed');
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP - 1);
    expect(boss.st).toBe('hurt');
    expect(world.player.vy).toBeLessThan(0);
    expect(world.player.shield).toBe(true);
  });

  it('el fuego fuera de la ventana no daña; dos bolas aturdido quitan un PV y solo uno por ventana', () => {
    const { world, boss } = setup();
    enter(boss, 'charge');
    boss.onFireball(world);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP);

    enter(boss, 'dazed');
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP);
    boss.onFireball(world);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP - 1);
    boss.onFireball(world);
    boss.onFireball(world);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(boss.hp).toBe(K.HUAY_CHIVO_HP - 1);
  });

  it('a 5 PV cae la noche: fase 2, inofensivo y no golpeable mientras oscurece', () => {
    const { world, boss } = setup();
    boss.hp = K.PHASE2_HP + 1;
    hitOnce(world, boss);
    expect(boss.hp).toBe(K.PHASE2_HP);
    until(world, boss, () => boss.st === 'nightfall');
    expect(boss.stage).toBe(2);
    expect(boss.hittable).toBe(false);
    dropOnBack(world, boss);
    boss.update(world, STEP);
    expect(world.player.shield).toBe(true);
    until(world, boss, () => boss.st !== 'nightfall');
    expect(world.darkness?.alpha).toBe(0.5);
    expect(world.popups.some((p) => p.txt === '¡CAE LA NOCHE!')).toBe(true);
  });

  it('a 2 PV llega la noche cerrada (fase 3)', () => {
    const { world, boss } = setup();
    boss.phase = 2;
    boss.hp = K.PHASE3_HP + 1;
    hitOnce(world, boss);
    until(world, boss, () => boss.st === 'nightfall');
    expect(boss.stage).toBe(3);
    until(world, boss, () => boss.st !== 'nightfall');
    expect(world.darkness?.alpha).toBe(0.8);
    expect(world.popups.some((p) => p.txt === '¡NOCHE CERRADA!')).toBe(true);
  });

  it('borra los fuegos fatuos al recibir daño', () => {
    const { world, boss } = setup();
    callWisps(boss.wisps, 3000, 380, 1);
    hitOnce(world, boss);
    expect(boss.wisps).toHaveLength(0);
  });

  it('al morir restaura la luz, abre el muro y libera la cámara', () => {
    const { world, boss } = setup();
    boss.phase = 3;
    world.darkness = K.NIGHT_DARKNESS[2];
    boss.hp = 1;
    hitOnce(world, boss);
    expect(boss.st).toBe('dead');
    run(world, boss, K.DEAD_TIME + 0.1);
    expect(boss.st).toBe('gone');
    expect(world.darkness).toBeNull();
    expect(world.solid(ARENA[1] + 1, 0)).toBe(false);
    expect(boss.lockCamera).toBe(false);
  });

  it('aporta luz de ojos en los avisos y al estar aturdido', () => {
    const { boss } = setup();
    const lightsIn = (st: ChivoState): LightSource[] => {
      enter(boss, st);
      const out: LightSource[] = [];
      boss.lights(out);
      return out;
    };
    for (const st of ['paw', 'turn', 'crouch', 'call'] as const) {
      expect(lightsIn(st).map((l) => l.radius), st).toContain(K.EYE_LIGHT_RADIUS);
    }
    expect(lightsIn('dazed').map((l) => l.radius)).toContain(K.DAZED_LIGHT_RADIUS);
    expect(lightsIn('idle')).toHaveLength(0);
    boss.blinkX = 3100;
    expect(lightsIn('hidden')[0].x).toBeCloseTo(3100 + boss.w / 2, -2);
  });
});
