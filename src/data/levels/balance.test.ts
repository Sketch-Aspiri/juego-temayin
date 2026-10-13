import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../engine/audio';
import { GROUND, ROWS, START_LIVES, STEP, T, VW } from '../../engine/constants';
import { isAirborne, updateEnemies } from '../../engine/entities/enemies';
import { NOTICE_RANGE } from '../../engine/entities/enemies/nauyaca';
import { platformReach, type MoverSpec } from '../../engine/entities/platforms';
import type { Enemy } from '../../engine/entities/types';
import { Input } from '../../engine/input';
import { buildLevel, type BuiltLevel } from '../../engine/level/build';
import type { LevelDef } from '../../engine/level/types';
import { waterColumn } from '../../engine/level/zones';
import { isSolidTile } from '../../engine/tiles';
import { World } from '../../engine/World';
import { WORLDS } from '../worlds';
import { LEVEL_2_1 } from './world2/2-1-carrillo-puerto';
import { LEVEL_2_4 } from './world2/2-4-petenes';

/**
 * Equilibrio de los Mundos 1 y 2: reglas de justicia que no dependen del gusto,
 * comprobadas con el motor real y sin DOM.
 */
const BALANCED_WORLDS = 2;
const BALANCED = WORLDS.filter((w) => w.number <= BALANCED_WORLDS).flatMap((w) => w.levels);

/** Ritmos de avance del jugador (bloques/s): cauteloso, normal y rápido. */
const PACES = [2.5, 4, 7] as const;
/**
 * Semillas del azar: cada enemigo nace con un reloj aleatorio (`createEnemy`) que
 * desfasa saltos y pinzas, y con ello los choques entre enemigos.
 */
const SEEDS = [1, 7, 42, 1234] as const;
/** Columnas tras un aterrizaje en las que no debe nacer un enemigo de suelo. */
const LANDING_CLEARANCE = 2;
/** La nauyaca ataca en cuanto el jugador entra en su alcance de aviso: esa es su distancia mínima. */
const NAUYACA_CLEARANCE = NOTICE_RANGE / T;
/** Filas sobre el suelo desde las que un enemigo puede emboscar un aterrizaje (orillas incluidas). */
const AMBUSH_ROWS = 3;
/** Largo mínimo de una plataforma móvil sobre un barranco (sin saltos de píxel exacto). */
const MIN_BRIDGE_LENGTH = 3;
/** Tramo del túnel de Petenes con la marea en contra (columnas) y tiempo máximo para remontarlo. */
const PETENES_COUNTER_X0 = 156;
const PETENES_COUNTER_X1 = 164;
const PETENES_COUNTER_MAX_TIME = 6;
/** Fila (bloques) a la que nada el jugador dentro del túnel de Petenes. */
const PETENES_SWIM_ROW = 10;
/** La cámara deja al jugador al 40 % del ancho de la pantalla (`World.update`). */
const CAMERA_LEAD = 0.4;
/** Rango de un entero de 32 bits sin signo: lleva la salida de mulberry32 a [0, 1). */
const UINT32_RANGE = 2 ** 32;

function makeWorld(def: LevelDef, fromCheckpoint = false): World {
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({ def, input: new Input(), audio, session: { score: 0, coins: 0, lives: START_LIVES }, fromCheckpoint });
}

/** Generador pseudoaleatorio reproducible (mulberry32, con sus constantes originales) para sustituir a `Math.random`. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/** Ejecuta `run` con el azar de los enemigos fijado por `seed`. */
function withSeed<R>(seed: number, run: () => R): R {
  const random = vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
  try {
    return run();
  } finally {
    random.mockRestore();
  }
}

/**
 * Avanza la cámara al ritmo dado con un jugador invulnerable a ras de suelo; solo se
 * actualizan los enemigos. Se detiene cuando `done` devuelve true.
 */
function sweep(world: World, pace: number, done: () => boolean, onStep: () => void = () => {}): void {
  const p = world.player;
  while (!done()) {
    world.camX += pace * T * STEP;
    p.x = world.camX + CAMERA_LEAD * VW - p.w / 2;
    p.y = GROUND * T - p.h;
    p.vy = 0;
    p.inv = Infinity;
    updateEnemies(world, STEP);
    onStep();
  }
}

/**
 * Enemigos que desaparecen (caen al vacío) sin haber llegado nunca hasta el jugador:
 * ese enemigo solo existe para quien juega deprisa.
 */
function enemiesLost(def: LevelDef, pace: number): string[] {
  const world = makeWorld(def);
  const spawnX = new Map(world.enemies.map((e) => [e, e.x] as const));
  const settled = new Set<Enemy>();
  const lost: string[] = [];
  const p = world.player;
  sweep(world, pace, () => world.camX >= def.width * T - VW, () => {
    for (const e of world.enemies) {
      if (settled.has(e)) continue;
      if (e.x <= p.x + p.w) settled.add(e);
      else if (!e.alive && !e.dead) {
        settled.add(e);
        lost.push(`${e.id}@${Math.round((spawnX.get(e) ?? e.x) / T)}`);
      }
    }
  });
  return lost;
}

/** Enemigos dentro de la arena del jefe cuando el jugador entra y el jefe despierta. */
function enemiesInArena(def: LevelDef, pace: number): string[] {
  if (!def.boss) return [];
  const [a0, a1] = def.boss.arena;
  const world = makeWorld(def);
  sweep(world, pace, () => world.player.x >= (a0 + 1) * T);
  return world.enemies
    .filter((e) => e.alive && !e.dead && e.x + e.w > a0 * T && e.x < (a1 + 1) * T)
    .map((e) => `${e.id}@${(e.x / T).toFixed(1)}`);
}

type ColumnTest = (x: number) => boolean;

/** Terreno de un nivel construido: bloque sólido, columna con agua navegable y hoyo sin agua. */
function terrainOf(lvl: BuiltLevel): { solid: (x: number, y: number) => boolean; swimmable: ColumnTest; isPit: ColumnTest } {
  const solid = (x: number, y: number): boolean =>
    y >= 0 && y < ROWS && x >= 0 && x < lvl.width && isSolidTile(lvl.grid[y][x]);
  const swimmable = (x: number): boolean => waterColumn(lvl.water, x) !== null;
  const isPit = (x: number): boolean => !solid(x, GROUND) && !swimmable(x);
  return { solid, swimmable, isPit };
}

/**
 * Columnas donde se pisa tierra: la primera con suelo tras un hoyo y la columna `x1 + 1`
 * de cada zona de agua si es suelo (la orilla de salida). No incluye los peldaños
 * siguientes de una orilla escalonada ni las plataformas altas.
 */
function landingsOf(lvl: BuiltLevel): number[] {
  const { solid, swimmable, isPit } = terrainOf(lvl);
  const landings = new Set<number>();
  for (let x = 1; x < lvl.width; x++) if (solid(x, GROUND) && isPit(x - 1)) landings.add(x);
  for (const z of lvl.water) if (solid(z.x1 + 1, GROUND) && !swimmable(z.x1 + 1)) landings.add(z.x1 + 1);
  return [...landings];
}

/** Enemigos de suelo que nacen al alcance de un aterrizaje (la nauyaca, dentro de su aviso). */
function ambushesOf(lvl: BuiltLevel): string[] {
  const landings = landingsOf(lvl);
  return lvl.enemies
    .filter((e) => !isAirborne(e.id) && e.ty >= GROUND - AMBUSH_ROWS)
    .filter((e) => {
      const reach = e.id === 'nauyaca' ? NAUYACA_CLEARANCE : LANDING_CLEARANCE;
      return landings.some((l) => e.tx >= l && e.tx - l <= reach);
    })
    .map((e) => `${e.id}@${e.tx},${e.ty}`);
}

/** Plataformas genéricas horizontales que cruzan un barranco. */
function bridgesOf(lvl: BuiltLevel): MoverSpec[] {
  const { isPit } = terrainOf(lvl);
  return lvl.platforms.filter((s): s is MoverSpec => s.kind === 'mover' && s.dy === 0 && isPit(s.x));
}

/** Plataformas que se relevan con `s`: sus recorridos se solapan o se tocan. */
function relayPartners(s: MoverSpec, bridges: readonly MoverSpec[]): MoverSpec[] {
  const r = platformReach(s);
  return bridges.filter((o) => {
    const q = platformReach(o);
    return o !== s && q.x0 <= r.x1 + 1 && q.x1 >= r.x0 - 1;
  });
}

/** Al reaparecer: primera sombra por delante sin un bloque `F` al alcance antes de ella (o `null`). */
function shadeWithoutFire(def: LevelDef): number | null {
  const world = makeWorld(def, true);
  world.update(STEP);
  const shades = world.enemies.filter((e) => e.id === 'shade').map((e) => Math.floor(e.x / T));
  // Todas las sombras quedan antes del punto de control: nada que comprobar.
  if (shades.length === 0) return null;
  const firstShade = Math.min(...shades);
  const leftmost = Math.floor(world.camX / T);
  const fire = world.grid.some((row) => row.some((t, x) => t === 'F' && x >= leftmost && x < firstShade));
  return fire ? null : firstShade;
}

describe.each(BALANCED.map((l) => [l.id, l] as const))('equilibrio del nivel %s', (_id, def) => {
  const lvl = buildLevel(def);
  const hasShades = lvl.enemies.some((e) => e.id === 'shade');

  it('tiene un consejo de Toh', () => {
    expect(def.hint?.trim()).toBeTruthy();
  });

  it.each(PACES)('ningún enemigo cae solo al vacío antes de cruzarse con el jugador (%s bloques/s)', (pace) => {
    const lost = SEEDS.flatMap((seed) => withSeed(seed, () => enemiesLost(def, pace)).map((e) => `${e} (semilla ${seed})`));
    expect(lost).toEqual([]);
  });

  // Se aterriza al otro lado de un hoyo o al salir del agua por su orilla (ver `landingsOf`).
  it('ningún enemigo de suelo acecha junto a un aterrizaje', () => {
    expect(ambushesOf(lvl)).toEqual([]);
  });

  it.runIf(!!def.boss)('ningún enemigo entra en la arena del jefe antes de que despierte', () => {
    const inside = PACES.flatMap((pace) => SEEDS.flatMap((seed) => withSeed(seed, () => enemiesInArena(def, pace))));
    expect(inside).toEqual([]);
  });

  // Al reaparecer se pierde el chile y las sombras solo se disuelven con fuego.
  it.runIf(hasShades)('si quedan sombras tras el punto de control, hay chile al alcance al reaparecer', () => {
    expect(withSeed(SEEDS[0], () => shadeWithoutFire(def))).toBeNull();
  });

  it.runIf(bridgesOf(lvl).length > 0)('las plataformas de un mismo barranco comparten ritmo y miden al menos 3 bloques', () => {
    const bridges = bridgesOf(lvl);
    for (const s of bridges) {
      expect(s.length, `plataforma en ${s.x}`).toBeGreaterThanOrEqual(MIN_BRIDGE_LENGTH);
      for (const o of relayPartners(s, bridges)) expect(o.period, `relevo en ${s.x}-${o.x}`).toBe(s.period);
    }
  });
});

describe('Carrillo Puerto', () => {
  it('presenta el tren sobre agua navegable: el primer fallo no cuesta una vida', () => {
    const lvl = buildLevel(LEVEL_2_1);
    const first = lvl.platforms.find((s) => s.kind === 'train');
    if (!first) throw new Error('Carrillo Puerto no tiene trenes');
    const r = platformReach(first);
    for (let x = r.x0; x <= r.x1; x++) {
      if (isSolidTile(lvl.grid[GROUND][x])) continue;
      expect(waterColumn(lvl.water, x), `barranco sin agua en ${x}`).not.toBeNull();
    }
  });
});

describe('Petenes', () => {
  it('el último tramo del túnel se remonta contra la marea sin agotar el oxígeno', () => {
    withSeed(SEEDS[0], () => {
      const world = makeWorld(LEVEL_2_4);
      const p = world.player;
      p.x = PETENES_COUNTER_X0 * T + 2;
      p.y = PETENES_SWIM_ROW * T;
      p.inv = Infinity;
      world.camX = p.x - CAMERA_LEAD * VW;
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
});
