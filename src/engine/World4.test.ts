import { describe, expect, it } from 'vitest';
import { getLevel, nextLevelId, WORLDS } from '../data/worlds';
import { isUnlocked, sanitizeProgress } from '../store/progress';
import { AudioEngine } from './audio';
import { HuayPek } from './bosses/huayPek';
import { FOG_ALPHA, FOG_LIGHT_RADIUS } from './bosses/huayPek/tuning';
import { STEP, T } from './constants';
import { updateBalls } from './entities/ball';
import { createEnemy, ENEMIES } from './entities/enemies';
import { updateOxygen } from './entities/swim';
import { Input } from './input';
import { World } from './World';

const audio = new AudioEngine();
audio.muted = true;
function make(id = '4-2'): World {
  const def = getLevel(id);
  if (!def) throw Error(`Falta el nivel ${id}`);
  return new World({ def, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
}

describe('Mundo 4 integrado', () => {
  it('recorre cinco estaciones entre Izamal y Cancún', () => {
    expect(WORLDS.find(w => w.number === 4)?.levels.map(l => l.id)).toEqual(['4-1', '4-2', '4-3', '4-4', '4-5']);
    expect(nextLevelId('3-5')).toBe('4-1');
    expect(nextLevelId('4-5')).toBe('5-1');
    for (const id of ['4-1', '4-2', '4-3', '4-4']) expect(nextLevelId(id)).toBe(`4-${Number(id[2]) + 1}`);
  });

  it('conserva los récords publicados de Xibalbá y Valladolid', () => {
    const record = { bestScore: 8400, stars: 3, completions: 2 };
    const progress = sanitizeProgress({ levels: { '4-2': record, '4-3': record } });
    expect(progress.levels).toEqual({ '4-2': record, '4-3': record });
    expect(isUnlocked(progress, '4-2')).toBe(true);
    expect(isUnlocked(progress, '4-3')).toBe(true);
    expect(isUnlocked(progress, '4-4')).toBe(true);
  });

  it.each(['4-1', '4-2', '4-3', '4-4', '4-5'])('%s ofrece consejo y reaparición segura', id => {
    const w = make(id);
    expect(w.def.hint).toBeTruthy();
    const restored = new World({ def: w.def, audio, input: new Input(), fromCheckpoint: true, session: { score: 0, coins: 0, lives: 3 } });
    expect(restored.checkpointReached).toBe(true);
    expect(restored.solid(Math.floor(restored.player.x / T), Math.floor((restored.player.y + restored.player.h) / T))).toBe(true);
  });

  it('Xibalbá combina agua, luz del jugador y antorchas', () => {
    const w = make();
    expect(w.darkness).toEqual({ radius: 200, alpha: 0.85 });
    expect(w.level.water.length).toBeGreaterThan(0);
    expect(w.level.lights).toHaveLength(5);
    expect(w.lightSources()).toHaveLength(6);
  });

  it('permite continuar de la escalera a la meseta sin caer en un hueco ciego', () => {
    const w = make(), p = w.player;
    p.x = 91 * T + 2; p.y = 8 * T - p.h; p.onGround = true; p.inv = 2;
    w.input.press('right'); w.input.press('run');
    for (let i = 0; i < 140; i++) {
      if (i === 40) w.input.press('jump');
      if (i === 76) w.input.release('jump');
      w.update(STEP);
    }
    expect(w.phase).toBe('play');
    expect(p.x).toBeGreaterThan(98 * T);
  });

  it.each([['4-2', 50, 7], ['4-3', 50, 5], ['4-3', 145, 6]] as const)('la bolsa de aire en %s, columna %i permite respirar', (id, x, surface) => {
    const w = make(id), p = w.player;
    p.x = x * T + 4; p.y = surface * T - 24; p.swimming = true; p.oxygen = 2;
    for (let i = 0; i < 120; i++) updateOxygen(w, STEP);
    expect(p.oxygen).toBeGreaterThan(2);
  });

  it('Leona Vicario tiene lluvia, resina y ceibas sin sargazo marino', () => {
    const w = make('4-4');
    expect(w.def.weather).toBe('rain');
    expect(w.slowZones.length).toBeGreaterThan(0);
    expect(w.slowZones.every(z => z.kind === 'resin')).toBe(true);
    expect(w.enemies.filter(e => e.id === 'xtabay')).toHaveLength(4);
  });

  it('la luz disuelve una sombra cercana y deja intacta la que está en penumbra', () => {
    const w = make(), near = createEnemy({ id: 'shade', tx: 4, ty: 10 });
    near.x = w.player.x + 20; near.y = w.player.y;
    ENEMIES.shade.move(near, w, STEP);
    expect(near.dead).toBeGreaterThan(0);
    const far = createEnemy({ id: 'shade', tx: 11, ty: 10 });
    ENEMIES.shade.move(far, w, STEP);
    expect(far.dead).toBe(0);
  });

  it('el ajolote invisible y la ceiba encantada resisten la pelota', () => {
    const w = make();
    for (const id of ['axolotl', 'xtabay'] as const) {
      const e = createEnemy({ id, tx: 40, ty: 9 }); e.active = true;
      w.enemies = [e]; w.camX = e.x - 300;
      w.balls = [{ x: e.x, y: e.y, w: 20, h: 20, vx: 0, vy: 0, onGround: false, bounces: 0, t: 0, spin: 0, gone: false }];
      updateBalls(w, STEP);
      expect(e.dead).toBe(0);
    }
  });

  it('una sombra disuelta no hiere al jugador durante el mismo paso', () => {
    const w = make(), e = createEnemy({ id: 'shade', tx: 4, ty: 10 });
    e.x = w.player.x; e.y = w.player.y; e.active = true;
    w.enemies = [e]; w.player.inv = 0;
    w.update(STEP);
    expect(e.dead).toBeGreaterThan(0);
    expect(w.phase).toBe('play');
    expect(w.session.lives).toBe(3);
  });

  it('Huay Pek usa la oscuridad global en fase 2 y la restaura al abrir la salida', () => {
    const w = make('4-5');
    const boss = w.boss;
    expect(boss).toBeInstanceOf(HuayPek);
    if (!(boss instanceof HuayPek)) throw Error('Falta Huay Pek');
    for (let i = 0; i < 6; i++) {
      boss.st = 'vulnerable'; boss.onFireball(w); boss.onFireball(w);
      if (i === 2) {
        expect(boss.phase2).toBe(true);
        expect(w.darkness).toEqual({ radius: FOG_LIGHT_RADIUS, alpha: FOG_ALPHA });
      }
    }
    for (let i = 0; i < 400; i++) boss.update(w, STEP);
    expect(boss.hp).toBe(0); expect(boss.lockCamera).toBe(false);
    expect(w.solid(84, 0)).toBe(false);
    expect(w.darkness).toEqual(w.def.darkness);
  });
});
