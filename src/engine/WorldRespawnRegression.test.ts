import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_4_5 } from '../data/levels/world4/4-5-nuevo-xcan';
import { AudioEngine } from './audio';
import { START_LIVES, STEP, T } from './constants';
import type { Enemy } from './entities/types';
import { Input } from './input';
import type { LevelDef } from './level/types';
import { World } from './World';

/**
 * Regresiones del arreglo de reaparición (SAFE_RESPAWN_GAP + desactivación en lugar de
 * eliminación): enemigos del tramo anterior al checkpoint que ahora existen al reaparecer.
 */

/** Ritmo de avance del jugador hacia la arena (bloques/s), el mismo «normal» de `balance.test.ts`. */
const WALK_PACE = 4;
/** Segundos quieto en el checkpoint tras reaparecer antes de ir hacia la arena. */
const IDLE_SECONDS = 14;
/** Semilla con la que un murciélago de `bats([16, 6], [40, 5])` llega a la arena (también falla con 42). */
const SEED = 7;
const MAX_WALK_STEPS = Math.ceil(60 / STEP);
/** Rango de un entero de 32 bits sin signo (salida de mulberry32 a [0, 1)). */
const UINT32_RANGE = 2 ** 32;

/** mulberry32: fija el reloj aleatorio de `createEnemy` para que la prueba sea reproducible. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function respawn(def: LevelDef): World {
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({ def, input: new Input(), audio, fromCheckpoint: true, session: { score: 0, coins: 0, lives: START_LIVES } });
}

/** Enemigos vivos del tramo anterior al checkpoint cuyo cuerpo queda dentro de la arena. */
function behindInArena(world: World, behind: ReadonlySet<Enemy>, a0: number, a1: number): string[] {
  return world.enemies
    .filter(e => behind.has(e) && e.alive && !e.dead && e.x + e.w > a0 * T && e.x < (a1 + 1) * T)
    .map(e => `${e.id}@${(e.x / T).toFixed(1)}`);
}

afterEach(() => vi.restoreAllMocks());

describe('regresiones de la reaparición con enemigos conservados', () => {
  it('en 4-5, ningún enemigo de detrás del checkpoint queda encerrado en la arena de Huay Pek al reaparecer', () => {
    // Organizar: reaparición en el checkpoint (50) con el azar fijado; contacto protegido.
    vi.spyOn(Math, 'random').mockImplementation(seeded(SEED));
    const world = respawn(LEVEL_4_5);
    const [a0, a1] = LEVEL_4_5.boss!.arena;
    const p = world.player;
    const behind = new Set(world.enemies.filter(e => e.x < p.x));
    world.hurt = () => {};

    // Actuar: espera quieto en el checkpoint y luego avanza hasta que el jefe cierra la arena.
    for (let i = 0; i < IDLE_SECONDS / STEP; i++) world.update(STEP);
    for (let i = 0; i < MAX_WALK_STEPS && !world.boss!.lockCamera; i++) {
      p.x += WALK_PACE * T * STEP;
      world.update(STEP);
    }

    // Comprobar: la arena se cerró sin enemigos del tramo anterior dentro
    // (antes del arreglo no existían al reaparecer; balance.test.ts exige arena limpia al despertar).
    expect(world.boss!.lockCamera).toBe(true);
    expect(behindInArena(world, behind, a0, a1)).toEqual([]);
  });
});
