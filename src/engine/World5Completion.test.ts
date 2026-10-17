import { describe, expect, it } from 'vitest';
import { getLevel, nextLevelId } from '../data/worlds';
import { isUnlocked, sanitizeProgress } from '../store/progress';
import { AudioEngine } from './audio';
import { Sargazo } from './bosses/sargazo';
import { GROUND, OXYGEN_MAX, STEP, T } from './constants';
import { updateBalls } from './entities/ball';
import { carryRider, landOnPlatforms, updatePlatforms } from './entities/platforms';
import { updateFireballs } from './entities/projectiles';
import { Input } from './input';
import { World } from './World';

function make(id = '5-6', fromCheckpoint = false): World {
  const def = getLevel(id);
  if (!def) throw Error(`Falta ${id}`);
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def, audio, input: new Input(), fromCheckpoint, session: { score: 0, coins: 0, lives: 3 } });
}

function boss(w: World): Sargazo {
  if (!(w.boss instanceof Sargazo)) throw Error('Falta Capitán Sargazo');
  return w.boss;
}

function stepBoss(w: World, seconds: number): void {
  w.player.x = 80 * T; w.player.y = 7 * T;
  for (let t = 0; t < seconds; t += STEP) boss(w).update(w, STEP);
}

describe('Mundo 5 completo', () => {
  it('continúa desde el récord publicado sin cambiar ids ni guardados', () => {
    const record = { bestScore: 1000, stars: 2, completions: 1 };
    const p = sanitizeProgress({ levels: { '5-3': record } });
    expect(p.levels['5-3']).toEqual(record); expect(isUnlocked(p, '5-4')).toBe(true);
    expect(nextLevelId('5-3')).toBe('5-4'); expect(nextLevelId('5-4')).toBe('5-5');
    expect(nextLevelId('5-5')).toBe('5-6'); expect(nextLevelId('5-6')).toBe('6-1');
  });

  it.each(['5-3', '5-4', '5-5', '5-6'])('%s tiene checkpoint seco y consejo de Toh', id => {
    const w = make(id, true), p = w.player;
    expect(w.solid(Math.floor(p.x / T), GROUND)).toBe(true);
    expect(w.level.water.some(z => p.x / T >= z.x0 && p.x / T <= z.x1)).toBe(false);
    expect(p.oxygen).toBe(OXYGEN_MAX); expect(w.def.hint).toBeTruthy();
  });

  it('Xcaret ofrece luz, corrientes, bolsas de aire y respiraderos próximos', () => {
    const w = make('5-4');
    expect(w.darkness).not.toBeNull(); expect(w.level.lights.length).toBeGreaterThan(0);
    expect(w.level.currents.some(z => z.vx < 0)).toBe(true);
    for (const z of w.level.water) {
      const stops = [z.x0, ...w.level.bubbles.filter(b => b.x >= z.x0 && b.x <= z.x1).map(b => b.x), z.x1];
      for (let i = 1; i < stops.length; i++) expect(stops[i] - stops[i - 1]).toBeLessThanOrEqual(12);
    }
    expect(w.solid(38, 5)).toBe(false); expect(w.solid(37, 5)).toBe(true);
  });

  it('los barcos se mecen y las tortugas transportan al jugador sin recibir daño', () => {
    const marina = make('5-5');
    expect(marina.platforms.filter(m => m.spec.kind === 'mover' && m.spec.appearance === 'boat')).toHaveLength(4);
    const w = make(), m = w.platforms[0], p = w.player;
    const y = m.y; updatePlatforms(w.platforms, m.x, 1); expect(m.y).toBeGreaterThan(y);
    p.x = m.x + 20; p.y = m.y - p.h + 1; p.vy = 100;
    landOnPlatforms(w, m.y - 1); expect(m.rider).toBe(true);
    const x = p.x; updatePlatforms(w.platforms, m.x, STEP); carryRider(w);
    expect(p.x).not.toBe(x);
    w.enemies = []; w.camX = m.x - 100;
    w.fireballs = [{ x: m.x + 20, y: m.y + 8, vx: 0, vy: 0, t: 0, gone: false }];
    updateFireballs(w, STEP);
    w.balls = [{ x: m.x + 20, y: m.y, w: 20, h: 20, vx: 0, vy: 0, onGround: false, bounces: 0, t: 0, spin: 0, gone: false }];
    updateBalls(w, STEP);
    expect(w.platforms).toContain(m); expect(m.submerged).not.toBe(true);
    m.submerged = true; m.rider = false; p.y = m.y - p.h + 1;
    landOnPlatforms(w, m.y - 1); expect(m.rider).toBe(false);
  });
});

describe('Capitán Sargazo', () => {
  it('cierra la entrada, fija cámara y publica identidad y presentación en el HUD', () => {
    const w = make(), b = boss(w); w.player.x = 80 * T;
    b.update(w, STEP);
    expect(b.intro).toBe(true); expect(b.lockCamera).toBe(true); expect(w.solid(77, 0)).toBe(true);
    expect(w.hudState(0).boss?.id).toBe('sargazo');
    stepBoss(w, 3); expect(w.camX).toBe(77 * T);
  });

  it('resuelve impactos reales de fuego y pelota únicamente con el núcleo abierto', () => {
    const w = make(), b = boss(w); w.enemies = []; w.camX = 77 * T;
    const fire = (): void => {
      w.fireballs = [{ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0, t: 0, gone: false }];
      updateFireballs(w, STEP);
    };
    b.st = 'idle'; fire(); expect(b.hp).toBe(12);
    b.st = 'exposed'; fire(); expect(b.hp).toBe(12);
    w.balls = [{ x: b.x + 20, y: b.y + 20, w: 20, h: 20, vx: 0, vy: 0, onGround: false, bounces: 0, t: 0, spin: 0, gone: false }];
    updateBalls(w, STEP); expect(b.hp).toBe(11); expect(b.hittable).toBe(false);
  });
});
