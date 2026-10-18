import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HANAL_REWARD } from '../data/hanalReward';
import { getLevel } from '../data/worlds';
import { applyBlessings } from '../engine/blessings';
import { AudioEngine } from '../engine/audio';
import { Input } from '../engine/input';
import { World } from '../engine/World';
import { useAppStore as store } from './appStore';
import { loadSaved } from './persistence';
import { EMPTY_PROGRESS, sanitizeProgress } from './progress';
import { hasHanalReward, rewardBlessings } from './rewards';
import { DEFAULT_SETTINGS } from './settings';

const original = store.getState();
const result = { levelId: HANAL_REWARD.levelId, score: 500, stars: 1 as const,
  coinRatio: 0.2, deaths: 2, session: { coins: 30, score: 500, lives: 2 } };

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  store.setState({ progress: EMPTY_PROGRESS, run: null, wallet: { cacao: 150, pending: {} },
    settings: { ...DEFAULT_SETTINGS, introSeen: true } });
});
afterEach(() => { store.setState(original); vi.unstubAllGlobals(); });

describe('Amuleto de luz de Hanal Pixán', () => {
  it('solo lo concede al terminar y permanece tras guardar, cargar y repetir', () => {
    store.getState().startLevel(result.levelId);
    expect(hasHanalReward(store.getState().progress)).toBe(false);
    store.getState().retryLevel();
    expect(store.getState().run?.initialBlessings).toBeUndefined();
    store.getState().finishLevel(result);
    expect(hasHanalReward(loadSaved().progress)).toBe(true);
    store.setState({ progress: loadSaved().progress });
    store.getState().finishLevel(result);
    store.getState().startLevel('1-1', result.session);
    expect(store.getState().run?.initialBlessings).toEqual(['shield']);
    expect(store.getState().run?.session.lives).toBe(2);
    store.getState().retryLevel();
    expect(store.getState().run?.initialBlessings).toEqual(['shield']);
    expect(store.getState().wallet.cacao).toBe(150);
  });

  it('el premio da un escudo real que se consume al recibir un golpe', () => {
    store.getState().finishLevel(result);
    store.getState().startLevel('1-1');
    const w = new World({ def: getLevel('1-1')!, input: new Input(), audio: new AudioEngine(),
      session: { score: 0, coins: 0, lives: 3 } });
    applyBlessings(w, store.getState().run?.initialBlessings ?? []);
    expect(w.player.shield).toBe(true);
    w.hurt();
    expect(w.player.shield).toBe(false);
    expect(w.phase).toBe('play');
  });

  it('conserva compras y vidas, e impide cobrar un escudo que ya está incluido', () => {
    store.getState().finishLevel(result);
    store.setState({ progress: { ...store.getState().progress, levels: { ...store.getState().progress.levels,
      '1-3': { bestScore: 100, stars: 1, completions: 1 } } } });
    store.getState().startLevel('1-3');
    expect(store.getState().buyBlessing('shield')).toBe(false);
    expect(store.getState().wallet.cacao).toBe(150);
    expect(store.getState().buyBlessing('life', 2)).toBe(true);
    expect(store.getState().buyBlessing('fire')).toBe(true);
    store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual(['shield', 'life', 'life', 'fire']);
    expect(store.getState().wallet.cacao).toBe(20);
    store.getState().retryLevel(); store.getState().continueOffering();
    expect(store.getState().run?.initialBlessings).toEqual(['shield']);
  });

  it('reconoce récords antiguos, no regala el premio por cero completados y lo borra al reiniciar progreso', () => {
    const record = { bestScore: 900, stars: 2, completions: 1 };
    const old = sanitizeProgress({ levels: { [result.levelId]: record, '1-6': record } });
    expect(rewardBlessings(old, '1-1')).toEqual(['shield']);
    expect(rewardBlessings(old, '1-extra')).toEqual(['shield']);
    expect(rewardBlessings(old, result.levelId)).toBeUndefined();
    expect(rewardBlessings(old, 'desconocido')).toBeUndefined();
    expect(old.levels['1-6']).toEqual(record);
    expect(hasHanalReward(sanitizeProgress({ levels: { [result.levelId]: { ...record, completions: 0 } } }))).toBe(false);
    store.setState({ progress: old }); store.getState().resetProgress();
    expect(hasHanalReward(loadSaved().progress)).toBe(false);
    store.getState().startLevel('1-1');
    expect(store.getState().run?.initialBlessings).toBeUndefined();
  });
});
