export type TouchMode = 'auto' | 'on' | 'off';

export interface Settings {
  muted: boolean;
  /** 0..1 */
  volume: number;
  touchControls: TouchMode;
  /** Ya se vio la cinemática de introducción (no se repite al empezar 1-1). */
  introSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = { muted: false, volume: 0.8, touchControls: 'auto', introSeen: false };

const TOUCH_MODES: readonly TouchMode[] = ['auto', 'on', 'off'];

export function sanitizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const volume = typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  return {
    muted: typeof r.muted === 'boolean' ? r.muted : DEFAULT_SETTINGS.muted,
    volume,
    touchControls: TOUCH_MODES.includes(r.touchControls as TouchMode) ? (r.touchControls as TouchMode) : DEFAULT_SETTINGS.touchControls,
    introSeen: typeof r.introSeen === 'boolean' ? r.introSeen : DEFAULT_SETTINGS.introSeen,
  };
}
