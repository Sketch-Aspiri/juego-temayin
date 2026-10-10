import { ALL_LEVELS } from '../data/worlds';
import type { LevelResult, Stars } from '../engine/scoring';

export interface LevelRecord {
  bestScore: number;
  stars: Stars;
  completions: number;
}

export interface Progress {
  levels: Readonly<Record<string, LevelRecord>>;
}

export const EMPTY_PROGRESS: Progress = { levels: {} };

/** Registra un nivel completado conservando los mejores resultados (sin mutar). */
export function recordCompletion(progress: Progress, result: LevelResult): Progress {
  const prev = progress.levels[result.levelId];
  const record: LevelRecord = {
    bestScore: Math.max(prev?.bestScore ?? 0, result.score),
    stars: Math.max(prev?.stars ?? 1, result.stars) as Stars,
    completions: (prev?.completions ?? 0) + 1,
  };
  return { levels: { ...progress.levels, [result.levelId]: record } };
}

/**
 * Un nivel está disponible si es el primero, si el anterior ya se completó o si
 * tiene récord propio (p. ej. niveles migrados desde la v2 que quedaron detrás
 * de niveles nuevos sin completar).
 */
export function isUnlocked(progress: Progress, levelId: string): boolean {
  const i = ALL_LEVELS.findIndex((l) => l.id === levelId);
  if (i < 0) return false;
  if (i === 0 || !!progress.levels[levelId]) return true;
  return !!progress.levels[ALL_LEVELS[i - 1].id];
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.levels).reduce((n, r) => n + r.stars, 0);
}

export function hiScore(progress: Progress): number {
  return Object.values(progress.levels).reduce((n, r) => n + r.bestScore, 0);
}

const isStars = (v: unknown): v is Stars => v === 1 || v === 2 || v === 3;
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Valida datos leídos de localStorage: nunca se confía en ellos. */
export function sanitizeProgress(raw: unknown): Progress {
  if (typeof raw !== 'object' || raw === null) return EMPTY_PROGRESS;
  const levels = (raw as { levels?: unknown }).levels;
  if (typeof levels !== 'object' || levels === null) return EMPTY_PROGRESS;
  const valid = new Set(ALL_LEVELS.map((l) => l.id));
  const out: Record<string, LevelRecord> = {};
  for (const [id, rec] of Object.entries(levels)) {
    if (!valid.has(id) || typeof rec !== 'object' || rec === null) continue;
    const { bestScore, stars, completions } = rec as Record<string, unknown>;
    if (isCount(bestScore) && isStars(stars) && isCount(completions)) out[id] = { bestScore, stars, completions };
  }
  return { levels: out };
}
