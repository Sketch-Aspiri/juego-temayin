import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_KEY, loadSaved, save, STORAGE_KEY } from './persistence';
import { DEFAULT_SETTINGS } from './settings';
import { EMPTY_WALLET, sanitizeWallet } from './wallet';

describe('Bolsa persistente de cacao', () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, null, [], 10, { cacao: -1 }, { cacao: 1.5 }, { cacao: Infinity }, { cacao: '50' }])('sanea saldos inválidos sin inventar cacao: %j', raw => {
    expect(sanitizeWallet(raw)).toEqual(EMPTY_WALLET);
  });

  it('conserva el saldo aunque las bendiciones pendientes estén corruptas', () => {
    const raw = { cacao: 135, pending: { '1-3': ['fire', 'fire', 'desconocida'], '1-1': ['shield'], fantasma: ['life'], '1-6': 50 } };
    expect(sanitizeWallet(raw)).toEqual({ cacao: 135, pending: { '1-3': ['fire'] } });
  });

  it('carga un guardado v3 anterior sin perder estrellas, récords ni ajustes', () => {
    const progress = { levels: { '1-3': { bestScore: 800, stars: 3, completions: 2 } } };
    storage.set(STORAGE_KEY, JSON.stringify({ progress, settings: DEFAULT_SETTINGS }));
    expect(loadSaved()).toEqual({ progress, settings: DEFAULT_SETTINGS, wallet: EMPTY_WALLET });
  });

  it('guarda y recupera cacao y compras pendientes', () => {
    const state = { ...loadSaved(), wallet: { cacao: 120, pending: { '1-3': ['fire', 'life'] as const } } };
    save(state);
    expect(loadSaved()).toEqual(state);
  });

  it('migra v2 conservando el progreso y empezando con la bolsa vacía', () => {
    storage.set(LEGACY_KEY, JSON.stringify({ progress: { levels: { '1-3': { bestScore: 80, stars: 2, completions: 1 } } } }));
    expect(loadSaved().progress.levels['1-6'].bestScore).toBe(80);
    expect(loadSaved().wallet).toEqual(EMPTY_WALLET);
  });

  it('continúa sin lanzar errores si no se permite guardar', () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('Sin espacio'); } });
    expect(() => save(loadSaved())).not.toThrow();
  });
});
