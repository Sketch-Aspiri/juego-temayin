import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WORLDS } from '../data/worlds';
import type { LevelResult } from '../engine/scoring';
import { useAppStore } from './appStore';
import { loadSaved } from './persistence';
import { EMPTY_PROGRESS, hasTicket, isUnlocked, recordCompletion, recordTicket, sanitizeProgress } from './progress';
import { DEFAULT_SETTINGS } from './settings';

const first = WORLDS[0];
const result: LevelResult = { levelId: first.bonus!.id, score: 900, stars: 2, coinRatio: 0.7,
  deaths: 0, session: { score: 900, coins: 4, lives: 3 } };
const record = { bestScore: 900, stars: 2 as const, completions: 1 };

describe('Progreso de boletos', () => {
  it.each(WORLDS)('el boleto de $id abre solo su propio secreto y se conserva al completar', world => {
    const before = structuredClone(EMPTY_PROGRESS);
    const next = recordTicket(EMPTY_PROGRESS, world.id);
    expect(hasTicket(next, world.id)).toBe(true);
    expect(isUnlocked(next, world.bonus!.id)).toBe(true);
    for (const other of WORLDS.filter(w => w !== world)) expect(isUnlocked(next, other.bonus!.id)).toBe(false);
    expect(isUnlocked(next, '1-2')).toBe(false);
    expect(recordTicket(next, world.id)).toBe(next);
    expect(recordCompletion(next, { ...result, levelId: world.bonus!.id }).tickets).toEqual([world.id]);
    expect(EMPTY_PROGRESS).toEqual(before);
  });

  it('no desbloquea secretos por victoria, récord propio o ids desconocidos', () => {
    expect(recordTicket(EMPTY_PROGRESS, 'inventado')).toBe(EMPTY_PROGRESS);
    const next = recordCompletion(EMPTY_PROGRESS, result);
    expect(isUnlocked(next, first.bonus!.id)).toBe(false);
    expect(isUnlocked(next, '2-1')).toBe(false);
  });

  it('carga récords antiguos sin boletos y sanea boletos sin descartar los nuevos récords', () => {
    expect(sanitizeProgress({ levels: { '1-6': record } })).toEqual({ ...EMPTY_PROGRESS, levels: { '1-6': record }, tickets: [] });
    const raw = { levels: { [first.bonus!.id]: record, '1-1': record },
      tickets: [first.id, first.id, 3, null, 'desconocido', WORLDS[1].id] };
    const before = structuredClone(raw);
    expect(sanitizeProgress(raw)).toEqual({ ...EMPTY_PROGRESS, levels: raw.levels, tickets: [first.id, WORLDS[1].id] });
    expect(raw).toEqual(before);
    for (const tickets of [null, 'selva-palenque', {}, 4])
      expect(sanitizeProgress({ levels: {}, tickets }).tickets).toEqual([]);
  });
});

describe('Guardado inmediato del boleto', () => {
  const original = useAppStore.getState();
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v) });
    useAppStore.setState({ ...original, progress: sanitizeProgress({ levels: { '1-3': record } }),
      settings: { ...DEFAULT_SETTINGS, introSeen: true }, run: null, screen: 'levels' });
  });
  afterEach(() => { useAppStore.setState(original); vi.unstubAllGlobals(); });

  it('abre el desvío al recoger, sin terminar el nivel; persiste al salir, recargar y repetir', () => {
    const store = useAppStore;
    store.getState().startLevel(first.bonus!.id);
    expect(store.getState().run).toBeNull();
    store.getState().startLevel('1-3');
    const run = store.getState().run!;
    store.getState().continueOffering();
    const active = store.getState().run!;
    store.getState().syncTicket(active, true);
    expect(loadSaved().progress.tickets).toEqual([first.id]);
    store.getState().go('levels');
    store.setState({ progress: loadSaved().progress });
    store.getState().startLevel(first.bonus!.id);
    expect(store.getState().screen).toBe('game');
    expect(store.getState().run?.levelId).toBe(first.bonus!.id);
    store.getState().syncTicket(run, true);
    store.getState().retryLevel();
    expect(store.getState().progress.tickets).toEqual([first.id]);
    store.getState().finishLevel(result);
    expect(loadSaved().progress.levels[first.bonus!.id]).toEqual(record);
    expect(loadSaved().progress.tickets).toEqual([first.id]);
  });

  it('ignora partidas antiguas, publicaciones falsas y niveles que no contienen boleto', () => {
    const store = useAppStore;
    store.getState().startLevel('1-3'); store.getState().continueOffering();
    const old = store.getState().run!;
    store.getState().retryLevel();
    store.getState().syncTicket(old, true);
    store.getState().syncTicket(store.getState().run!, false);
    expect(store.getState().progress.tickets).toEqual([]);
    store.getState().startLevel('1-1');
    store.getState().syncTicket(store.getState().run!, true);
    expect(store.getState().progress.tickets).toEqual([]);
  });

  it('borrar progreso borra boletos y vuelve a cerrar los desvíos', () => {
    useAppStore.setState({ progress: recordTicket(EMPTY_PROGRESS, first.id) });
    useAppStore.getState().resetProgress();
    expect(loadSaved().progress).toEqual(EMPTY_PROGRESS);
    expect(isUnlocked(useAppStore.getState().progress, first.bonus!.id)).toBe(false);
  });
});
