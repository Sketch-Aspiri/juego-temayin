import { describe, expect, it } from 'vitest';
import { GOAL_VIEW_WIDTH, GROUND, ROWS, T } from '../engine/constants';
import { isAirborne } from '../engine/entities/enemies';
import { platformReach } from '../engine/entities/platforms';
import { buildLevel } from '../engine/level/build';
import { waterColumn } from '../engine/level/zones';
import { isSolidTile } from '../engine/tiles';
import { ALL_LEVELS, nextLevelId, WORLDS } from './worlds';

/** Salto en carrera: ~8 bloques de alcance horizontal; dejamos margen. */
const MAX_PLAIN_PIT = 6;

describe('campaña', () => {
  it('los ids de nivel son únicos', () => {
    const ids = ALL_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada mundo tiene niveles y el orden es consecutivo', () => {
    for (const w of WORLDS) expect(w.levels.length).toBeGreaterThan(0);
    expect(nextLevelId(ALL_LEVELS[0].id)).toBe(ALL_LEVELS[1].id);
    expect(nextLevelId(ALL_LEVELS[ALL_LEVELS.length - 1].id)).toBeNull();
  });
});

describe.each(ALL_LEVELS.map((l) => [l.id, l] as const))('nivel %s', (_id, def) => {
  const lvl = buildLevel(def);
  const solid = (x: number, y: number): boolean => y >= 0 && y < ROWS && x >= 0 && x < lvl.width && isSolidTile(lvl.grid[y][x]);

  it('tiene la cuadrícula con el tamaño correcto', () => {
    expect(lvl.grid).toHaveLength(ROWS);
    for (const row of lvl.grid) expect(row).toHaveLength(def.width);
  });

  it('la meta y el templo están dentro del nivel y con suelo bajo la bandera', () => {
    expect(lvl.flagX).toBeLessThan(def.width);
    expect(lvl.templeX).toBeLessThan(def.width);
    // La pirámide completa cabe en el nivel, para que la cámara pueda encuadrarla.
    expect(lvl.templeX * T + GOAL_VIEW_WIDTH).toBeLessThanOrEqual(def.width * T);
    expect(solid(lvl.flagX, GROUND)).toBe(true);
  });

  it('el punto de inicio y el punto de control tienen suelo', () => {
    expect(solid(3, GROUND)).toBe(true);
    const cp = def.checkpoint ?? Math.floor(def.width / 2);
    let x = cp;
    while (x < def.width && !solid(x, GROUND)) x++;
    expect(x).toBeLessThan(lvl.flagX);
  });

  // Un hoyo cubierto de agua navegable (op `water`) se cruza a nado: no cuenta como hoyo.
  const swimmable = (x: number): boolean => {
    const z = waterColumn(lvl.water, x);
    return z !== null && z.surface < ROWS;
  };

  /**
   * Los hoyos anchos deben ofrecer plataformas para cruzarlos. Si no hay bloques
   * encima, deben cruzarse con plataformas móviles (§5.4): se marca cada columna que
   * alguna plataforma alcanza en su recorrido y ningún tramo sin cubrir puede ser
   * más ancho que un hoyo normal.
   */
  const expectMovingBridge = (x0: number, x1: number): void => {
    let gap = 0;
    let longest = 0;
    for (let px = x0; px <= x1; px++) {
      const covered = lvl.platforms.some((s) => {
        const r = platformReach(s);
        return px >= r.x0 && px <= r.x1;
      });
      gap = covered ? 0 : gap + 1;
      longest = Math.max(longest, gap);
    }
    expect(longest, `hoyo ancho en ${x0}-${x1}`).toBeLessThanOrEqual(MAX_PLAIN_PIT);
  };

  it('las plataformas móviles están dentro del nivel y a una altura útil', () => {
    for (const s of lvl.platforms) {
      const r = platformReach(s);
      expect(r.x0).toBeGreaterThanOrEqual(0);
      expect(r.x1).toBeLessThan(def.width);
      const yMin = s.kind === 'mover' ? s.y + Math.min(0, s.dy) : s.y;
      const yMax = s.kind === 'mover' ? s.y + Math.max(0, s.dy) : s.y;
      expect(yMin, `plataforma en ${s.x}`).toBeGreaterThanOrEqual(1);
      expect(yMax, `plataforma en ${s.x}`).toBeLessThan(GROUND);
    }
  });

  it('ningún hoyo es imposible de cruzar', () => {
    let start = -1;
    for (let x = 0; x <= def.width; x++) {
      const isPit = x < def.width && !solid(x, GROUND) && !swimmable(x);
      if (isPit && start < 0) start = x;
      if (!isPit && start >= 0) {
        const width = x - start;
        if (width > MAX_PLAIN_PIT) {
          let platforms = 0;
          for (let px = start; px < x; px++) for (let y = 0; y < GROUND; y++) if (solid(px, y)) platforms++;
          if (platforms === 0) expectMovingBridge(start, x - 1);
        }
        start = -1;
      }
    }
  });

  it('los enemigos no nacen dentro de bloques sólidos', () => {
    for (const e of lvl.enemies) expect(solid(e.tx, e.ty), `${e.id} en ${e.tx},${e.ty}`).toBe(false);
  });

  it('los enemigos terrestres tienen suelo debajo', () => {
    for (const e of lvl.enemies.filter((s) => !isAirborne(s.id))) {
      expect(solid(e.tx, e.ty + 1), `${e.id} en ${e.tx}`).toBe(true);
    }
  });

  it('el jefe (si existe) tiene arena y muro de salida', () => {
    if (!def.boss) return;
    const [a0, a1] = def.boss.arena;
    expect(a0).toBeLessThan(a1);
    expect(solid(a1 + 1, 0)).toBe(true);
    expect(def.boss.x).toBeGreaterThanOrEqual(a0);
    expect(def.boss.x).toBeLessThanOrEqual(a1);
  });

  // El escombro (op `crumble`) cuenta como plataforma al validar hoyos, pero es
  // temporal: nunca puede sustituir al suelo (meta, inicio y checkpoint lo exigen fijo).
  it('el escombro que se derrumba queda por encima del suelo', () => {
    for (const c of lvl.crumbles) expect(c.y, `escombro en ${c.x}`).toBeLessThan(GROUND);
  });

  it('cuenta monedas para calcular las estrellas', () => {
    expect(lvl.totalCoins).toBeGreaterThan(0);
  });
});
