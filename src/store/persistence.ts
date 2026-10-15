import { EMPTY_WALLET, sanitizeWallet, type Wallet } from './wallet';
import { migrateV2Progress } from './migrations';
import { EMPTY_PROGRESS, sanitizeProgress, type Progress } from './progress';
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './settings';

/** Clave actual del guardado (campaña del Tren Maya). */
export const STORAGE_KEY = 'temayin:v3';
/** Clave de la campaña anterior: se lee y migra una sola vez; nunca se borra (permite volver atrás). */
export const LEGACY_KEY = 'temayin:v2';

export interface SavedState {
  wallet: Wallet;
  progress: Progress;
  settings: Settings;
}

const emptyState = (): SavedState => ({ progress: EMPTY_PROGRESS, settings: DEFAULT_SETTINGS, wallet: EMPTY_WALLET });

/** Interpreta el JSON guardado; `migrate` transforma el progreso crudo antes de sanearlo. */
function parseSaved(text: string, migrate: (raw: unknown) => unknown): SavedState {
  const data: unknown = JSON.parse(text);
  const obj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  return { progress: sanitizeProgress(migrate(obj.progress)), settings: sanitizeSettings(obj.settings), wallet: sanitizeWallet(obj.wallet) };
}

export function loadSaved(): SavedState {
  try {
    const storage = globalThis.localStorage;
    const text = storage?.getItem(STORAGE_KEY);
    if (text) return parseSaved(text, (raw) => raw);
    const legacy = storage?.getItem(LEGACY_KEY);
    if (!legacy) return emptyState();
    const migrated = parseSaved(legacy, migrateV2Progress);
    save(migrated);
    return migrated;
  } catch {
    // Almacenamiento bloqueado o datos corruptos: se empieza de cero.
    return emptyState();
  }
}

export function save(state: SavedState): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Modo privado o cuota llena: el progreso solo vive en memoria.
  }
}
