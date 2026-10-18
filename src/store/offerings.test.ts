import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_LEVELS, WORLDS } from '../data/worlds';
import type { useAppStore as AppStore } from './appStore';
import { loadSaved } from './persistence';
import { DEFAULT_SETTINGS } from './settings';

describe('Encuentros y compras', () => {
  let store: typeof AppStore;
  beforeEach(async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    vi.resetModules();
    store = (await import('./appStore')).useAppStore;
    const levels = Object.fromEntries(ALL_LEVELS.map(l => [l.id, { bestScore: 0, stars: 1 as const, completions: 1 }]));
    store.setState({ progress: { levels, tickets: [] }, settings: { ...DEFAULT_SETTINGS, introSeen: true }, wallet: { cacao: 130, pending: {} } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('abre de dos a tres encuentros por mundo, incluido el jefe, y respeta los demás niveles', () => {
    for (const world of WORLDS) {
      const encounters = world.levels.filter(level => level.offering);
      expect(encounters.length).toBeGreaterThanOrEqual(2);
      expect(encounters.length).toBeLessThanOrEqual(3);
      expect(world.levels.at(-1)?.offering).toBeDefined();
    }
    for (const level of ALL_LEVELS) {
      store.getState().startLevel(level.id);
      expect(store.getState().screen).toBe(level.offering ? 'offering' : 'game');
    }
  });

  it('cobra una sola vez, guarda la compra y evita dobles pulsaciones', () => {
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('fire')).toBe(true);
    expect(store.getState().buyBlessing('fire')).toBe(false);
    expect(store.getState().wallet).toEqual({ cacao: 100, pending: { '1-3': ['fire'] } });
    expect(loadSaved().wallet).toEqual(store.getState().wallet);
  });

  it('no permite endeudarse ni comprar fuera del encuentro', () => {
    expect(store.getState().buyBlessing('fire')).toBe(false);
    store.setState({ wallet: { cacao: 19, pending: {} } });
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('shield')).toBe(false);
    expect(store.getState().wallet.cacao).toBe(19);
  });

  it('compra varias vidas juntas y permite repetir sin gastar más del saldo', () => {
    store.setState({ wallet: { cacao: 250, pending: {} } });
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('life', 3)).toBe(true);
    expect(store.getState().wallet.cacao).toBe(100);
    expect(store.getState().buyBlessing('life')).toBe(true);
    expect(store.getState().buyBlessing('life', 2)).toBe(false);
    expect(store.getState().wallet.cacao).toBe(50);
    expect(store.getState().buyBlessing('life')).toBe(true);
    expect(store.getState().buyBlessing('life')).toBe(false);
    expect(loadSaved().wallet).toEqual({ cacao: 0, pending: { '1-3': Array(5).fill('life') } });
    store.getState().go('levels');
    store.getState().startLevel('1-3');
    store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual(Array(5).fill('life'));
    expect(store.getState().wallet.pending).toEqual({});
    store.getState().retryLevel();
    store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual([]);
  });

  it.each([0, -1, 1.5, NaN, Infinity, 100, Number.MAX_SAFE_INTEGER])('rechaza cantidades inválidas: %s', quantity => {
    store.getState().startLevel('1-3');
    const wallet = store.getState().wallet;
    expect(store.getState().buyBlessing('life', quantity)).toBe(false);
    expect(store.getState().wallet).toBe(wallet);
  });

  it('mantiene fuego y escudo limitados a una unidad por encuentro', () => {
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('fire', 2)).toBe(false);
    expect(store.getState().buyBlessing('shield', 2)).toBe(false);
    expect(store.getState().wallet.cacao).toBe(130);
  });

  it('entrega las tres compras al continuar y no vuelve a entregarlas al reiniciar', () => {
    store.getState().startLevel('1-3');
    for (const blessing of ['fire', 'shield', 'life'] as const) expect(store.getState().buyBlessing(blessing)).toBe(true);
    store.getState().continueOffering();
    const run = store.getState().run;
    expect(store.getState().screen).toBe('game');
    expect(run?.initialBlessings).toEqual(['fire', 'shield', 'life']);
    expect(run?.session.coins).toBe(30);
    expect(store.getState().wallet.pending).toEqual({});
    store.getState().continueOffering();
    expect(store.getState().run).toBe(run);
    store.getState().retryLevel();
    expect(store.getState().screen).toBe('offering');
    expect(store.getState().run?.initialBlessings).toBeUndefined();
    expect(store.getState().wallet.cacao).toBe(30);
  });

  it('conserva las bendiciones pendientes si se sale antes de comenzar', () => {
    store.getState().startLevel('1-3');
    store.getState().buyBlessing('shield');
    store.getState().go('levels');
    store.getState().startLevel('1-6');
    store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual([]);
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('shield')).toBe(false);
    store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual(['shield']);
  });

  it('publicar cacao guarda robos y recompensas sin cambiar Run ni duplicar el saldo', () => {
    store.getState().startLevel('1-1');
    const run = store.getState().run!;
    const previous = structuredClone(run);
    store.getState().syncCacao(run, 150);
    store.getState().syncCacao(run, 150);
    expect(store.getState().wallet.cacao).toBe(150);
    store.getState().syncCacao(run, 145);
    expect(loadSaved().wallet.cacao).toBe(145);
    expect(store.getState().run).toBe(run);
    expect(run).toEqual(previous);
    store.getState().startLevel('1-2', { score: 500, coins: 1, lives: 4 });
    expect(store.getState().run?.session).toEqual({ score: 500, coins: 145, lives: 4 });
    store.getState().syncCacao(run, 999);
    expect(store.getState().wallet.cacao).toBe(145);
  });

  it('borrar progreso vacía también la bolsa y las compras pendientes', () => {
    store.getState().startLevel('1-3');
    store.getState().buyBlessing('life');
    store.getState().resetProgress();
    expect(loadSaved().wallet).toEqual({ cacao: 0, pending: {} });
    expect(store.getState().run).toBeNull();
  });
});
