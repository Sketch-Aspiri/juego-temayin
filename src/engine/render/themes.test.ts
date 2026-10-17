import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ThemeId } from '../types';
import { createTextures } from './textures';
import { sceneryCam, THEMES } from './themes';

/** Contexto 2D falso: cualquier método o propiedad es un no-op (el motor se prueba sin DOM). */
const fakeCtx = (): unknown => {
  const fn = (): unknown => new Proxy(function noop() {}, { get: () => fn(), apply: () => fn() });
  return new Proxy({}, { get: () => fn(), set: () => true });
};

const IDS = Object.keys(THEMES) as ThemeId[];

describe('THEMES', () => {
  beforeAll(() => {
    vi.stubGlobal('document', {
      createElement: () => ({ width: 0, height: 0, getContext: fakeCtx }),
    });
  });

  it('cada tema tiene escenario y texturas registradas', () => {
    const textures = createTextures();
    for (const id of IDS) {
      const t = THEMES[id];
      expect(t.id).toBe(id);
      expect(typeof t.scenery).toBe('function');
      for (const tex of [t.groundTop, t.groundBody, t.platform]) expect(textures[tex], `${id}:${tex}`).toBeDefined();
    }
  });

  it('incluye los temas del Mundo 6 y las texturas del tren', () => {
    const textures = createTextures();
    for (const id of ['cliff', 'lagoon', 'bay', 'jungleTrain'] as const) expect(IDS).toContain(id);
    expect(textures.trainRoof).toBeDefined();
    expect(textures.trainSide).toBeDefined();
  });

  it('solo jungleTrain tiene motion', () => {
    const moving = IDS.filter((id) => THEMES[id].motion !== undefined);
    expect(moving).toEqual(['jungleTrain']);
    expect(THEMES.jungleTrain.motion).toBeGreaterThan(0);
  });

  it('el escenario se dibuja sin excepciones aunque falte el fondo pintado', () => {
    for (const id of ['cliff', 'lagoon', 'bay', 'jungleTrain'] as const) {
      expect(() => THEMES[id].scenery(fakeCtx() as CanvasRenderingContext2D, 100, 1000)).not.toThrow();
    }
  });
});

describe('sceneryCam', () => {
  it('sin motion devuelve la cámara intacta', () => {
    expect(sceneryCam(THEMES.jungle, 120, 5000)).toBe(120);
  });

  it('con motion suma desplazamiento proporcional al tiempo y es determinista', () => {
    const motion = THEMES.jungleTrain.motion ?? 0;
    expect(sceneryCam(THEMES.jungleTrain, 100, 2000)).toBe(100 + motion * 2);
    expect(sceneryCam(THEMES.jungleTrain, 100, 2000)).toBe(sceneryCam(THEMES.jungleTrain, 100, 2000));
  });
});
