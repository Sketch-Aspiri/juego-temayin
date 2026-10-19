import { describe, expect, it } from 'vitest';
import { GOAL_VIEW_WIDTH, GROUND, PLAYER_GRAVITY, ROWS, T, WIND_MAX_VX } from '../engine/constants';
import { isAirborne } from '../engine/entities/enemies';
import { HAMMOCK_BOUNCE } from '../engine/entities/hammocks';
import { platformReach } from '../engine/entities/platforms';
import { buildLevel } from '../engine/level/build';
import { waterAt, waterColumn } from '../engine/level/zones';
import { isSolidTile } from '../engine/tiles';
import { ALL_LEVELS, nextLevelId, PLAYABLE_LEVELS, WORLDS } from './worlds';

/** Salto en carrera: ~8 bloques de alcance horizontal; dejamos margen. */
const MAX_PLAIN_PIT = 6;
/** Un estromatolito debe quedar a más de estos bloques de un aterrizaje (orilla o borde de hoyo). */
const MIN_LANDING_GAP = 2;
/** Margen de seguridad: el tejado debe quedar al menos medio bloque por debajo del ápice del rebote. */
const HAMMOCK_SAFETY_MARGIN = T / 2;
/** Columnas a la derecha de una hamaca en las que un tejado se considera «su» destino. */
const HAMMOCK_NEAR_COLUMNS = 8;

describe('campaña', () => {
  it('los ids de nivel son únicos', () => {
    const ids = PLAYABLE_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada mundo tiene niveles y el orden es consecutivo', () => {
    for (const w of WORLDS) expect(w.levels.length).toBeGreaterThan(0);
    expect(nextLevelId(ALL_LEVELS[0].id)).toBe(ALL_LEVELS[1].id);
    expect(nextLevelId(ALL_LEVELS[ALL_LEVELS.length - 1].id)).toBeNull();
  });
});

describe.each(PLAYABLE_LEVELS.map((l) => [l.id, l] as const))('nivel %s', (_id, def) => {
  const lvl = buildLevel(def);
  const solid = (x: number, y: number): boolean => y >= 0 && y < ROWS && x >= 0 && x < lvl.width && isSolidTile(lvl.grid[y][x]);

  it('tiene la cuadrícula con el tamaño correcto', () => {
    expect(lvl.grid).toHaveLength(ROWS);
    for (const row of lvl.grid) expect(row).toHaveLength(def.width);
  });

  it('el viento no supera WIND_MAX_VX y queda dentro del nivel', () => {
    for (const w of lvl.winds) {
      expect(Math.abs(w.vx)).toBeLessThanOrEqual(WIND_MAX_VX);
      expect(w.x0).toBeGreaterThanOrEqual(0);
      expect(w.x1).toBeLessThan(def.width);
    }
  });

  // Estromatolitos (Bacalar): sobre suelo o lecho, lejos de inicio, checkpoint, meta y aterrizajes.
  it('los estromatolitos están sobre suelo y lejos de checkpoint, meta y aterrizajes', () => {
    const cp = def.checkpoint ?? Math.floor(def.width / 2);
    const protectedCols = [3, cp, lvl.flagX, lvl.templeX];
    const landings: number[] = [];
    for (const o of def.ops) if (o[0] === 'pit' || o[0] === 'water') landings.push(o[1] - 1, o[2] + 1);
    for (const s of lvl.stromatolites) {
      for (let tx = s.x; tx < s.x + s.len; tx++) {
        const supported = s.y === ROWS - 1 || solid(tx, s.y + 1);
        expect(supported, `estromatolito ${tx},${s.y} sin suelo`).toBe(true);
        expect(protectedCols, `estromatolito en columna protegida ${tx}`).not.toContain(tx);
        for (const l of landings) expect(Math.abs(tx - l), `estromatolito ${tx} junto al aterrizaje ${l}`).toBeGreaterThan(MIN_LANDING_GAP);
      }
    }
  });

  it('la meta y el templo están dentro del nivel y con suelo bajo la bandera', () => {
    expect(lvl.flagX).toBeLessThan(def.width);
    expect(lvl.templeX).toBeLessThan(def.width);
    // La pirámide completa cabe en el nivel, para que la cámara pueda encuadrarla.
    expect(lvl.templeX * T + GOAL_VIEW_WIDTH).toBeLessThanOrEqual(def.width * T);
    expect(solid(lvl.flagX, GROUND)).toBe(true);
  });

  // La bandera se activa al cruzar su columna sin importar la altura: lo que quede detrás no se puede recoger.
  it('no hay cacao (granos, cofres ni aros) después de la bandera', () => {
    // Organizar
    const beyond: string[] = [];
    // Actuar
    lvl.grid.forEach((row, ty) => row.forEach((c, tx) => {
      if ((c === 'o' || c === '?') && tx > lvl.flagX) beyond.push(`${tx},${ty}`);
    }));
    for (const h of lvl.hoops) if (h.x > lvl.flagX) beyond.push(`aro ${h.x},${h.y}`);
    // Comprobar
    expect(beyond, `cacao más allá de la bandera (columna ${lvl.flagX})`).toEqual([]);
  });

  // Un tejado cercano a una hamaca solo cuenta como alcanzable si el rebote llega a su altura.
  it('las plataformas junto a una hamaca quedan por debajo de la altura de su rebote', () => {
    // Organizar
    const apex = (HAMMOCK_BOUNCE * HAMMOCK_BOUNCE) / (2 * PLAYER_GRAVITY);
    const tooHigh: string[] = [];
    // Actuar
    for (const h of lvl.hammocks) {
      const right = (h.x + h.w) / T;
      for (const op of def.ops) {
        if (op[0] !== 'plat' || op[1] < right || op[1] > right + HAMMOCK_NEAR_COLUMNS) continue;
        const rise = h.y - op[2] * T;
        if (rise >= apex - HAMMOCK_SAFETY_MARGIN) tooHigh.push(`hamaca ${h.x / T} -> plataforma ${op[1]},${op[2]} (sube ${rise} px, rebote ${apex} px)`);
      }
    }
    // Comprobar
    expect(tooHigh).toEqual([]);
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

  it('el agua termina contra terreno sólido o continúa en otra zona de agua', () => {
    for (const z of lvl.water) {
      for (const x of [z.x0 - 1, z.x1 + 1]) {
        if (x < 0 || x >= def.width) continue;
        for (let y = Math.floor(z.surface); y < ROWS; y++) {
          const depth = Math.max(y * T, z.surface * T) + 1;
          const continues = waterAt(lvl.water, (x + 0.5) * T, depth) !== null;
          expect(solid(x, y) || continues, `agua sin orilla en ${x},${y}`).toBe(true);
        }
      }
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

  // Trenes, carretas y vagonetas ruedan sobre tierra: debajo hay vacío, no agua. Con agua
  // navegable el jugador podría nadar hasta la otra orilla sin subirse a la plataforma.
  it('los trenes, carretas y vagonetas cruzan vacío, no agua navegable', () => {
    const landPlatforms = lvl.platforms.filter(
      (s) => s.kind === 'train' || (s.appearance !== 'boat' && s.appearance !== 'turtle'),
    );
    for (const s of landPlatforms) {
      const r = platformReach(s);
      for (let x = r.x0; x <= r.x1; x++) {
        if (solid(x, GROUND)) continue;
        expect(swimmable(x), `agua bajo la plataforma de ${s.x} en la columna ${x}`).toBe(false);
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

  // Los aros del juego de pelota (op `hoop`) no son sólidos: la pelota debe poder atravesarlos.
  it('los aros están dentro del nivel, sobre el suelo y en bloques libres', () => {
    for (const h of lvl.hoops) {
      expect(h.x, `aro en ${h.x}`).toBeGreaterThanOrEqual(0);
      expect(h.x, `aro en ${h.x}`).toBeLessThan(def.width);
      expect(h.y, `aro en ${h.x}`).toBeLessThan(GROUND);
      expect(solid(h.x, h.y), `aro en ${h.x},${h.y}`).toBe(false);
    }
  });

  it('la resina y el sargazo descansan sobre suelo firme y en hueco libre', () => {
    for (const z of lvl.slowZones) {
      for (let x = z.x0; x <= z.x1; x++) {
        expect(solid(x, z.y + 1), `${z.kind} sin suelo en ${x}`).toBe(true);
        expect(solid(x, z.y), `${z.kind} dentro de un bloque en ${x}`).toBe(false);
      }
    }
  });

  it('cuenta monedas para calcular las estrellas', () => {
    expect(lvl.totalCoins).toBeGreaterThan(0);
  });
});
