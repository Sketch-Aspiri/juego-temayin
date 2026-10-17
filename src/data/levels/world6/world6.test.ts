import { describe, expect, it } from 'vitest';
import { GROUND, OXYGEN_MAX, ROWS, SWIM_MAX_SPEED, T, WIND_MAX_VX } from '../../../engine/constants';
import { isAirborne } from '../../../engine/entities/enemies';
import { moverProgress, platformReach, type MoverSpec } from '../../../engine/entities/platforms';
import { buildLevel } from '../../../engine/level/build';
import type { LevelDef } from '../../../engine/level/types';
import { isSolidTile } from '../../../engine/tiles';
import { WORLDS } from '../../worlds';

const world6 = WORLDS.find((w) => w.number === 6);
const levels = world6?.levels ?? [];
const byId = (id: string): LevelDef => {
  const def = levels.find((l) => l.id === id);
  if (!def) throw Error(`Falta ${id}`);
  return def;
};

/** Distancia máxima (bloques) entre una luciérnaga y un borde de hoyo o un enemigo. */
const FIREFLY_REACH = 3;
/** Un enemigo volador también debe tener la luciérnaga a esta altura como máximo (filas). */
const FIREFLY_REACH_ROWS = 4;
const MAX_PLAIN_PIT = 6;
const MIN_HITCH = 2;
const MAX_HITCH = 3;
/** Altura máxima (bloques) de una caja sobre el techo del tren: se salta. */
const MAX_BOX_HEIGHT = 2;
/** Fila de la cabeza de Temayin sobre el techo: nada sólido ahí, o el borde de pantalla lo aplastaría. */
const HEAD_ROW = GROUND - 3;
/** Tramos sin aire permitidos (AGENTS.md §5.1). */
const MAX_AIRLESS_BLOCKS = 15;
/** Ráfaga horizontal máxima de diseño (bloques/s). */
const MAX_GUST = 2;
/** Filas libres sobre la superficie en la salida de un cenote (cabeza + salto de salida). */
const EXIT_HEADROOM = 3;
/** Hueco máximo (px) entre una barca y su muelle para saltar con comodidad (2,5 bloques). */
const COMFORT_GAP = 100;
/** Segundos seguidos que debe durar ese hueco cómodo en cada extremo del vaivén. */
const MIN_BOAT_WINDOW = 1.2;
const BOAT_SAMPLE = 0.01;
/** Bloques de agua libres sobre la cima de un estromatolito para pasar nadando. */
const MIN_WATER_ABOVE = 2;

describe('Mundo 6: registro', () => {
  it('se llama Costa Maya y Bacalar y empieza en 6-1', () => {
    expect(world6?.id).toBe('costa-maya-bacalar');
    expect(world6?.name).toBe('Costa Maya y Bacalar');
    expect(levels.map((l) => l.id)).toEqual(['6-1', '6-2', '6-3', '6-4', '6-5', '6-6']);
  });

  it.each(levels.map((l) => [l.id, l] as const))('%s tiene consejo de Toh y cacao', (_id, def) => {
    expect(def.hint?.trim()).toBeTruthy();
    expect(buildLevel(def).totalCoins).toBeGreaterThan(0);
  });

  it('usa los temas del mundo', () => {
    expect(levels.map((l) => l.theme)).toEqual(['cliff', 'jungleTrain', 'jungle', 'jungleNight', 'lagoon', 'bay']);
  });
});

describe('Tulum (6-1)', () => {
  const lvl = buildLevel(byId('6-1'));

  it('tiene térmicas y ráfagas de 2 bloques/s como máximo', () => {
    expect(lvl.winds.some((w) => w.vy < 0)).toBe(true);
    const gusts = lvl.winds.filter((w) => w.vx !== 0);
    expect(gusts.length).toBeGreaterThan(0);
    for (const w of gusts) expect(Math.abs(w.vx)).toBeLessThanOrEqual(Math.min(MAX_GUST, WIND_MAX_VX));
  });

  it('sube desde la fila 10 hasta la fila 4 (de pie en la fila 3)', () => {
    const topOf = (x: number): number => lvl.grid.findIndex((row) => isSolidTile(row[x]));
    expect(topOf(25)).toBe(10);
    expect(topOf(40)).toBe(4);
  });
});

describe('Tulum Aeropuerto (6-2)', () => {
  const def = byId('6-2');
  const lvl = buildLevel(def);

  it('empuja la cámara a unos 3 bloques/s', () => {
    expect(def.autoScroll).toBeGreaterThanOrEqual(2.5);
    expect(def.autoScroll).toBeLessThanOrEqual(3.5);
  });

  it('los huecos de enganche miden de 2 a 3 bloques (y siempre se saltan)', () => {
    let run = 0;
    const hitches: number[] = [];
    for (let x = 0; x <= def.width; x++) {
      const open = x < def.width && !isSolidTile(lvl.grid[GROUND][x]);
      if (open) run++;
      else if (run > 0) {
        hitches.push(run);
        run = 0;
      }
    }
    expect(hitches.length).toBeGreaterThan(5);
    for (const h of hitches) {
      expect(h).toBeGreaterThanOrEqual(MIN_HITCH);
      expect(h).toBeLessThanOrEqual(MAX_HITCH);
      expect(h).toBeLessThanOrEqual(MAX_PLAIN_PIT);
    }
  });

  it('ningún muro cierra el paso: cajas de 2 bloques como máximo y nada a la altura de la cabeza', () => {
    for (let x = 0; x < def.width; x++) {
      let height = 0;
      while (isSolidTile(lvl.grid[GROUND - 1 - height]?.[x] ?? ' ')) height++;
      expect(height, `caja alta en ${x}`).toBeLessThanOrEqual(MAX_BOX_HEIGHT);
      expect(isSolidTile(lvl.grid[HEAD_ROW][x]), `bloque a la altura de la cabeza en ${x}`).toBe(false);
    }
  });

  it('no hay agua: caer entre vagones es caer a las vías', () => {
    expect(lvl.water).toHaveLength(0);
  });
});

describe('Felipe Carrillo Puerto (6-3)', () => {
  const def = byId('6-3');
  const lvl = buildLevel(def);

  it('llueve y tiene cenotes de superficie abierta, sin tramos largos sin aire', () => {
    expect(def.weather).toBe('rain');
    expect(lvl.water.length).toBeGreaterThanOrEqual(3);
    for (const z of lvl.water) {
      const open = Array.from({ length: z.x1 - z.x0 + 1 }, (_, i) => z.x0 + i)
        .every((x) => !isSolidTile(lvl.grid[Math.floor(z.surface) - 1]?.[x] ?? ' '));
      expect(open, `cenote ${z.x0}-${z.x1} con techo`).toBe(true);
      expect(z.x1 - z.x0 + 1, `cenote ${z.x0}-${z.x1}`).toBeLessThanOrEqual(MAX_AIRLESS_BLOCKS);
    }
  });

  it('los cenotes anchos tienen ramas que permiten cruzarlos sin nadar', () => {
    for (const z of lvl.water.filter((w) => w.x1 - w.x0 + 1 > MAX_PLAIN_PIT)) {
      const branches = lvl.grid.slice(0, GROUND).some((row) => row.slice(z.x0, z.x1 + 1).some((c) => c === 'X'));
      expect(branches, `cenote ${z.x0}-${z.x1} sin ramas`).toBe(true);
    }
  });

  it('ninguna rama cubre las dos últimas columnas del cenote ni la orilla de salida', () => {
    for (const z of lvl.water) {
      const surface = Math.floor(z.surface);
      for (let x = z.x1 - 1; x <= z.x1 + 1; x++) {
        for (let y = surface - EXIT_HEADROOM; y < surface; y++) {
          expect(isSolidTile(lvl.grid[y][x]), `bloque en ${x},${y} sobre la salida del cenote ${z.x0}-${z.x1}`).toBe(false);
        }
      }
      // La orilla llega a ras del agua o como mucho un peldaño por encima: se sale con una brazada.
      expect(isSolidTile(lvl.grid[surface][z.x1 + 1]), `orilla del cenote ${z.x0}-${z.x1}`).toBe(true);
    }
  });

  it('presenta alux, xtabay y hormigas', () => {
    expect(new Set(lvl.enemies.map((e) => e.id))).toEqual(new Set(['alux', 'xtabay', 'ants']));
  });
});

describe('Limones (6-4)', () => {
  const def = byId('6-4');
  const lvl = buildLevel(def);
  const fireflies = lvl.fireflies.map((f) => ({ x: f.x / T - 0.5, y: f.y / T - 0.5 }));
  const near = (x: number, y: number, rows: number): boolean =>
    fireflies.some((f) => Math.abs(f.x - x) <= FIREFLY_REACH && Math.abs(f.y - y) <= rows);

  it('está a oscuras y tiene luciérnagas', () => {
    expect(def.darkness).toBeDefined();
    expect(fireflies.length).toBeGreaterThan(10);
  });

  it('hay una luciérnaga a 3 bloques o menos de cada borde de hoyo', () => {
    const pits = def.ops.filter((o) => o[0] === 'pit');
    expect(pits.length).toBeGreaterThanOrEqual(5);
    for (const o of pits) {
      expect(near(o[1], GROUND - 3, FIREFLY_REACH_ROWS), `borde izquierdo de ${o[1]}-${o[2]}`).toBe(true);
      expect(near(o[2], GROUND - 3, FIREFLY_REACH_ROWS), `borde derecho de ${o[1]}-${o[2]}`).toBe(true);
    }
  });

  it('hay una luciérnaga junto a cada enemigo', () => {
    expect(lvl.enemies.length).toBeGreaterThan(8);
    for (const e of lvl.enemies) {
      expect(near(e.tx, e.ty, FIREFLY_REACH_ROWS), `${e.id} en ${e.tx},${e.ty}`).toBe(true);
    }
  });

  it('el punto de control está iluminado', () => {
    expect(near(def.checkpoint ?? 0, GROUND - 3, FIREFLY_REACH_ROWS)).toBe(true);
  });

  it('solo hay tarántulas, nauyacas y murciélagos, y los de suelo tienen suelo debajo', () => {
    expect(new Set(lvl.enemies.map((e) => e.id))).toEqual(new Set(['tarantula', 'nauyaca', 'bat']));
    for (const e of lvl.enemies.filter((s) => !isAirborne(s.id))) expect(isSolidTile(lvl.grid[e.ty + 1][e.tx])).toBe(true);
  });
});

describe('Chetumal (6-6)', () => {
  const def = byId('6-6');
  const lvl = buildLevel(def);
  const [a0, a1] = def.boss?.arena ?? [0, 0];
  const MIN_ARENA = 20;
  const REFUGE_ROW = 8;
  /** Fila de la cubierta de muelles y barcas (superficie del agua menos uno). */
  const BOAT_ROW = 9;

  it('es el nivel del jefe Lorencillo con arena de unos 22 bloques y muro de salida', () => {
    expect(def.boss?.id).toBe('lorencillo');
    expect(a1 - a0 + 1).toBeGreaterThanOrEqual(MIN_ARENA);
    expect(isSolidTile(lvl.grid[0][a1 + 1])).toBe(true);
    expect(def.time).toBe(400);
    expect(def.offering).toBeDefined();
  });

  it('deja libre la fila sobre el suelo en toda la arena (aparecen los cangrejos del mástil)', () => {
    for (let x = a0; x <= a1; x++) expect(isSolidTile(lvl.grid[GROUND - 1][x]), `bloque en ${x}`).toBe(false);
  });

  it('tiene al menos dos cofas de refugio en la fila 8 dentro de la arena y ningún enemigo', () => {
    const cofas = def.ops.filter((o) => o[0] === 'plat' && o[2] === REFUGE_ROW && o[1] >= a0 && o[1] + o[3] - 1 <= a1);
    expect(cofas.length).toBeGreaterThanOrEqual(2);
    expect(lvl.enemies.filter((e) => e.tx >= a0 && e.tx <= a1 + 1)).toEqual([]);
  });

  it('cruza el agua en barcas y tiene el checkpoint seco fuera de la arena', () => {
    expect(lvl.platforms.filter((s) => s.kind === 'mover' && s.appearance === 'boat').length).toBeGreaterThanOrEqual(4);
    const cp = def.checkpoint ?? 0;
    expect(cp).toBeLessThan(a0 - 1);
    expect(lvl.water.some((z) => cp >= z.x0 && cp <= z.x1)).toBe(false);
    expect(isSolidTile(lvl.grid[GROUND][cp])).toBe(true);
  });

  describe('barcas de los canales', () => {
    const boats = lvl.platforms.filter((s): s is MoverSpec => s.kind === 'mover' && s.appearance === 'boat');
    const quays = def.ops.flatMap((o) =>
      o[0] === 'plat' && o[2] === BOAT_ROW ? [{ left: o[1] * T, right: (o[1] + o[3]) * T }] : []);

    /** Mayor tramo continuo (s) con el hueco entre 0 y COMFORT_GAP, a lo largo de tres ciclos. */
    const longestWindow = (period: number, gap: (k: number) => number): number => {
      let best = 0;
      let run = 0;
      for (let t = 0; t < 3 * period; t += BOAT_SAMPLE) {
        const g = gap(moverProgress(t, period));
        run = g >= 0 && g <= COMFORT_GAP ? run + BOAT_SAMPLE : 0;
        best = Math.max(best, run);
      }
      return best;
    };

    it('cada barca va y viene entre dos muelles fijos, sin depender de otra barca', () => {
      expect(boats.length).toBeGreaterThanOrEqual(4);
      for (const b of boats) {
        const reach = platformReach(b);
        expect(quays.some((q) => q.right <= reach.x0 * T), `muelle a la izquierda de la barca en ${b.x}`).toBe(true);
        expect(quays.some((q) => q.left >= (reach.x1 + 1) * T), `muelle a la derecha de la barca en ${b.x}`).toBe(true);
        for (const o of boats.filter((c) => c !== b)) {
          const r = platformReach(o);
          expect(r.x1 < reach.x0 || r.x0 > reach.x1, `las barcas en ${b.x} y ${o.x} comparten recorrido`).toBe(true);
        }
      }
    });

    it('en cada extremo del vaivén hay una ventana cómoda (hueco de 100 px o menos) de más de 1,2 s', () => {
      for (const b of boats) {
        const reach = platformReach(b);
        const left = Math.max(...quays.filter((q) => q.right <= reach.x0 * T).map((q) => q.right));
        const right = Math.min(...quays.filter((q) => q.left >= (reach.x1 + 1) * T).map((q) => q.left));
        const edgeL = (k: number): number => (b.x + b.dx * k) * T - left;
        const edgeR = (k: number): number => right - (b.x + b.length + b.dx * k) * T;
        expect(longestWindow(b.period, edgeL), `salida desde el muelle de la barca en ${b.x}`).toBeGreaterThanOrEqual(MIN_BOAT_WINDOW);
        expect(longestWindow(b.period, edgeR), `llegada al muelle de la barca en ${b.x}`).toBeGreaterThanOrEqual(MIN_BOAT_WINDOW);
      }
    });
  });

  it('el consejo de Toh deja claro que Lorencillo es ficción en Chetumal', () => {
    expect(def.hint).toContain('Chetumal');
    expect(def.hint).toContain('cuento');
  });
});

describe('Bacalar (6-5)', () => {
  const def = byId('6-5');
  const lvl = buildLevel(def);

  it('tiene estromatolitos en el lecho de cada laguna, bajo el agua', () => {
    expect(lvl.water).toHaveLength(2);
    for (const z of lvl.water) {
      const inside = lvl.stromatolites.filter((s) => s.x >= z.x0 && s.x + s.len - 1 <= z.x1);
      expect(inside.length, `laguna ${z.x0}-${z.x1}`).toBeGreaterThanOrEqual(2);
      for (const s of inside) expect(s.y, `estromatolito ${s.x}`).toBeGreaterThan(z.surface + 1);
    }
  });

  it('deja agua suficiente sobre los estromatolitos para pasar nadando', () => {
    for (const z of lvl.water) {
      for (const s of lvl.stromatolites.filter((m) => m.x >= z.x0 && m.x <= z.x1)) {
        for (let x = s.x; x < s.x + s.len; x++) {
          let top = s.y;
          while (top > 0 && isSolidTile(lvl.grid[top - 1][x])) top--;
          expect(top - Math.floor(z.surface), `columna ${x}`).toBeGreaterThanOrEqual(MIN_WATER_ABOVE);
        }
      }
    }
  });

  it('cada laguna se cruza en pocos segundos, con burbujas y superficie abierta', () => {
    for (const z of lvl.water) {
      expect(((z.x1 - z.x0 + 1) * T) / SWIM_MAX_SPEED).toBeLessThan(OXYGEN_MAX * 2);
      expect(lvl.bubbles.filter((b) => b.x >= z.x0 && b.x <= z.x1).length).toBeGreaterThanOrEqual(2);
      expect(isSolidTile(lvl.grid[Math.floor(z.surface) - 1]?.[z.x0 + 1] ?? ' ')).toBe(false);
    }
  });

  it('los estromatolitos siempre tienen suelo o lecho debajo', () => {
    for (const s of lvl.stromatolites) {
      for (let x = s.x; x < s.x + s.len; x++) expect(s.y === ROWS - 1 || isSolidTile(lvl.grid[s.y + 1][x])).toBe(true);
    }
  });
});
