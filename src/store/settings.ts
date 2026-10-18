import { DEFAULT_KEY_BINDINGS, sanitizeKeyBindings, type KeyBindings } from '../engine/controls';

export type TouchMode = 'auto' | 'on' | 'off';
export interface TouchAppearance {
  readonly scale: number;
  readonly opacity: number;
  readonly layout: 'standard' | 'mirrored';
}
export const DEFAULT_TOUCH_APPEARANCE: TouchAppearance = { scale: 1, opacity: 1, layout: 'standard' };
export const TOUCH_SCALE_MIN = 0.8;
export const TOUCH_SCALE_MAX = 1.2;
export const TOUCH_OPACITY_MIN = 0.4;

export interface Settings {
  muted: boolean;
  /** 0..1 */
  volume: number;
  touchControls: TouchMode;
  keyBindings: KeyBindings;
  touchAppearance: TouchAppearance;
  /** Ya se vio la cinemática de introducción (no se repite al empezar 1-1). */
  introSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = { muted: false, volume: 0.8, touchControls: 'auto', introSeen: false,
  keyBindings: DEFAULT_KEY_BINDINGS, touchAppearance: DEFAULT_TOUCH_APPEARANCE };

const TOUCH_MODES: readonly TouchMode[] = ['auto', 'on', 'off'];

const bounded = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

function sanitizeTouchAppearance(raw: unknown): TouchAppearance {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_TOUCH_APPEARANCE;
  const value = raw as Record<string, unknown>;
  return { scale: bounded(value.scale, 1, TOUCH_SCALE_MIN, TOUCH_SCALE_MAX),
    opacity: bounded(value.opacity, 1, TOUCH_OPACITY_MIN, 1), layout: value.layout === 'mirrored' ? 'mirrored' : 'standard' };
}

export function sanitizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const volume = typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  return {
    muted: typeof r.muted === 'boolean' ? r.muted : DEFAULT_SETTINGS.muted,
    volume,
    touchControls: TOUCH_MODES.includes(r.touchControls as TouchMode) ? (r.touchControls as TouchMode) : DEFAULT_SETTINGS.touchControls,
    introSeen: typeof r.introSeen === 'boolean' ? r.introSeen : DEFAULT_SETTINGS.introSeen,
    keyBindings: sanitizeKeyBindings(r.keyBindings),
    touchAppearance: sanitizeTouchAppearance(r.touchAppearance),
  };
}
