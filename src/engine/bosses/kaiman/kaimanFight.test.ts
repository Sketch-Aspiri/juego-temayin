import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { GROUND, START_LIVES, STEP, T } from '../../constants';
import { type MovingPlatform, updatePlatforms } from '../../entities/platforms';
import { Input } from '../../input';
import { overlap } from '../../physics';
import { makeRng } from '../../rng';
import { World } from '../../World';
import { waveRect } from './attacks';
import { mudRect, propaguleRect } from './hazards';
import { Kaiman, type KaimanState } from './index';
import * as K from './tuning';

/**
 * Pelea real contra Kaimán Moreleti en 2-7 Calkiní con `World.update` completo:
 * colisiones, agua (y su crecida), troncos a la deriva y el orden real
 * jugador → plataformas → jefe.
 *  (a) Con la arena crecida (fase 2) el lomo expuesto se debe poder pisar.
 *  (b) Ningún tronco de la arena es un refugio permanente.
 */

const silent = new AudioEngine();
silent.muted = true;

/** Semilla del azar visual (salpicaduras, polvo, temblor); el jefe ya usa su propio `makeRng`. */
const VISUAL_SEED = 0x5eed;
/** Columna donde espera el jugador mientras termina la presentación. */
const WAIT_COL = 68;
/** Columnas cubiertas por los troncos fijos de la fila 9 (64-66 y 78-80). */
const LOW_LOG_COLS: readonly number[] = [64, 65, 66, 78, 79, 80];
const ARENA_COLS: readonly number[] = Array.from({ length: 22 }, (_, i) => 62 + i);
/** Columnas de la arena sin tronco fijo encima. */
const OPEN_COLS = ARENA_COLS.filter((c) => !LOW_LOG_COLS.includes(c));
/** Esperas (s) antes de la emboscada: cambian dónde flotan los troncos a la deriva al emerger. */
const AMBUSH_DELAYS: readonly number[] = [0, 0.7, 1.4, 2.1, 2.8];
/** Segundos que se observa a un jugador sobre cada tronco. */
const WATCH_TIME = 120;
/**
 * Máximo de segundos seguidos sin recibir daño para no considerarse refugio. Medido con un
 * jugador quieto: en el suelo de la arena el hueco más largo es de ~7 s; en los troncos fijos
 * de la fila 9, de ~14 s.
 */
const MAX_SAFE_GAP = 20;
/** Tiempo máximo para intentar bajar a Kaimán a la fase 2 con chile desde el tronco alto. */
const FIRE_WATCH_TIME = 300;
/** Desde el tronco alto el fuego cae a ~250 px: solo se dispara si el jefe no está justo debajo. */
const FIRE_MIN_DIST = 150;

interface Fight { readonly world: World; readonly boss: Kaiman; readonly input: Input }
interface Hit { readonly t: number; readonly cause: string }

function enter(boss: Kaiman, st: KaimanState): void {
  boss.st = st;
  boss.t = 0;
}

/** Nivel real con el jugador dentro de la arena; devuelve la pelea tras la presentación. */
function startFight(): Fight {
  const def = getLevel('2-7');
  if (!def) throw new Error('falta el nivel 2-7');
  const input = new Input();
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input, audio: silent });
  const boss = world.boss;
  if (!(boss instanceof Kaiman)) throw new Error('el jefe de 2-7 debe ser el Kaimán');
  world.timeLeft = 1e6; // el reloj del nivel no interviene en estas mediciones
  world.enemies = []; // los enemigos del camino quedan fuera de la arena cerrada
  const p = world.player;
  p.x = WAIT_COL * T;
  p.y = GROUND * T - p.h;
  for (let t = 0; t < 10 && boss.st !== 'walk'; t += STEP) {
    p.inv = 10;
    world.update(STEP);
  }
  return { world, boss, input };
}

/** Pasa a la fase pedida con el cambio real: dos bolas de fuego en las fauces abiertas. */
function toPhase(f: Fight, phase: K.KaimanPhase): void {
  const { world, boss } = f;
  for (const next of [2, 3] as const) {
    if (next > phase) return;
    boss.hp = (next === 2 ? K.PHASE2_HP : K.PHASE3_HP) + 1;
    enter(boss, 'gape');
    for (let i = 0; i < K.FIRE_HITS_PER_HP; i++) boss.onFireball(world);
    for (let t = 0; t < 6 && boss.st !== 'walk'; t += STEP) {
      world.player.inv = 10;
      world.update(STEP);
    }
  }
}

const driftLog = (world: World, index: number): MovingPlatform =>
  world.platforms[world.platforms.length - K.DRIFT_LOGS.length + index];

/**
 * Jugador quieto en la columna `col`: Kaimán se sumerge, emerge bajo él y queda expuesto;
 * entonces salta en vertical (manteniendo el salto). Devuelve '' si lo pisó o el motivo.
 */
function ambushThenLeap(f: Fight, col: number, delay: number): string {
  const { world, boss, input } = f;
  const p = world.player;
  const px = col * T + (T - p.w) / 2;
  const pin = (): void => {
    p.inv = 10; // la emersión no lo lanza: queda dentro de la caja, bajo el lomo
    p.x = px;
    p.vx = 0;
  };
  for (let t = 0; t < delay; t += STEP) { pin(); world.update(STEP); }
  boss.lastAttack = 'bite';
  (boss as unknown as { sinceDive: number }).sinceDive = K.MAX_ATTACKS_WITHOUT_DIVE;
  enter(boss, 'walk');
  for (let t = 0; t < 8 && boss.st !== 'exposed'; t += STEP) { pin(); world.update(STEP); }
  if (boss.st !== 'exposed') return `no quedó expuesto (${boss.st})`;
  const hp = boss.hp;
  let bonked = false;
  input.press('jump');
  for (let t = 0; t < 1.6 && boss.hp === hp; t += STEP) {
    const rising = p.vy < 0;
    world.update(STEP);
    if (rising && p.vy === 0 && !p.onGround) bonked = true;
  }
  input.release('jump');
  if (boss.hp < hp) return '';
  const feet = (p.y + p.h).toFixed(0);
  if (world.platforms.some((m) => m.rider)) return `apoyado en un tronco a la deriva (pies y=${feet}, lomo y=${boss.y}, vy=${p.vy})`;
  if (bonked) return `la cabeza choca con el tronco fijo (pies nunca por encima de y=${boss.y})`;
  return `sin pisotón (pies y=${feet}, vy=${p.vy.toFixed(0)})`;
}

function ambushFailures(phase: K.KaimanPhase, cols: readonly number[]): string[] {
  const out: string[] = [];
  for (const col of cols) {
    for (const delay of AMBUSH_DELAYS) {
      const f = startFight();
      toPhase(f, phase);
      const why = ambushThenLeap(f, col, delay);
      if (why) out.push(`col ${col} · espera ${delay} s → ${why}`);
    }
  }
  return out;
}

/** Qué alcanzó al jugador en el momento del golpe. */
function hurtCause(world: World, boss: Kaiman): string {
  const p = world.player;
  if (boss.waves.some((w) => overlap(p, waveRect(w)))) return 'ola';
  if (boss.mud.some((b) => overlap(p, mudRect(b)))) return 'lodo';
  if (boss.propagules.some((s) => overlap(p, propaguleRect(s)))) return 'propágulo';
  if (overlap(p, boss)) return `cuerpo (${boss.st})`;
  return 'otro';
}

/** Registra cada golpe real; el escudo se repone para que el jugador siga en su sitio. */
function recordHits(f: Fight, clock: () => number): Hit[] {
  const { world, boss } = f;
  const p = world.player;
  const hits: Hit[] = [];
  const realHurt = world.hurt.bind(world);
  world.hurt = () => {
    if (p.inv <= 0 && world.phase === 'play') hits.push({ t: clock(), cause: hurtCause(world, boss) });
    p.shield = true;
    realHurt();
  };
  return hits;
}

function longestSafeGap(hits: readonly Hit[], total: number): number {
  const times = [0, ...hits.map((h) => h.t), total];
  return Math.max(...times.slice(1).map((t, i) => t - times[i]));
}

function describeHits(hits: readonly Hit[], total: number): string {
  const causes: Record<string, number> = {};
  for (const h of hits) causes[h.cause] = (causes[h.cause] ?? 0) + 1;
  const first = hits.length ? `${hits[0].t.toFixed(1)} s` : 'nunca';
  return `${hits.length} golpes en ${total} s; primero: ${first}; hueco máx. ${longestSafeGap(hits, total).toFixed(1)} s; ${JSON.stringify(causes)}`;
}

type Spot =
  | { readonly kind: 'tile'; readonly col: number; readonly row: number }
  | { readonly kind: 'drift'; readonly index: number };

/** Fila del tronco alto del chile (70-72): hoy es un refugio sin daño (fallo conocido). */
const HIGH_LOG_ROW = 6;
const LOGS: readonly { readonly name: string; readonly spot: Spot }[] = [
  { name: 'tronco fijo izquierdo (64-66, fila 9)', spot: { kind: 'tile', col: 65, row: 9 } },
  { name: 'tronco fijo derecho (78-80, fila 9)', spot: { kind: 'tile', col: 79, row: 9 } },
  { name: 'tronco alto del chile (70-72, fila 6)', spot: { kind: 'tile', col: 71, row: 6 } },
  { name: 'tronco a la deriva 1', spot: { kind: 'drift', index: 0 } },
  { name: 'tronco a la deriva 2', spot: { kind: 'drift', index: 1 } },
];

/** Jugador quieto sobre un tronco durante `seconds`: si un golpe lo empuja, vuelve a su sitio. */
function watchStill(f: Fight, spot: Spot, seconds: number): Hit[] {
  const { world } = f;
  const p = world.player;
  let t = 0;
  const hits = recordHits(f, () => t);
  const log = spot.kind === 'drift' ? driftLog(world, spot.index) : null;
  const place = (): void => {
    p.x = log ? log.x + log.w / 2 - p.w / 2 : (spot.kind === 'tile' ? spot.col : 0) * T + (T - p.w) / 2;
    p.y = (log ? log.y : (spot.kind === 'tile' ? spot.row : 0) * T) - p.h;
    p.vx = 0;
    p.vy = 0;
  };
  place();
  p.inv = 0;
  for (; t < seconds; t += STEP) {
    const before = hits.length;
    world.update(STEP);
    if (!log) place();
    else if (hits.length > before || Math.abs(p.y + p.h - log.y) > 1) place();
  }
  return hits;
}

describe('Kaimán en 2-7 · pelea con el World real', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockImplementation(makeRng(VISUAL_SEED));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('(a) pisotón al lomo expuesto', () => {
    it('en la fase 1, tras emerger bajo el jugador, un salto vertical lo pisa en toda columna sin tronco fijo', () => {
      expect(ambushFailures(1, OPEN_COLS)).toEqual([]);
    });

    it('en la fase 2 (agua crecida), tras emerger bajo el jugador, un salto vertical lo pisa en toda columna sin tronco fijo', () => {
      expect(ambushFailures(2, OPEN_COLS)).toEqual([]);
    });

    it('en la fase 3 (frenesí), tras emerger bajo el jugador, un salto vertical lo pisa en toda columna sin tronco fijo', () => {
      expect(ambushFailures(3, OPEN_COLS)).toEqual([]);
    });

    it('en la fase 2, caer desde cualquier altura sobre el lomo por donde flota un tronco a la deriva le quita 1 PV', () => {
      // Organizar: el tronco 1 en su origen (columnas 67-68) y el lomo expuesto centrado bajo él.
      const f = startFight();
      toPhase(f, 2);
      const { world, boss } = f;
      const p = world.player;
      const log = driftLog(world, 0);
      const misses: string[] = [];
      for (let feet = 300; feet < 400; feet += 9) {
        log.t = 0;
        updatePlatforms([log], world.camX, 0);
        for (const m of world.platforms) m.rider = false;
        boss.hp = K.PHASE2_HP;
        enter(boss, 'exposed');
        boss.x = log.x + log.w / 2 - boss.w / 2;
        p.x = log.x + log.w / 2 - p.w / 2;
        p.y = feet - p.h;
        p.vx = 0;
        p.vy = 0;
        p.inv = 10;
        // Actuar: cae en vertical sobre el lomo.
        for (let t = 0; t < 1 && boss.hp === K.PHASE2_HP; t += STEP) world.update(STEP);
        if (boss.hp === K.PHASE2_HP) {
          misses.push(`desde pies y=${feet}: quedó con pies en y=${(p.y + p.h).toFixed(0)}, vy=${p.vy} (lomo y=${boss.y}, tronco y=${log.y})`);
        }
      }
      // Comprobar
      expect(misses).toEqual([]);
    });

    // Fallo conocido, pendiente de arreglo (ver informe de cazabugs): pasar a `it` al corregirlo.
    it.fails('tras emerger bajo un jugador que está bajo un tronco fijo de la fila 9, un salto vertical pisa el lomo', () => {
      expect(ambushFailures(1, LOW_LOG_COLS)).toEqual([]);
    });
  });

  describe('(b) ningún tronco es un refugio permanente', () => {
    const cases = ([1, 2, 3] as const).flatMap((phase) =>
      LOGS.filter((l) => phase > 1 || l.spot.kind === 'tile').map((l) => ({ phase, name: l.name, spot: l.spot })),
    );

    const stillTitle = `fase $phase · $name: un jugador quieto recibe daño al menos cada ${MAX_SAFE_GAP} s`;
    const stillCheck = ({ phase, spot }: (typeof cases)[number]): void => {
      const f = startFight();
      toPhase(f, phase);
      const hits = watchStill(f, spot, WATCH_TIME);
      expect(longestSafeGap(hits, WATCH_TIME), describeHits(hits, WATCH_TIME)).toBeLessThanOrEqual(MAX_SAFE_GAP);
    };
    const isHighLog = (c: (typeof cases)[number]): boolean => c.spot.kind === 'tile' && c.spot.row === HIGH_LOG_ROW;
    it.each(cases.filter((c) => !isHighLog(c)))(stillTitle, stillCheck);
    // Fallo conocido, pendiente de arreglo: el tronco alto es un refugio. Pasar a `it.each` al corregirlo.
    it.fails.each(cases.filter(isHighLog))(stillTitle, stillCheck);

    // Fallo conocido, pendiente de arreglo (ver informe de cazabugs): pasar a `it` al corregirlo.
    it.fails.each([2, 3] as const)('fase %i · tronco alto: un paso lateral para esquivar los propágulos no basta para quedarse a salvo', (phase) => {
      const f = startFight();
      toPhase(f, phase);
      const { world, boss, input } = f;
      const p = world.player;
      let t = 0;
      const hits = recordHits(f, () => t);
      const [left, right] = [70 * T + 2, 73 * T - p.w - 2];
      p.x = 71 * T + 2;
      p.y = 6 * T - p.h;
      p.vy = 0;
      p.inv = 0;
      let goal: number | null = null;
      for (; t < WATCH_TIME; t += STEP) {
        const marked = boss.propagules.some((s) => s.stuck === null && s.x > p.x - 20 && s.x < p.x + p.w + 20);
        if (marked && goal === null) goal = p.x - left > right - p.x ? left : right;
        if (goal !== null && Math.abs(p.x - goal) < 6) goal = null;
        input.release('left');
        input.release('right');
        if (goal !== null) input.press(goal < p.x ? 'left' : 'right');
        world.update(STEP);
      }
      expect(longestSafeGap(hits, WATCH_TIME), describeHits(hits, WATCH_TIME)).toBeLessThanOrEqual(MAX_SAFE_GAP);
    });

    // Fallo conocido, pendiente de arreglo (ver informe de cazabugs): pasar a `it` al corregirlo.
    it.fails('fase 1 · tronco alto: quien dispara chile a las fauces desde ahí recibe algún daño antes de llegar a la fase 2', () => {
      // Organizar: chile ya tomado del bloque F (71, 2), quieto en el centro del tronco alto.
      const f = startFight();
      const { world, boss, input } = f;
      const p = world.player;
      let t = 0;
      const hits = recordHits(f, () => t);
      p.fire = true;
      p.inv = 0;
      let held = false;
      // Actuar: se gira hacia el jefe y dispara solo con las fauces abiertas y el jefe a distancia.
      for (; t < FIRE_WATCH_TIME && boss.phase === 1; t += STEP) {
        p.x = 71 * T + (T - p.w) / 2;
        p.y = 6 * T - p.h;
        p.vx = 0;
        p.vy = 0;
        p.face = boss.x + boss.w / 2 < p.x + p.w / 2 ? -1 : 1;
        const far = Math.abs(boss.x + boss.w / 2 - (p.x + p.w / 2)) > FIRE_MIN_DIST;
        if (held) input.release('fire');
        else if (boss.jawsOpen && far && world.fireballs.length < 2) input.press('fire');
        held = !held && boss.jawsOpen && far && world.fireballs.length < 2;
        world.update(STEP);
      }
      // Comprobar
      const report = `PV ${boss.hp}/${K.KAIMAN_HP}, fase ${boss.phase} a los ${t.toFixed(0)} s; ${describeHits(hits, Math.round(t))}`;
      expect(hits.length, report).toBeGreaterThan(0);
    });
  });
});
