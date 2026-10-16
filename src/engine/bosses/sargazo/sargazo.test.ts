import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { OXYGEN_MAX, STEP, T } from '../../constants';
import { Input } from '../../input';
import { updateOxygen } from '../../entities/swim';
import { updateFireballs } from '../../entities/projectiles';
import { World } from '../../World';
import { Sargazo } from './index';

function setup() {
  const audio = new AudioEngine(); audio.muted = true;
  const world = new World({ def: getLevel('5-6')!, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
  world.player.x = 80 * T; world.player.inv = 1000;
  const boss = world.boss as Sargazo;
  boss.update(world, STEP);
  return { world, boss };
}

describe('Capitán Sargazo submarino', () => {
  it('devuelve doce PV y cuatro etapas cuando pierde las capas', () => {
    const { world, boss } = setup();
    expect(boss.maxHp).toBe(12);
    for (let hp = 12; hp > 0; hp--) {
      boss.st = 'exposed'; boss.t = 0;
      boss.onFireball(world); expect(boss.hp).toBe(hp);
      boss.onFireball(world); expect(boss.hp).toBe(hp - 1);
      boss.onFireball(world); expect(boss.hp).toBe(hp - 1);
      if ([9, 6, 3].includes(hp - 1)) expect(boss.stage).toBe(1 + (12 - boss.hp) / 3);
    }
    for (let i = 0; i < 300; i++) boss.update(world, STEP);
    expect(boss.lockCamera).toBe(false);
    expect(world.solid(101, 0)).toBe(false);
  });

  it('devuelve un núcleo cerrado hasta que se rescata una tortuga nadando sin poderes', () => {
    const { world, boss } = setup();
    boss.st = 'warn'; boss.attack = 'net'; boss.t = 3;
    boss.update(world, STEP);
    const ally = boss.turtles.find(t => t.netted)!;
    expect(ally).toBeDefined();
    expect(boss.hittable).toBe(false);
    world.player.fire = false; world.player.ball = false; world.player.snorkel = 0;
    world.player.x = ally.platform.x + ally.platform.w / 2 - world.player.w / 2;
    world.player.y = ally.platform.y - world.player.h / 2;
    for (let i = 0; i < 600 && !boss.hittable; i++) boss.update(world, STEP);
    expect(ally.netted).toBe(false);
    expect(boss.rescues).toBe(1);
    expect(boss.hittable).toBe(true);
    world.player.x = boss.x; world.player.y = boss.y; world.player.vy = 0;
    boss.update(world, STEP);
    expect(boss.hp).toBe(11);
  });

  it('devuelve aire antes de agotar el oxígeno cuando nada junto a una tortuga libre', () => {
    const { world, boss } = setup();
    const ally = boss.turtles[0], p = world.player;
    p.x = ally.platform.x + ally.platform.w / 2 - p.w / 2;
    p.y = ally.platform.y - p.h / 2;
    p.oxygen = STEP / 2;
    updateOxygen(world, STEP);
    expect(world.phase).toBe('play');
    expect(p.oxygen).toBeGreaterThan(STEP / 2);
    ally.netted = true;
    expect(boss.providesAir(p)).toBe(false);
  });

  it('devuelve tortugas intactas al disparar y permite deshacer su enredo con fuego real', () => {
    const { world, boss } = setup();
    boss.st = 'warn'; boss.attack = 'net'; boss.t = 3; boss.update(world, STEP);
    const ally = boss.turtles.find(t => t.netted)!;
    world.camX = 77 * T;
    const count = world.platforms.length;
    for (let i = 0; i < 2; i++) {
      world.fireballs.push({ x: ally.platform.x + ally.platform.w / 2, y: ally.platform.y, vx: 0, vy: 0, t: 0, gone: false });
      boss.update(world, STEP); updateFireballs(world, STEP);
    }
    expect(ally.netted).toBe(false);
    expect(world.platforms).toHaveLength(count);
    expect(world.player.oxygen).toBeLessThanOrEqual(OXYGEN_MAX);
  });

  it('devuelve impulso con una brazada próxima y lo limita con un tiempo de recarga', () => {
    const { world, boss } = setup(), ally = boss.turtles[0], p = world.player;
    p.x = ally.platform.x + ally.platform.w / 2 - p.w / 2;
    p.y = ally.platform.y - p.h / 2; p.strokeT = 0.1; p.vy = -100;
    boss.team.step(world, boss, STEP);
    expect(p.vy).toBe(-430); expect(ally.platform.turtleState).toBe('boost');
    p.vy = -100; boss.team.step(world, boss, STEP);
    expect(p.vy).toBe(-100);
    boss.team.ensnare(0); boss.team.restore();
    expect(ally.netted).toBe(false); expect(ally.platform.turtleState).toBe('swim');
    expect(boss.team.pulse).toBeNull();
  });
});
