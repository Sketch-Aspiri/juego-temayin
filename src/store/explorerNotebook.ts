import { isDiscoveryId } from '../data/explorerNotebook';
import type { Progress } from './progress';

export interface NotebookProgress {
  readonly discoveries: readonly string[];
  readonly readDiscoveries: readonly string[];
}

/** Los campos nuevos son independientes: un cuaderno corrupto no borra los récords. */
export function sanitizeNotebook(raw: Record<string, unknown>): NotebookProgress {
  const discoveries: string[] = Array.isArray(raw.discoveries) ? [...new Set(raw.discoveries.filter(isDiscoveryId))] : [];
  const readDiscoveries = Array.isArray(raw.readDiscoveries)
    ? [...new Set(raw.readDiscoveries.filter((id): id is string => typeof id === 'string' && discoveries.includes(id)))] : [];
  return { discoveries, readDiscoveries };
}

/** Inmutable e idempotente: solo se guarda cuando aparece una página nueva. */
export function recordDiscoveries(progress: Progress, ids: readonly string[]): Progress {
  const additions = [...new Set(ids.filter(isDiscoveryId))].filter(id => !progress.discoveries.includes(id));
  return additions.length ? { ...progress, discoveries: [...progress.discoveries, ...additions] } : progress;
}

export function readDiscovery(progress: Progress, id: string): Progress {
  if (!progress.discoveries.includes(id) || progress.readDiscoveries.includes(id)) return progress;
  return { ...progress, readDiscoveries: [...progress.readDiscoveries, id] };
}
