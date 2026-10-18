import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';
import { loadSaved, save, STORAGE_KEY } from './persistence';

afterEach(() => vi.unstubAllGlobals());

describe('Personalización guardada de controles', () => {
  it('amplía ajustes antiguos sin perder sonido ni preferencias', () => {
    expect(sanitizeSettings({ volume: 0.3, muted: true, introSeen: true, touchControls: 'on' })).toEqual({
      ...DEFAULT_SETTINGS, volume: 0.3, muted: true, introSeen: true, touchControls: 'on',
    });
  });

  it('acota tamaño y opacidad y valida la distribución', () => {
    expect(sanitizeSettings({ touchAppearance: { scale: 10, opacity: -1, layout: 'mirrored' } }).touchAppearance)
      .toEqual({ scale: 1.2, opacity: 0.4, layout: 'mirrored' });
    expect(sanitizeSettings({ touchAppearance: { scale: NaN, opacity: Infinity, layout: 'otro' } }).touchAppearance)
      .toEqual(DEFAULT_SETTINGS.touchAppearance);
  });

  it('recupera teclas y apariencia al recargar sin alterar progreso o cacao', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value) });
    const original = loadSaved();
    const settings = { ...DEFAULT_SETTINGS, keyBindings: { ...DEFAULT_SETTINGS.keyBindings, jump: 'KeyK' },
      touchAppearance: { scale: 1.15, opacity: 0.65, layout: 'mirrored' as const } };
    save({ ...original, settings });
    expect(storage.has(STORAGE_KEY)).toBe(true);
    expect(loadSaved()).toEqual({ ...original, settings });
  });
});
