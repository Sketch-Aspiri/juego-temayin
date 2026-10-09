import { EMPTY_PROGRESS, sanitizeProgress, type Progress } from './progress';
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './settings';

const STORAGE_KEY = 'temayin:v2';

export interface SavedState {
  progress: Progress;
  settings: Settings;
}

export function loadSaved(): SavedState {
  try {
    const text = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!text) return { progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS };
    const data: unknown = JSON.parse(text);
    const obj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
    return { progress: sanitizeProgress(obj.progress), settings: sanitizeSettings(obj.settings) };
  } catch {
    // Almacenamiento bloqueado o datos corruptos: se empieza de cero.
    return { progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS };
  }
}

export function save(state: SavedState): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Modo privado o cuota llena: el progreso solo vive en memoria.
  }
}
