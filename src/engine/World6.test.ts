import { describe, expect, it } from 'vitest';
import { getLevel } from '../data/worlds';
import type { LevelDef } from './level/types';
import { AudioEngine } from './audio';
import { GROUND, OXYGEN_MAX, START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

function make(def: LevelDef | undefined, fromCheckpoint = false): World {
  if (!def) throw Error('Falta el nivel');
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({ def, input: new Input(), audio, fromCheckpoint, session: { score: 0, coins: 0, lives: START_LIVES } });
}

const MAX_SECONDS = 160;
/** Separación (px) a la que el piloto automático mira por delante: huecos justo al borde, cajas con más margen. */
const HOLE_LOOKAHEAD = 14;
const BOX_LOOKAHEAD = 44;
/** Piloto automático de 6-2: camina (saltos de ~5 bloques, sin pasarse de un hueco al siguiente) y salta ante huecos o cajas. */
function drive(world: World, goal: (w: World) => boolean): void {
  const p = world.player;
  world.input.press('right');
  for (let t = 0; t < MAX_SECONDS && world.phase === 'play' && !goal(world); t += STEP) {
    const hole = !world.solid(Math.floor((p.x + p.w + HOLE_LOOKAHEAD) / T), GROUND);
    const box = world.solid(Math.floor((p.x + p.w + BOX_LOOKAHEAD) / T), GROUND - 1);
    // Se mantiene pulsado en el aire: soltar antes recorta el salto.
    if (p.onGround) {
      world.input.release('jump');
      if (hole || box) world.input.press('jump');
    }
    p.inv = Infinity; // aislamos el recorrido de los enemigos: aquí se prueba el techo del tren
    world.update(STEP);
  }
}

describe('Tulum Aeropuerto (6-2)', () => {
  const def = getLevel('6-2');

  it('avanza la cámara sola a la velocidad del autoScroll', () => {
    const w = make(def);
    const x0 = w.camX;
    for (let t = 0; t < 2; t += STEP) w.update(STEP);
    expect(w.camX - x0).toBeCloseTo(2 * (def?.autoScroll ?? 0) * T, -1);
  });

  it('se recorre desde el inicio hasta el punto de control y la meta sin aplastamiento', () => {
    const w = make(def);
    drive(w, (x) => x.checkpointReached);
    expect(w.phase).toBe('play');
    expect(w.checkpointReached).toBe(true);
    drive(w, (x) => x.phase !== 'play');
    expect(w.phase).toBe('flag');
    expect(w.session.lives).toBe(START_LIVES);
  });

  it('reaparece en el punto de control sobre un vagón y llega a la meta', () => {
    const w = make(def, true);
    expect(w.solid(Math.floor(w.player.x / T), GROUND)).toBe(true);
    drive(w, (x) => x.phase !== 'play');
    expect(w.phase).toBe('flag');
  });

  it('quedarse quieto ante una caja de ventilación arrastra a Temayin y lo aplasta (tras un aviso de sobra)', () => {
    const w = make(def);
    const box = def?.ops.find((o) => o[0] === 'col')?.[1] ?? 0; // primera caja de ventilación
    const warning = (box * T - w.player.x) / ((def?.autoScroll ?? 0) * T); // el borde tarda en llegar a ella
    expect(warning).toBeGreaterThan(2);
    w.player.x = (box - 1) * T - w.player.w; // pegado a la caja
    w.camX = w.player.x - 1;
    for (let t = 0; t < 2 && w.phase === 'play'; t += STEP) w.update(STEP);
    expect(w.phase).toBe('dying');
  });
});

/** Ritmo horizontal (px/s) al caminar y al correr. */
const WALK_SPEED = 260;
const RUN_SPEED = 400;
const SWEEP_STEP_PX = 4;
const AIR_LIMIT = 2;

/** Salta con el botón mantenido desde `x` (px, borde izquierdo) y devuelve el borde derecho al volver a tocar suelo. */
function jumpLanding(w: World, x: number, run: boolean): number {
  const p = w.player;
  w.enemies = [];
  p.x = x;
  p.y = GROUND * T - p.h;
  p.onGround = true;
  p.vx = run ? RUN_SPEED : WALK_SPEED;
  p.inv = Infinity;
  w.camX = x - 300;
  w.input.press('right');
  if (run) w.input.press('run');
  w.input.press('jump');
  let airborne = false;
  for (let t = 0; t < AIR_LIMIT && w.phase === 'play'; t += STEP) {
    w.update(STEP);
    airborne = airborne || !p.onGround;
    if (airborne && p.onGround) break;
  }
  return w.phase === 'play' ? p.x + p.w : Infinity;
}

describe('Tulum Aeropuerto (6-2): una caja nunca lanza al hueco', () => {
  const def = getLevel('6-2');
  const boxes = (def?.ops ?? []).filter((o) => o[0] === 'col');
  const pitStarts = (def?.ops ?? []).filter((o) => o[0] === 'pit').map((o) => o[1]).sort((a, b) => a - b);

  it.each(boxes.map((o) => [o[1], o[2]] as const))('la caja %i (alto %i): saltarla caminando o corriendo aterriza antes del enganche', (col) => {
    const pit = pitStarts.find((x) => x > col) ?? Infinity;
    for (const run of [false, true]) {
      for (let x = (col - 3) * T; x <= col * T - 36 - 6; x += SWEEP_STEP_PX) {
        const right = jumpLanding(make(def), x, run);
        expect(right, `${run ? 'corriendo' : 'caminando'} desde ${x} px`).toBeLessThanOrEqual(pit * T);
      }
    }
  });
});

describe('Tulum (6-1): la térmica alarga el salto', () => {
  const FALL_STEPS = Math.ceil(4 / STEP);
  const LAUNCH_DELAYS = Array.from({ length: 12 }, (_, i) => i);
  const EDGE_COL = 53;
  const FAR_COL = 64;
  const MESA_ROW = 9;

  function jumpFromEdge(thermal: boolean, delay: number): World {
    const base = getLevel('6-1');
    if (!base) throw Error('Falta 6-1');
    const def = thermal ? base : { ...base, ops: base.ops.filter((o) => o[0] !== 'wind') };
    const w = make(def);
    w.enemies = [];
    const p = w.player;
    p.x = (EDGE_COL + 1) * T - p.w - 1;
    p.y = MESA_ROW * T - p.h;
    p.onGround = true;
    p.vx = 400;
    w.camX = p.x - 300;
    w.input.press('right');
    w.input.press('run');
    for (let s = 0; s < FALL_STEPS && w.phase === 'play' && !(p.onGround && p.x > FAR_COL * T); s++) {
      if (s === delay) w.input.press('jump');
      w.update(STEP);
    }
    return w;
  }

  it('sin térmica el salto en carrera no cruza la grieta de 10 bloques (ni con la ventaja del coyote)', () => {
    for (const delay of LAUNCH_DELAYS) {
      const w = jumpFromEdge(false, delay);
      expect(w.player.x, `salto tras ${delay} pasos`).toBeLessThan(FAR_COL * T);
    }
  });

  it('con térmica el mismo salto aterriza en la meseta de enfrente', () => {
    const w = jumpFromEdge(true, 0);
    expect(w.phase).toBe('play');
    expect(w.player.onGround).toBe(true);
    expect(w.player.x).toBeGreaterThanOrEqual(FAR_COL * T);
    expect(w.player.y + w.player.h).toBeCloseTo(MESA_ROW * T, 0);
  });

  it('la alternativa justa: las losas del fondo se encadenan con huecos de 1 a 2 bloques', () => {
    const { grid } = make(getLevel('6-1')).level;
    const GAP_X0 = 54;
    const GAP_X1 = 63;
    const MAX_SLAB_GAP = 2;
    const solidCols = Array.from({ length: GAP_X1 - GAP_X0 + 1 }, (_, i) => GAP_X0 + i)
      .filter((x) => grid.some((row, y) => y < GROUND && row[x] === 'X'));
    expect(solidCols.length).toBeGreaterThan(0);
    const holes = [GAP_X0 - 1, ...solidCols, GAP_X1 + 1].map((x, i, a) => (i ? x - a[i - 1] - 1 : 0));
    for (const h of holes) expect(h).toBeLessThanOrEqual(MAX_SLAB_GAP);
  });
});

describe('Limones (6-4): el foso largo se cruza con saltos normales', () => {
  const PIT_X0 = 140;
  const PIT_X1 = 149;
  /** Distancias (px) a las que el piloto ve el hueco y salta: de justo al borde a un poco antes. */
  const LOOKAHEADS = [2, 14, 26, 38];
  const RUN_UP_COLS = 10;

  function cross(lookahead: number, run: boolean): World {
    const w = make(getLevel('6-4'));
    w.enemies = [];
    const p = w.player;
    p.x = (PIT_X0 - RUN_UP_COLS) * T;
    p.y = GROUND * T - p.h;
    p.onGround = true;
    p.inv = Infinity;
    w.camX = p.x - 300;
    w.input.press('right');
    if (run) w.input.press('run');
    for (let t = 0; t < MAX_SECONDS && w.phase === 'play' && p.x < (PIT_X1 + 2) * T; t += STEP) {
      const below = Math.floor((p.y + p.h + 1) / T);
      const hole = !w.solid(Math.floor((p.x + p.w + lookahead) / T), below);
      // Mantener pulsado en el aire: soltar antes recortaría el salto.
      if (p.onGround) {
        w.input.release('jump');
        if (hole) w.input.press('jump');
      }
      w.update(STEP);
    }
    return w;
  }

  it.each([false, true])('cruza el foso con saltos normales (corriendo: %s) salte donde salte', (run) => {
    for (const lookahead of LOOKAHEADS) {
      const w = cross(lookahead, run);
      expect(w.phase, `visión ${lookahead} px`).toBe('play');
      expect(w.player.x, `visión ${lookahead} px`).toBeGreaterThanOrEqual((PIT_X1 + 1) * T);
    }
  });
});

describe('Felipe Carrillo Puerto (6-3): todo cenote tiene salida natural', () => {
  /** Margen (px) de la cabeza de Temayin respecto al nivel del agua para dar otra brazada. */
  const STROKE_DEPTH = 20;

  it.each([0, 1, 2, 3])('nadando a la derecha por la superficie del cenote %i se sale a la orilla sin quedar atrapado', (zone) => {
    const w = make(getLevel('6-3'));
    w.enemies = [];
    const z = w.level.water[zone];
    const p = w.player;
    p.x = (z.x0 + 1) * T;
    p.y = z.surface * T;
    p.inv = Infinity;
    w.camX = p.x - 300;
    w.input.press('right');
    for (let t = 0; t < MAX_SECONDS && w.phase === 'play' && !(p.onGround && p.x > (z.x1 + 1) * T); t += STEP) {
      if (p.y + p.h > z.surface * T + STROKE_DEPTH + p.h / 2) w.input.press('jump');
      else w.input.release('jump');
      w.update(STEP);
    }
    expect(w.phase).toBe('play');
    expect(p.onGround && p.x > (z.x1 + 1) * T).toBe(true);
  });
});

describe('Bacalar (6-5): cruce a nado', () => {
  /** Nada de un extremo al otro de la zona de agua `zone` sin tocar el lecho ni dañar ningún estromatolito. */
  function swim(zone: number, feetLimitRow: number): World {
    const w = make(getLevel('6-5'));
    w.enemies = [];
    const z = w.level.water[zone];
    const p = w.player;
    p.x = (z.x0 + 1) * T;
    p.y = z.surface * T;
    w.camX = p.x - 300;
    w.input.press('right');
    let elapsed = 0;
    while (p.x < z.x1 * T && w.phase === 'play' && elapsed < MAX_SECONDS) {
      // Brazada cada vez que los pies bajan del nivel de seguridad (por encima de los estromatolitos).
      if (p.y + p.h > feetLimitRow * T) w.input.press('jump');
      else w.input.release('jump');
      w.update(STEP);
      elapsed += STEP;
    }
    return w;
  }

  it.each([[0, 11.8], [1, 10.9]])('la laguna %i se cruza por encima de los estromatolitos sin dañar ningún tramo', (zone, limit) => {
    const w = swim(zone, limit);
    expect(w.phase).toBe('play');
    expect(w.player.x).toBeGreaterThanOrEqual(w.level.water[zone].x1 * T);
    expect(w.player.oxygen).toBeGreaterThan(0);
    expect(w.stromatolites.length).toBeGreaterThan(0);
    expect(w.stromatolites.every((s) => !s.damaged)).toBe(true);
  });

  it('pisar un estromatolito resta puntos pero nunca quita una vida', () => {
    const w = make(getLevel('6-5'));
    w.enemies = [];
    w.session.score = 1000;
    const s = w.level.stromatolites[0];
    const p = w.player;
    p.x = (s.x + 1) * T;
    p.y = s.y * T - p.h - 2;
    w.camX = p.x - 300;
    for (let t = 0; t < 3 && w.phase === 'play'; t += STEP) w.update(STEP);
    expect(w.stromatolites.some((m) => m.damaged)).toBe(true);
    expect(w.session.score).toBeLessThan(1000);
    expect(w.session.lives).toBe(START_LIVES);
    expect(w.phase).toBe('play');
  });

  it('el checkpoint es suelo seco con aire completo', () => {
    const w = make(getLevel('6-5'), true);
    expect(w.player.oxygen).toBe(OXYGEN_MAX);
    expect(w.level.water.some((z) => w.player.x / T >= z.x0 && w.player.x / T <= z.x1)).toBe(false);
  });
});
