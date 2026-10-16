import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { Sargazo } from './index';
import { startHazard, stepShots, stepTides, stepVortices, type SeaTide } from './hazards';
import * as K from './tuning';

function setup() {
  const audio = new AudioEngine(); audio.muted = true;
  const world = new World({ def: getLevel('5-6')!, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
  world.player.x = 84 * T; world.player.y = 260;
  return { world, boss: world.boss as Sargazo };
}

describe('Peligros submarinos', () => {
  it('devuelve semillas inofensivas durante su aviso y dañinas después', () => {
    const { world, boss } = setup(), p = world.player;
    const shots = [{ x: p.x + 10, y: p.y + 10, vx: 0, vy: 0, wait: 0.1, t: 0 }];
    stepShots(world, shots, STEP, boss.left, boss.right);
    expect(world.phase).toBe('play');
    shots[0].wait = 0; stepShots(world, shots, STEP, boss.left, boss.right);
    expect(world.phase).toBe('dying'); expect(shots).toHaveLength(0);
  });

  it.each([20, 200, 280, 430])('devuelve colisión de cortina solo dentro del agua a altura %i', y => {
    const { world, boss } = setup(); world.player.y = y;
    const tides: SeaTide[] = [{ x: world.player.x, dir: 1, gapY: 300, gap: 160, speed: 125 }];
    stepTides(world, tides, STEP, boss.left, boss.right);
    expect(world.phase).toBe(y === 20 || y === 280 ? 'play' : 'dying');
  });

  it('devuelve daño en el centro exacto del remolino y permite salir de su radio', () => {
    const { world } = setup(), p = world.player;
    const center = [{ x: p.x + p.w / 2, y: p.y + p.h / 2, t: 0 }];
    stepVortices(world, center, 4, STEP);
    expect(world.phase).toBe('dying');
    const free = setup(); free.world.player.x += K.VORTEX_RADIUS + 1;
    stepVortices(free.world, center, 4, STEP);
    expect(free.world.phase).toBe('play');
  });

  it('devuelve lluvia y salvas acotadas y limpia todos los peligros al abrir el núcleo', () => {
    const { world, boss } = setup(); boss.attack = 'rain';
    for (let i = 0; i < 10; i++) startHazard(boss, world);
    expect(boss.shots.length).toBeLessThanOrEqual(K.MAX_BALLS);
    boss.team.bind(world, boss.left, boss.right);
    boss.team.pulse = { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2 };
    boss.st = 'attack'; boss.update(world, STEP);
    expect(boss.hittable).toBe(true); expect(boss.shots).toHaveLength(0);
  });
});
