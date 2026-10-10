import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store/appStore';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../store/settings';
import { INTRO_FILES, INTRO_LEVEL_ID, INTRO_SCENES, SPRITES } from './intro';
import { ALL_LEVELS } from './worlds';

/** Imágenes reales del juego (rutas relativas a este archivo). */
const PUBLIC_FILES = new Set(Object.keys(import.meta.glob('../../public/assets/**/*.webp')));

describe('datos de la cinemática', () => {
  it('empieza antes del primer nivel de la campaña', () => {
    expect(INTRO_LEVEL_ID).toBe(ALL_LEVELS[0].id);
  });

  it('cada escena tiene id único, texto y fondo', () => {
    const ids = INTRO_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of INTRO_SCENES) {
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.background).toMatch(/\.webp$/);
    }
  });

  it('todas las imágenes existen en public/assets', () => {
    for (const file of INTRO_FILES) expect(PUBLIC_FILES.has(`../../public/assets/${file}`), file).toBe(true);
  });

  it('los recortes de sprites caben en su hoja', () => {
    for (const [name, s] of Object.entries(SPRITES)) {
      const [x, y, w, h] = s.frame;
      expect(x + w, name).toBeLessThanOrEqual(s.sheetW);
      expect(y + h, name).toBeLessThanOrEqual(s.sheetH);
    }
  });
});

describe('flujo de la cinemática', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'levels', run: null, introNext: null, settings: { ...DEFAULT_SETTINGS } });
  });

  it('la primera vez que se empieza 1-1 muestra la historia antes del nivel', () => {
    useAppStore.getState().startLevel(INTRO_LEVEL_ID);
    expect(useAppStore.getState().screen).toBe('intro');
    expect(useAppStore.getState().run).toBeNull();

    useAppStore.getState().finishIntro();
    const s = useAppStore.getState();
    expect(s.settings.introSeen).toBe(true);
    expect(s.screen).toBe('game');
    expect(s.run?.levelId).toBe(INTRO_LEVEL_ID);
  });

  it('si ya se vio, 1-1 empieza directo', () => {
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, introSeen: true } });
    useAppStore.getState().startLevel(INTRO_LEVEL_ID);
    expect(useAppStore.getState().screen).toBe('game');
  });

  it('verla desde el título vuelve al título al terminar', () => {
    useAppStore.getState().playIntro(null);
    expect(useAppStore.getState().screen).toBe('intro');
    useAppStore.getState().finishIntro();
    expect(useAppStore.getState().screen).toBe('title');
  });

  it('introSeen se conserva y se sanea en los ajustes guardados', () => {
    expect(sanitizeSettings({ introSeen: true }).introSeen).toBe(true);
    expect(sanitizeSettings({ introSeen: 'sí' }).introSeen).toBe(false);
  });
});
