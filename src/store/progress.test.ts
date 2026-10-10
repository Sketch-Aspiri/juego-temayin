import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../data/worlds';
import { coinRatio, computeStars, type LevelResult } from '../engine/scoring';
import { EMPTY_PROGRESS, hiScore, isUnlocked, recordCompletion, sanitizeProgress, totalStars } from './progress';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

const result = (over: Partial<LevelResult> = {}): LevelResult => ({
  levelId: ALL_LEVELS[0].id,
  score: 1000,
  stars: 2,
  coinRatio: 0.7,
  deaths: 0,
  session: { score: 1000, coins: 3, lives: 3 },
  ...over,
});

describe('computeStars', () => {
  it('da 1 estrella si moriste, sin importar las monedas', () => {
    expect(computeStars(1, 1)).toBe(1);
  });
  it('da 2 y 3 estrellas sin morir según las monedas', () => {
    expect(computeStars(0.3, 0)).toBe(1);
    expect(computeStars(0.6, 0)).toBe(2);
    expect(computeStars(0.9, 0)).toBe(3);
  });
  it('coinRatio no supera 1 y tolera niveles sin monedas', () => {
    expect(coinRatio(12, 10)).toBe(1);
    expect(coinRatio(0, 0)).toBe(1);
  });
});

describe('progreso', () => {
  it('solo el primer nivel está desbloqueado al inicio', () => {
    expect(isUnlocked(EMPTY_PROGRESS, ALL_LEVELS[0].id)).toBe(true);
    expect(isUnlocked(EMPTY_PROGRESS, ALL_LEVELS[1].id)).toBe(false);
    expect(isUnlocked(EMPTY_PROGRESS, 'no-existe')).toBe(false);
  });

  it('insertar 4-1 delante de 4-2 no bloquea a quien ya tenía récord en 4-2', () => {
    const ids = ALL_LEVELS.map((l) => l.id);
    expect(ids.indexOf('4-1')).toBe(ids.indexOf('4-2') - 1);
    const saved = recordCompletion(EMPTY_PROGRESS, result({ levelId: '4-2' }));
    expect(isUnlocked(saved, '4-2')).toBe(true);
    expect(isUnlocked(saved, '4-3')).toBe(true);
    // 4-1 sigue la cadena normal: se abre al completar el nivel anterior.
    expect(isUnlocked(saved, '4-1')).toBe(false);
  });

  it('completar un nivel desbloquea el siguiente sin mutar el original', () => {
    const next = recordCompletion(EMPTY_PROGRESS, result());
    expect(isUnlocked(next, ALL_LEVELS[1].id)).toBe(true);
    expect(EMPTY_PROGRESS.levels).toEqual({});
  });

  it('conserva los mejores resultados', () => {
    const a = recordCompletion(EMPTY_PROGRESS, result({ score: 2000, stars: 3 }));
    const b = recordCompletion(a, result({ score: 500, stars: 1 }));
    expect(b.levels[ALL_LEVELS[0].id]).toEqual({ bestScore: 2000, stars: 3, completions: 2 });
    expect(totalStars(b)).toBe(3);
    expect(hiScore(b)).toBe(2000);
  });
});

describe('sanitize', () => {
  it('descarta datos corruptos o de niveles desconocidos', () => {
    const p = sanitizeProgress({
      levels: {
        [ALL_LEVELS[0].id]: { bestScore: 10, stars: 2, completions: 1 },
        fantasma: { bestScore: 10, stars: 2, completions: 1 },
        [ALL_LEVELS[1].id]: { bestScore: 'x', stars: 9, completions: -1 },
      },
    });
    expect(Object.keys(p.levels)).toEqual([ALL_LEVELS[0].id]);
    expect(sanitizeProgress('basura')).toEqual(EMPTY_PROGRESS);
    expect(sanitizeProgress(null)).toEqual(EMPTY_PROGRESS);
  });

  it('acota el volumen y valida los ajustes', () => {
    expect(sanitizeSettings({ volume: 7, muted: true, touchControls: 'on' })).toEqual({ volume: 1, muted: true, touchControls: 'on', introSeen: false });
    expect(sanitizeSettings({ volume: 'x', touchControls: 'otro' })).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });
});
