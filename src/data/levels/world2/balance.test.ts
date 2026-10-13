import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../../engine/audio';
import { GROUND, ROWS, START_LIVES, STEP, T, VW } from '../../../engine/constants';
import { isAirborne, updateEnemies } from '../../../engine/entities/enemies';
import type { Enemy } from '../../../engine/entities/types';
import { platformReach } from '../../../engine/entities/platforms';
import { Input } from '../../../engine/input';
import { buildLevel } from '../../../engine/level/build';
import type { LevelDef } from '../../../engine/level/types';
import { waterColumn } from '../../../engine/level/zones';
import { isSolidTile } from '../../../engine/tiles';
import { World } from '../../../engine/World';
import { WORLDS } from '../../worlds';
import { LEVEL_2_1 } from './2-1-carrillo-puerto';
import { LEVEL_2_4 } from './2-4-petenes';

/**
 * Equilibrio del Mundo 2 (Golfo de Campeche): reglas de justicia que no dependen
 * del gusto, comprobadas con el motor real y sin DOM.
 */
const WORLD_2 = WORLDS.find((w) => w.number === 2)?.levels ?? [];

/** Ritmos de avance del jugador (bloques/s): cauteloso, normal y rápido. */
const PACES = [2.5, 4, 7] as const;
/**
 * Semillas del azar: cada enemigo nace con un reloj aleatorio (`createEnemy`) que
 * desfasa saltos y pinzas, y con ello los choques entre enemigos.
 */
const SEEDS = [1, 7, 42, 1234] as const;
/** Columnas tras el borde de un hoyo en las que no debe nacer un enemigo de suelo. */
const LANDING_CLEARANCE = 2;
/** Largo mínimo de una plataforma móvil sobre un barranco (sin saltos de píxel exacto). */
const MIN_BRIDGE_LENGTH = 3;
/** Tramo del túnel de Petenes con la marea en contra (columnas) y tiempo máximo para remontarlo. */
const PETENES_COUNTER_X0 = 156;
const PETENES_COUNTER_X1 = 164;
const PETENES_COUNTER_MAX_TIME = 6;

function makeWorld(def: LevelDef, fromCheckpoint = false): World {
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({ def, input: new Input(), audio, session: { score: 0, coins: 0, lives: START_LIVES }, fromCheckpoint });
}

/** Generador pseudoaleatorio reproducible (mulberry32) para sustituir a `Math.random`. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `simulateLost` con el azar de los enemigos fijado por `seed`. */
function enemiesLostAt(def: LevelDef, pace: number, seed: number): string[] {
  const random = vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
  try {
    return simulateLost(def, pace);
  } finally {
    random.mockRestore();
  }
}

/**
 * Avanza la cámara al ritmo dado con un jugador invulnerable a ras de suelo y
 * devuelve los enemigos que desaparecen (caen al vacío) sin haber llegado nunca
 * hasta él: ese enemigo solo existe para quien juega deprisa.
 */
function simulateLost(def: LevelDef, pace: number): string[] {
  const world = makeWorld(def);
  const spawnX = new Map(world.enemies.map((e) => [e, e.x] as const));
  const settled = new Set<Enemy>();
  const lost: string[] = [];
  const p = world.player;
  while (world.camX < def.width * T - VW) {
    world.camX += pace * T * STEP;
    p.x = world.camX + 0.4 * VW - p.w / 2;
    p.y = GROUND * T - p.h;
    p.vy = 0;
    p.inv = Infinity;
    updateEnemies(world, STEP);
    for (const e of world.enemies) {
      if (settled.has(e)) continue;
      if (e.x <= p.x + p.w) settled.add(e);
      else if (!e.alive && !e.dead) {
        settled.add(e);
        lost.push(`${e.id}@${Math.round(spawnX.get(e)! / T)}`);
      }
    }
  }
  return lost;
}

describe.each(WORLD_2.map((l) => [l.id, l] as const))('equilibrio del nivel %s', (_id, def) => {
  const lvl = buildLevel(def);
  const solid = (x: number, y: number): boolean =>
    y >= 0 && y < ROWS && x >= 0 && x < lvl.width && isSolidTile(lvl.grid[y][x]);
  const swimmable = (x: number): boolean => waterColumn(lvl.water, x) !== null;
  const isPit = (x: number): boolean => !solid(x, GROUND) && !swimmable(x);

  it.each(PACES)('ningún enemigo cae solo al vacío antes de cruzarse con el jugador (%s bloques/s)', (pace) => {
    const lost = SEEDS.flatMap((seed) => enemiesLostAt(def, pace, seed).map((e) => `${e} (semilla ${seed})`));
    expect(lost).toEqual([]);
  });

  it('ningún enemigo de suelo nace junto al aterrizaje de un hoyo', () => {
    const landings = Array.from({ length: lvl.width }, (_, x) => x).filter((x) => x > 0 && solid(x, GROUND) && isPit(x - 1));
    const ambushes = lvl.enemies
      .filter((e) => !isAirborne(e.id) && e.ty === GROUND - 1)
      .filter((e) => landings.some((l) => e.tx >= l && e.tx <= l + LANDING_CLEARANCE))
      .map((e) => `${e.id}@${e.tx}`);
    expect(ambushes).toEqual([]);
  });

  // Al reaparecer se pierde el chile y las sombras solo se disuelven con fuego.
  it('si quedan sombras tras el punto de control, hay chile al alcance al reaparecer', () => {
    const world = makeWorld(def, true);
    world.update(STEP);
    const shades = world.enemies.filter((e) => e.id === 'shade').map((e) => Math.floor(e.x / T));
    if (shades.length === 0) return;
    const firstShade = Math.min(...shades);
    const leftmost = Math.floor(world.camX / T);
    const fire = world.grid.some((row) => row.some((t, x) => t === 'F' && x >= leftmost && x < firstShade));
    expect(fire, `chile antes de la sombra en ${firstShade}`).toBe(true);
  });

  it('las plataformas de un mismo barranco comparten ritmo y miden al menos 3 bloques', () => {
    const overPit = lvl.platforms.filter((s) => s.kind === 'mover' && s.dy === 0 && isPit(s.x));
    for (const s of overPit) {
      if (s.kind !== 'mover') continue;
      expect(s.length, `plataforma en ${s.x}`).toBeGreaterThanOrEqual(MIN_BRIDGE_LENGTH);
      const r = platformReach(s);
      const partners = overPit.filter((o) => {
        const q = platformReach(o);
        return o !== s && q.x0 <= r.x1 + 1 && q.x1 >= r.x0 - 1;
      });
      for (const o of partners) if (o.kind === 'mover') expect(o.period, `relevo en ${s.x}-${o.x}`).toBe(s.period);
    }
  });
});

describe('Carrillo Puerto', () => {
  it('presenta el tren sobre agua navegable: el primer fallo no cuesta una vida', () => {
    const lvl = buildLevel(LEVEL_2_1);
    const first = lvl.platforms.find((s) => s.kind === 'train');
    expect(first).toBeDefined();
    const r = platformReach(first!);
    for (let x = r.x0; x <= r.x1; x++) {
      if (isSolidTile(lvl.grid[GROUND][x])) continue;
      expect(waterColumn(lvl.water, x), `barranco sin agua en ${x}`).not.toBeNull();
    }
  });
});

describe('Petenes', () => {
  it('el último tramo del túnel se remonta contra la marea sin agotar el oxígeno', () => {
    const world = makeWorld(LEVEL_2_4);
    const p = world.player;
    p.x = PETENES_COUNTER_X0 * T + 2;
    p.y = 10 * T;
    p.inv = Infinity;
    world.camX = p.x - 0.4 * VW;
    world.input.press('right');
    let elapsed = 0;
    while (p.x < PETENES_COUNTER_X1 * T && elapsed < PETENES_COUNTER_MAX_TIME) {
      world.update(STEP);
      elapsed += STEP;
    }
    expect(world.phase).toBe('play');
    expect(p.x).toBeGreaterThanOrEqual(PETENES_COUNTER_X1 * T);
    expect(p.oxygen).toBeGreaterThan(0);
  });
});
