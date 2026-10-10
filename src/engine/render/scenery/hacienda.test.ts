import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEMES } from '../themes';
import { paintedScenery } from './painted';

/** Imagen que «falló al cargar»: completa pero sin tamaño (como hace el navegador ante un 404). */
class BrokenImage {
  complete = true;
  naturalWidth = 0;
  naturalHeight = 0;
  onerror: (() => void) | null = null;
  src = '';
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tema hacienda', () => {
  it('está registrado con tierra roja y mampostería', () => {
    const t = THEMES.hacienda;
    expect(t.id).toBe('hacienda');
    expect(t.groundTop).toBe('redEarthTop');
    expect(t.groundBody).toBe('redEarth');
    expect(t.platform).toBe('masonry');
  });

  it('sin el fondo pintado usa el escenario procedural (sin DOM)', () => {
    const fallback = vi.fn();
    const scenery = paintedScenery('hacienda.webp', fallback);
    const ctx = {} as CanvasRenderingContext2D;
    scenery(ctx, 120, 0);
    expect(fallback).toHaveBeenCalledWith(ctx, 120, 0);
  });

  it('si el archivo no existe sigue usando el respaldo en cada fotograma', () => {
    vi.stubGlobal('Image', BrokenImage);
    vi.stubGlobal('document', {});
    const fallback = vi.fn();
    const scenery = paintedScenery('no-existe-hacienda.webp', fallback);
    const ctx = {} as CanvasRenderingContext2D;
    scenery(ctx, 0, 0);
    scenery(ctx, 40, 16);
    expect(fallback).toHaveBeenCalledTimes(2);
  });
});
