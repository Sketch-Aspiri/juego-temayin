import { describe, expect, it } from 'vitest';
import { getLevel, nextLevelId, WORLDS } from '../data/worlds';
import { isUnlocked, sanitizeProgress } from '../store/progress';
import { AudioEngine } from './audio';
import { HuayChivo } from './bosses/huayChivo';
import { GROUND, STEP, T } from './constants';
import { createEnemy, updateEnemies } from './entities/enemies';
import { SCORPION_ALERT_SPEED } from './entities/enemies/scorpion';
import { updatePlayer } from './entities/player';
import { ropeTip } from './entities/ropes';
import { Input } from './input';
import type { Op } from './level/types';
import { World } from './World';

const audio = new AudioEngine();
audio.muted = true;
const make = (ops: readonly Op[] = []): World => new World({
  def: { id: 'prueba', name: 'Prueba', width: 90, theme: 'hacienda', ops: [['coins', 4, 9, 3], ...ops] },
  input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 },
});
const campaign = (id: string, fromCheckpoint = false): World => {
  const def = getLevel(id);
  if (!def) throw new Error(`Falta ${id}`);
  return new World({ def, fromCheckpoint, input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
};
const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

describe('Mundo 3: campaña y progreso', () => {
  it('incluye cinco estaciones entre Calkiní y Xibalbá', () => {
    expect(WORLDS.find(w => w.number === 3)?.levels.map(l => l.id)).toEqual(['3-1', '3-2', '3-3', '3-4', '3-5']);
    expect(nextLevelId('2-7')).toBe('3-1');
    expect(nextLevelId('3-5')).toBe('4-1');
  });
  it('mantiene jugables los récords anteriores al insertar el mundo', () => {
    const saved = sanitizeProgress({ levels: { '4-2': { bestScore: 900, stars: 2, completions: 1 }, '2-7': { bestScore: 600, stars: 1, completions: 1 } } });
    expect(saved.levels['4-2'].bestScore).toBe(900);
    expect(isUnlocked(saved, '4-2')).toBe(true);
    expect(isUnlocked(saved, '3-1')).toBe(true);
  });
  it.each(['3-1', '3-2', '3-3', '3-4', '3-5'])('%s empieza y reaparece sobre terreno seguro', id => {
    for (const checkpoint of [false, true]) {
      const world = campaign(id, checkpoint);
      run(world, 0.2);
      expect(world.phase).toBe('play');
      expect(world.player.onGround).toBe(true);
      expect(world.checkpointReached).toBe(checkpoint);
    }
  });
});

describe('Hamacas', () => {
  it('impulsan al caer y permiten llegar a un tejado seis bloques más alto', () => {
    const world = make([['hammock', 10, GROUND, 3]]);
    world.player.x = 11 * T;
    let highestFeet = GROUND * T;
    for (let i = 0; i < 100; i++) {
      updatePlayer(world, STEP);
      highestFeet = Math.min(highestFeet, world.player.y + world.player.h);
    }
    expect(highestFeet).toBeLessThan(6 * T);
    expect(world.phase).toBe('play');
  });
  it('se atraviesan al subir desde abajo sin invertir el salto', () => {
    const world = make([['hammock', 10, 9, 3]]);
    const p = world.player;
    p.x = 11 * T; p.y = 9 * T + 4; p.vy = -400;
    updatePlayer(world, STEP);
    expect(p.vy).toBeGreaterThan(-500);
    expect(p.vy).toBeLessThan(0);
  });
});

describe('Cuerdas de henequén', () => {
  const grab = (): World => {
    const world = make([['rope', 10, 3, 6]]);
    const [x, y] = ropeTip(world.ropes[0]);
    world.player.x = x - world.player.w / 2;
    world.player.y = y - world.player.h / 2;
    world.player.vx = 200;
    updatePlayer(world, STEP);
    return world;
  };
  it('se engancha en el aire, bombea y suelta conservando velocidad horizontal', () => {
    const world = grab();
    expect(world.player.swinging).toBe(0);
    world.input.press('right'); run(world, 0.25);
    const x = world.player.x;
    world.input.press('jump'); updatePlayer(world, STEP);
    expect(world.player.swinging).toBeNull();
    expect(world.player.vx).toBeGreaterThan(100);
    expect(world.player.vy).toBeLessThan(0);
    expect(world.player.ropeCooldown).toBeGreaterThan(0);
    updatePlayer(world, STEP);
    expect(world.player.swinging).toBeNull();
    expect(world.player.x).toBeGreaterThan(x);
  });
  it('permite lanzar fuego durante el columpio', () => {
    const world = grab(); world.player.fire = true;
    world.input.press('fire'); updatePlayer(world, STEP);
    expect(world.fireballs).toHaveLength(1);
    expect(world.player.swinging).toBe(0);
  });
});

describe('Enemigos y luces de las grutas', () => {
  it('la estalactita avisa, cae y desaparece al llegar al suelo', () => {
    const world = make();
    const e = createEnemy({ id: 'stalactite', tx: 15, ty: 3 });
    world.enemies = [e]; world.player.x = 15 * T; world.player.inv = 10;
    updateEnemies(world, STEP);
    expect(e.state).toBe(1); expect(e.y).toBe(3 * T);
    run(world, 2);
    expect(e.alive).toBe(false);
  });
  it('un salto cercano alerta al escorpión y después vuelve a patrullar', () => {
    const world = make();
    const e = createEnemy({ id: 'scorpion', tx: 15, ty: 11 });
    world.enemies = [e]; world.player.x = 12 * T; world.player.vy = -500;
    world.player.inv = 10;
    updateEnemies(world, STEP);
    expect(Math.abs(e.vx)).toBe(SCORPION_ALERT_SPEED);
    world.player.vy = 0;
    for (let i = 0; i < 200; i++) updateEnemies(world, STEP);
    expect(e.state).toBe(0);
  });
  it('expone luces del jugador, antorchas, cristales y fuego sin DOM', () => {
    const world = campaign('3-1');
    world.fireballs.push({ x: 500, y: 300, vx: 0, vy: 0, t: 0, gone: false });
    const lights = world.lightSources();
    expect(lights.some(l => l.x === world.player.x + world.player.w / 2 && l.radius === 165)).toBe(true);
    expect(lights.some(l => l.x === 500 && l.radius > 0)).toBe(true);
    expect(lights.length).toBeGreaterThan(world.level.lights.length + 1);
  });
});

describe('Huay Chivo', () => {
  const fight = (): readonly [World, HuayChivo] => {
    const world = campaign('3-5');
    world.player.x = 70 * T; world.player.inv = 1000;
    const boss = world.boss;
    if (!(boss instanceof HuayChivo)) throw new Error('Falta Huay Chivo');
    return [world, boss];
  };
  const waitForWeakness = (world: World, boss: HuayChivo): void => {
    for (let i = 0; i < 2000 && !boss.hittable; i++) world.update(STEP);
    expect(boss.hittable).toBe(true);
  };
  it('cierra la arena, resiste fuera de la ventana y puede vencerse en sus dos fases', () => {
    const [world, boss] = fight();
    boss.onFireball(world); expect(boss.hp).toBe(boss.maxHp);
    for (let hit = 0; hit < boss.maxHp; hit++) {
      waitForWeakness(world, boss);
      expect(world.solid(62, 0)).toBe(true);
      boss.onFireball(world);
      expect(boss.hp).toBe(boss.maxHp - hit - 1);
      boss.onFireball(world); expect(boss.hp).toBe(boss.maxHp - hit - 1);
      if (hit === 2) { expect(boss.phase2).toBe(true); expect(world.darkness).not.toBeNull(); }
    }
    run(world, 2);
    expect(boss.hp).toBe(0); expect(boss.lockCamera).toBe(false);
    expect(world.solid(86, 0)).toBe(false); expect(world.darkness).toBeNull();
  });
  it('permite pisarlo cuando está aturdido y rebota al jugador', () => {
    const [world, boss] = fight(); boss.st = 'dazed';
    world.player.x = boss.x + 10; world.player.y = boss.y - world.player.h + 2;
    world.player.vy = 100;
    boss.update(world, STEP);
    expect(boss.hp).toBe(boss.maxHp - 1);
    expect(world.player.vy).toBeLessThan(0);
  });
});
