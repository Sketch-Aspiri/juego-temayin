import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_LEVELS } from '../data/worlds';
import { migrateV2Progress, V2_TO_V3_LEVEL_IDS } from './migrations';
import { LEGACY_KEY, loadSaved, STORAGE_KEY } from './persistence';
import { EMPTY_PROGRESS, isUnlocked, sanitizeProgress } from './progress';
import { EMPTY_WALLET } from './wallet';
import { DEFAULT_SETTINGS } from './settings';

const rec = (bestScore: number) => ({ bestScore, stars: 2, completions: 1 });

/** Progreso v2 de un jugador que completó toda la campaña antigua. */
const V2_FULL = {
  levels: { '1-1': rec(100), '1-2': rec(200), '1-3': rec(300), '2-1': rec(400), '2-2': rec(500) },
};

describe('migrateV2Progress', () => {
  it('migra cada id v2 a su id v3 conservando el récord', () => {
    const out = migrateV2Progress(V2_FULL) as { levels: Record<string, unknown> };
    expect(out.levels).toEqual({
      '1-1': rec(100),
      '5-3': rec(200),
      '1-6': rec(300),
      '4-3': rec(400),
      '4-2': rec(500),
    });
  });

  it('todos los ids v3 de destino existen en la campaña', () => {
    const ids = new Set(ALL_LEVELS.map((l) => l.id));
    for (const v3 of Object.values(V2_TO_V3_LEVEL_IDS)) expect(ids.has(v3), v3).toBe(true);
  });

  it('no muta la entrada y descarta ids desconocidos', () => {
    const raw = { levels: { '1-3': rec(1), fantasma: rec(2) } };
    const copy = structuredClone(raw);
    const out = migrateV2Progress(raw) as { levels: Record<string, unknown> };
    expect(raw).toEqual(copy);
    expect(Object.keys(out.levels)).toEqual(['1-6']);
  });

  it('los datos corruptos siguen produciendo progreso vacío', () => {
    for (const bad of ['basura', null, 42, { levels: 'x' }, []]) {
      expect(sanitizeProgress(migrateV2Progress(bad))).toEqual(EMPTY_PROGRESS);
    }
  });

  it('un nivel migrado sigue desbloqueado aunque el anterior no esté completado', () => {
    const p = sanitizeProgress(migrateV2Progress(V2_FULL));
    expect(isUnlocked(p, '1-6')).toBe(true);
    expect(isUnlocked(p, '4-2')).toBe(true);
    expect(isUnlocked(p, '5-3')).toBe(true);
    // La cadena continúa desde el primer nivel nuevo.
    expect(isUnlocked(p, '1-2')).toBe(true);
    expect(isUnlocked(p, '1-3')).toBe(false);
  });
});

describe('loadSaved con migración', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sin datos devuelve el estado vacío', () => {
    expect(loadSaved()).toEqual({ progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS, wallet: EMPTY_WALLET });
  });

  it('migra la clave v2, guarda en v3 y conserva la v2', () => {
    const settings = { volume: 0.3, muted: true, touchControls: 'on', introSeen: true };
    store.set(LEGACY_KEY, JSON.stringify({ progress: V2_FULL, settings }));
    const state = loadSaved();
    expect(state.progress.levels['1-6']).toEqual(rec(300));
    expect(state.progress.levels['1-3']).toBeUndefined();
    expect(state.settings).toEqual(settings);
    expect(JSON.parse(store.get(STORAGE_KEY) ?? 'null')).toEqual(state);
    expect(store.has(LEGACY_KEY)).toBe(true);
  });

  it('los datos v3 nunca se vuelven a migrar', () => {
    const v3 = { progress: { levels: { '1-3': rec(77) } }, settings: DEFAULT_SETTINGS };
    store.set(STORAGE_KEY, JSON.stringify(v3));
    store.set(LEGACY_KEY, JSON.stringify({ progress: V2_FULL, settings: DEFAULT_SETTINGS }));
    const state = loadSaved();
    expect(state.progress.levels).toEqual({ '1-3': rec(77) });
  });

  it('un guardado v2 corrupto no rompe la carga', () => {
    store.set(LEGACY_KEY, '{no es json');
    expect(loadSaved()).toEqual({ progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS, wallet: EMPTY_WALLET });
  });
});
