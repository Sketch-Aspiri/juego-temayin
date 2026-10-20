import { ALL_LEVELS, getWorldForLevel, isSeasonalLevel, PLAYABLE_LEVELS, WORLDS } from '../data/worlds';
import type { LevelResult, Stars } from '../engine/scoring';
import { sanitizeNotebook, type NotebookProgress } from './explorerNotebook';

export interface LevelRecord {
  bestScore: number;
  stars: Stars;
  completions: number;
}

export interface Progress extends NotebookProgress {
  levels: Readonly<Record<string, LevelRecord>>;
  tickets: readonly string[];
}

export const EMPTY_PROGRESS: Progress = { levels: {}, tickets: [], discoveries: [], readDiscoveries: [] };

export const hasTicket = (progress: Progress, worldId: string): boolean => progress.tickets.includes(worldId);

/** Idempotente e inmutable: el boleto se conserva incluso sin completar el nivel. */
export function recordTicket(progress: Progress, worldId: string): Progress {
  if (!WORLDS.some(w => w.id === worldId && w.bonus) || hasTicket(progress, worldId)) return progress;
  return { ...progress, tickets: [...progress.tickets, worldId] };
}

/** Registra un nivel completado conservando los mejores resultados (sin mutar). */
export function recordCompletion(progress: Progress, result: LevelResult): Progress {
  const prev = progress.levels[result.levelId];
  const record: LevelRecord = {
    bestScore: Math.max(prev?.bestScore ?? 0, result.score),
    stars: Math.max(prev?.stars ?? 1, result.stars) as Stars,
    completions: (prev?.completions ?? 0) + 1,
  };
  return { ...progress, levels: { ...progress.levels, [result.levelId]: record } };
}

/**
 * Un nivel está disponible si es el primero, si el anterior ya se completó o si
 * tiene récord propio (p. ej. niveles migrados desde la v2 que quedaron detrás
 * de niveles nuevos sin completar).
 */
export function isUnlocked(progress: Progress, levelId: string): boolean {
  if (isSeasonalLevel(levelId)) return true;
  const world = getWorldForLevel(levelId);
  if (world?.bonus?.id === levelId) return hasTicket(progress, world.id);
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
  const valid = new Set(PLAYABLE_LEVELS.map((l) => l.id));
  const out: Record<string, LevelRecord> = {};
  for (const [id, rec] of Object.entries(levels)) {
    if (!valid.has(id) || typeof rec !== 'object' || rec === null) continue;
    const { bestScore, stars, completions } = rec as Record<string, unknown>;
    if (isCount(bestScore) && isStars(stars) && isCount(completions)) out[id] = { bestScore, stars, completions };
  }
  const rawTickets = (raw as { tickets?: unknown }).tickets;
  const worldIds = new Set(WORLDS.map(w => w.id));
  const tickets = Array.isArray(rawTickets)
    ? [...new Set(rawTickets.filter((id): id is string => typeof id === 'string' && worldIds.has(id)))] : [];
  return { levels: out, tickets, ...sanitizeNotebook(raw as Record<string, unknown>) };
}
