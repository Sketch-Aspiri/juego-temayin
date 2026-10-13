import { describe, expect, it } from 'vitest';
import { getLevel, nextLevelId, WORLDS } from '../data/worlds';
import { isUnlocked, sanitizeProgress } from '../store/progress';
import { AudioEngine } from './audio';
import { OXYGEN_MAX, ROWS, STEP, T } from './constants';
import { updateBalls } from './entities/ball';
import { createEnemy, ENEMIES, updateEnemies } from './entities/enemies';
import { updateFireballs } from './entities/projectiles';
import { updateOxygen } from './entities/swim';
import { Input } from './input';
import { World } from './World';

function make(id = '5-2', fromCheckpoint = false): World {
  const def = getLevel(id);
  if (!def) throw Error(`Falta el nivel ${id}`);
  const audio = new AudioEngine(); audio.muted = true;
  return new World({ def, audio, input: new Input(), fromCheckpoint, session: { score: 0, coins: 0, lives: 3 } });
}

describe('Riviera Maya: Cancún y Puerto Morelos', () => {
  it('conecta Nuevo Xcán, Cancún, Puerto Morelos y Playa del Carmen', () => {
    expect(WORLDS.find(w => w.number === 5)?.levels.map(l => l.id)).toEqual(['5-1', '5-2', '5-3', '5-4', '5-5', '5-6']);
    expect(nextLevelId('4-5')).toBe('5-1');
    expect(nextLevelId('5-1')).toBe('5-2'); expect(nextLevelId('5-2')).toBe('5-3');
  });

  it('conserva el récord y el acceso a Playa del Carmen', () => {
    const record = { bestScore: 15000, stars: 3, completions: 2 };
    const progress = sanitizeProgress({ levels: { '5-3': record } });
    expect(progress.levels['5-3']).toEqual(record); expect(isUnlocked(progress, '5-3')).toBe(true);
    expect(isUnlocked(progress, '5-2')).toBe(false);
    expect(isUnlocked(sanitizeProgress({ levels: { '4-5': record } }), '5-1')).toBe(true);
    expect(isUnlocked(sanitizeProgress({ levels: { '5-1': record } }), '5-2')).toBe(true);
  });

  it.each(['5-1', '5-2'])('%s reaparece en suelo seco, con aire y sin enemigos cerca', id => {
    const w = make(id, true), p = w.player;
    expect(w.checkpointReached).toBe(true); expect(p.oxygen).toBe(OXYGEN_MAX);
    expect(w.solid(Math.floor(p.x / T), 12)).toBe(true);
    expect(w.level.water.some(z => p.x / T >= z.x0 && p.x / T <= z.x1)).toBe(false);
    expect(w.enemies.every(e => Math.abs(e.x - p.x) > 4 * T)).toBe(true);
    expect(w.def.hint).toBeTruthy();
  });

  it('Cancún requiere vagones y plataformas móviles en sus fosos secos', () => {
    const w = make('5-1');
    expect(w.level.platforms.some(p => p.kind === 'train')).toBe(true);
    expect(w.level.platforms.some(p => p.kind === 'mover')).toBe(true);
    expect(w.level.water).toHaveLength(0);
    expect(w.level.bubbles).toHaveLength(0);
    expect(w.def.decorativeWater).toBe(false);
    expect(new Set(w.enemies.map(e => e.id))).toEqual(new Set(['blueCrab', 'pirateCrab', 'urchin']));
  });

  it('el arrecife ofrece aire a intervalos cortos y snorkel tras el checkpoint', () => {
    const w = make();
    for (const z of w.level.water) {
      const vents = w.level.bubbles.filter(b => b.x >= z.x0 && b.x <= z.x1);
      const stops = [z.x0, ...vents.map(b => b.x), z.x1];
      for (let i = 1; i < stops.length; i++) expect(stops[i] - stops[i - 1]).toBeLessThanOrEqual(12);
    }
    expect(w.grid[4][100]).toBe('S');
    expect(w.def.theme).toBe('reef');
    const submerged = w.level.water.reduce((n, z) => n + z.x1 - z.x0 + 1, 0);
    expect(submerged / w.width).toBeGreaterThan(0.7);
  });

  it('cada respiradero recarga el oxígeno y los enemigos nacen bajo el agua', () => {
    const w = make(), p = w.player;
    for (const b of w.level.bubbles) {
      p.x = b.x * T; p.y = 8 * T; p.oxygen = 2;
      updateOxygen(w, 1); expect(p.oxygen).toBeGreaterThan(2);
    }
    for (const e of w.enemies) {
      expect(w.level.water.some(z => e.x / T >= z.x0 && e.x / T <= z.x1 && e.y / T >= z.surface)).toBe(true);
    }
  });

  it('el pez león nada despacio y gira al llegar a la orilla', () => {
    const w = make(), e = createEnemy({ id: 'lionfish', tx: 16, ty: 8 });
    e.x = 16 * T; e.t = 0;
    ENEMIES.lionfish.move(e, w, STEP);
    expect(e.x).toBeGreaterThanOrEqual(16 * T); expect(e.vx).toBeGreaterThan(0);
    expect(ENEMIES.lionfish.speed).toBeLessThan(ENEMIES.barracuda.speed);
    expect(ENEMIES.lionfish.score).toBeGreaterThan(ENEMIES.barracuda.score);
  });

  it('la medusa oscila en vertical dentro del agua', () => {
    const w = make(), e = createEnemy({ id: 'jellyfish', tx: 40, ty: 6 });
    const x = e.x, ys: number[] = [];
    for (let i = 0; i < 1200; i++) { ENEMIES.jellyfish.move(e, w, STEP); ys.push(e.y); }
    expect(e.x).toBe(x); expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(3 * T);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(3 * T);
    expect(Math.max(...ys) + e.h).toBeLessThanOrEqual(ROWS * T);
  });

  it.each(['lionfish', 'jellyfish'] as const)('%s hiere al intentar pisarlo', id => {
    const w = make(), e = createEnemy({ id, tx: 24, ty: 8 });
    e.active = true; w.enemies = [e];
    w.player.x = e.x; w.player.y = e.y - w.player.h + 5; w.player.vy = 100; w.player.inv = 0;
    updateEnemies(w, STEP);
    expect(e.dead).toBe(0); expect(w.phase).toBe('dying');
  });

  it.each(['lionfish', 'jellyfish'] as const)('%s puede derrotarse con fuego y pelota', id => {
    for (const weapon of ['fire', 'ball']) {
      const w = make(), e = createEnemy({ id, tx: 24, ty: 8 });
      e.active = true; w.enemies = [e]; w.camX = e.x - 200;
      if (weapon === 'fire') {
        w.fireballs = [{ x: e.x + 12, y: e.y + 12, vx: 0, vy: 0, t: 0, gone: false }];
        updateFireballs(w, STEP);
      } else {
        w.balls = [{ x: e.x, y: e.y, w: 20, h: 20, vx: 0, vy: 0, onGround: false, bounces: 0, t: 0, spin: 0, gone: false }];
        updateBalls(w, STEP);
      }
      expect(e.dead).toBeGreaterThan(0); expect(w.session.score).toBe(ENEMIES[id].score);
    }
  });
});
