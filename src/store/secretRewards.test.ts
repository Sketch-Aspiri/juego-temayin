import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CINEMATICS } from '../data/cinematics';
import { FINAL_SECRET_CACAO, FINAL_SECRET_ID, SECRET_CACAO, SECRET_LEVEL_IDS } from '../data/secretRewards';
import { getLevel } from '../data/worlds';
import { applyBlessings } from '../engine/blessings';
import { AudioEngine } from '../engine/audio';
import { Input } from '../engine/input';
import { World } from '../engine/World';
import { useAppStore as store } from './appStore';
import { isCinematicUnlocked } from './cinematics';
import { loadSaved } from './persistence';
import { EMPTY_PROGRESS, recordCompletion, sanitizeProgress, type Progress } from './progress';
import { rewardBlessings } from './rewards';
import { completesAllSeals, firstSecretReward, hasAllSeals, hasSeal, sealCount } from './secretRewards';
import { DEFAULT_SETTINGS } from './settings';

const original = store.getState();
const resultFor = (levelId: string) => ({ levelId, score: 900, stars: 2 as const, coinRatio: 0.7, deaths: 0,
  session: { score: 900, coins: 4, lives: 3 } });
const sealed = (ids: readonly string[]): Progress =>
  ids.reduce((progress, id) => recordCompletion(progress, resultFor(id)), EMPTY_PROGRESS);

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  store.setState({ progress: EMPTY_PROGRESS, run: null, wallet: { cacao: 20, pending: {} },
    settings: { ...DEFAULT_SETTINGS, introSeen: true } });
});
afterEach(() => { store.setState(original); vi.unstubAllGlobals(); });

describe('Premio de los niveles secretos', () => {
  it('paga 100 de cacao la primera vez, 150 en el santuario final y nada al repetir o en otros niveles', () => {
    expect(firstSecretReward(EMPTY_PROGRESS, '1-extra')).toBe(SECRET_CACAO);
    expect(firstSecretReward(EMPTY_PROGRESS, FINAL_SECRET_ID)).toBe(FINAL_SECRET_CACAO);
    expect(firstSecretReward(sealed(['1-extra']), '1-extra')).toBe(0);
    expect(firstSecretReward(EMPTY_PROGRESS, '1-1')).toBe(0);
    expect(SECRET_LEVEL_IDS).toHaveLength(7);
  });

  it('abona el cacao una sola vez, lo guarda y sobrevive al último HUD del motor', () => {
    store.setState({ run: { levelId: '1-extra', session: { score: 0, coins: 20, lives: 3 }, attempt: 0 } });
    const run = store.getState().run!;
    store.getState().finishLevel(resultFor('1-extra'));
    store.getState().syncCacao(run, 20); // publicación tardía del motor con el saldo antiguo
    expect(store.getState().wallet.cacao).toBe(20 + SECRET_CACAO);
    expect(loadSaved().wallet.cacao).toBe(20 + SECRET_CACAO);
    store.getState().finishLevel(resultFor('1-extra'));
    expect(store.getState().wallet.cacao).toBe(20 + SECRET_CACAO);
  });

  it('da el sello retroactivamente a quien ya completó secretos, sin regalarle cacao ni tocar el récord', () => {
    const record = { bestScore: 700, stars: 3, completions: 2 };
    const old = sanitizeProgress({ levels: { '2-extra': record } });
    expect(hasSeal(old, '2-extra')).toBe(true);
    expect(sealCount(old)).toBe(1);
    expect(firstSecretReward(old, '2-extra')).toBe(0);
    expect(old.levels['2-extra']).toEqual(record);
  });

  it('el Corazón de jade llega con los siete sellos y suma una vida real al empezar', () => {
    const almost = sealed(SECRET_LEVEL_IDS.slice(1));
    expect(hasAllSeals(almost)).toBe(false);
    expect(rewardBlessings(almost, '1-1')).toBeUndefined();
    const all = sealed(SECRET_LEVEL_IDS);
    expect(completesAllSeals(almost, all)).toBe(true);
    expect(completesAllSeals(all, all)).toBe(false);
    expect(rewardBlessings(all, '1-1')).toEqual(['life']);
    store.setState({ progress: all });
    store.getState().startLevel('1-1');
    const w = new World({ def: getLevel('1-1')!, input: new Input(), audio: new AudioEngine(),
      session: { score: 0, coins: 0, lives: 3 } });
    applyBlessings(w, store.getState().run?.initialBlessings ?? []);
    expect(w.session.lives).toBe(4);
    store.getState().retryLevel();
    expect(store.getState().run?.initialBlessings).toEqual(['life']);
  });

  it('el escudo del amuleto de Hanal y la vida del Corazón de jade se acumulan', () => {
    const progress = recordCompletion(sealed(SECRET_LEVEL_IDS), resultFor('especial-hanal-pixan'));
    expect(rewardBlessings(progress, '1-1')).toEqual(['shield', 'life']);
  });

  it('la escena final se desbloquea con los siete sellos y borrar el progreso la vuelve a bloquear', () => {
    const scene = CINEMATICS['secretos-victory'];
    expect(isCinematicUnlocked(sealed(SECRET_LEVEL_IDS.slice(1)), scene)).toBe(false);
    expect(isCinematicUnlocked(sealed(SECRET_LEVEL_IDS), scene)).toBe(true);
    store.setState({ progress: sealed(SECRET_LEVEL_IDS) });
    store.getState().resetProgress();
    expect(isCinematicUnlocked(loadSaved().progress, scene)).toBe(false);
  });
});
