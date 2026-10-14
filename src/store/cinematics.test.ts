import { afterEach, describe, expect, it, vi } from 'vitest';
import { CINEMATICS } from '../data/cinematics';
import type { LevelResult } from '../engine/scoring';
import { isCinematicUnlocked } from './cinematics';
import { EMPTY_PROGRESS, recordCompletion, type Progress } from './progress';
import { LEGACY_KEY, loadSaved, STORAGE_KEY } from './persistence';
import { useAppStore } from './appStore';

const result: LevelResult = {
  levelId: '1-6', score: 6000, stars: 2, coinRatio: 0.7, deaths: 0,
  session: { score: 9000, lives: 4, coins: 30 },
};
const victory = CINEMATICS['puas-victory'];
const record = { bestScore: 6000, stars: 2 as const, completions: 1 };

afterEach(() => vi.unstubAllGlobals());

describe('Cinemáticas desbloqueadas por progreso', () => {
  it('ofrece el prólogo desde el principio y exige completar Escárcega', () => {
    expect(isCinematicUnlocked(EMPTY_PROGRESS, CINEMATICS.intro)).toBe(true);
    expect(isCinematicUnlocked(EMPTY_PROGRESS, victory)).toBe(false);
    expect(isCinematicUnlocked({ levels: { '1-5': record } }, victory)).toBe(false);
    expect(isCinematicUnlocked({ levels: { '1-6': { ...record, completions: 0 } } }, victory)).toBe(false);
    expect(isCinematicUnlocked(recordCompletion(EMPTY_PROGRESS, result), victory)).toBe(true);
  });

  it.each([STORAGE_KEY, LEGACY_KEY])('desbloquea partidas antiguas de %s sin alterar sus récords', key => {
    const levelId = key === LEGACY_KEY ? '1-3' : '1-6';
    const storage = new Map([[key, JSON.stringify({ progress: { levels: { [levelId]: record } } })]]);
    vi.stubGlobal('localStorage', {
      getItem: (name: string) => storage.get(name) ?? null,
      setItem: (name: string, value: string) => storage.set(name, value),
    });
    const saved = loadSaved();
    expect(isCinematicUnlocked(saved.progress, victory)).toBe(true);
    expect(saved.progress.levels['1-6']).toEqual(record);
  });

  it('consultar el archivo no concede estrellas ni registra otra finalización', () => {
    const progress: Progress = { levels: { '1-6': record } };
    const before = structuredClone(progress);
    for (let i = 0; i < 3; i++) expect(isCinematicUnlocked(progress, victory)).toBe(true);
    expect(progress).toEqual(before);
  });

  it('al borrar el progreso vuelve a bloquear la victoria y conserva el prólogo', () => {
    const before = useAppStore.getState();
    try {
      useAppStore.setState({ progress: { levels: { '1-6': record } } });
      useAppStore.getState().resetProgress();
      expect(isCinematicUnlocked(useAppStore.getState().progress, victory)).toBe(false);
      expect(isCinematicUnlocked(useAppStore.getState().progress, CINEMATICS.intro)).toBe(true);
    } finally { useAppStore.setState(before); }
  });
});
