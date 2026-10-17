import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../../data/worlds';
import { buildLevel } from '../level/build';
import { waterAt, type WaterZone } from '../level/zones';
import { STROMATOLITE_TILE } from '../entities/stromatolites';
import { blocksWater, waterRenderSpans, WaterSurfaceRenderer } from './waterSurface';
import type { Ctx } from './drawUtils';

describe('Transiciones visuales del agua', () => {
  it('no recorta el agua sobre los estromatolitos (si no, dejan recuadros claros)', () => {
    expect(blocksWater(STROMATOLITE_TILE)).toBe(false);
    expect(blocksWater('G')).toBe(true);
    expect(blocksWater(' ')).toBe(false);
  });

  it('une zonas contiguas sin una segunda costura ni doble tinte', () => {
    expect(waterRenderSpans([{ x0: 2, x1: 5, surface: 7 }, { x0: 6, x1: 9, surface: 7 }]))
      .toEqual([{ x0: 2, x1: 9, surface: 7, fadeLeft: true, fadeRight: true }]);
  });

  it('mantiene orillas separadas cuando hay tierra entre dos pozas', () => {
    expect(waterRenderSpans([{ x0: 2, x1: 4, surface: 7 }, { x0: 6, x1: 9, surface: 7 }]))
      .toEqual([
        { x0: 2, x1: 4, surface: 7, fadeLeft: true, fadeRight: true },
        { x0: 6, x1: 9, surface: 7, fadeLeft: true, fadeRight: true },
      ]);
  });

  it('respeta la crecida fraccionaria y toma la superficie superior de un solape', () => {
    expect(waterRenderSpans([{ x0: 4, x1: 8, surface: 8 }, { x0: 6, x1: 10, surface: 6.5 }]))
      .toEqual([
        { x0: 4, x1: 5, surface: 8, fadeLeft: true, fadeRight: false },
        { x0: 6, x1: 10, surface: 6.5, fadeLeft: false, fadeRight: true },
      ]);
  });

  it('admite agua del nivel completo, pozas estrechas y ausencia de agua', () => {
    expect(waterRenderSpans([])).toEqual([]);
    expect(waterRenderSpans([{ x0: 0, x1: 200, surface: 0 }])[0].surface).toBe(0);
    expect(waterRenderSpans([{ x0: 4, x1: 4, surface: 10 }])[0])
      .toEqual({ x0: 4, x1: 4, surface: 10, fadeLeft: true, fadeRight: true });
  });

  it.each(ALL_LEVELS)('conserva la cobertura física y los datos de agua de $id', def => {
    const zones = buildLevel(def).water;
    const before = structuredClone(zones);
    const spans = waterRenderSpans(zones);
    for (let tx = 0; tx < def.width; tx++) {
      for (const y of [0, 240, 320, 400, 480, 559]) {
        expect(waterAt(spans, tx * 40 + 20, y)?.surface)
          .toBe(zones.filter(z => tx >= z.x0 && tx <= z.x1 && y >= z.surface * 40)
            .map(z => z.surface).sort((a, b) => a - b)[0]);
      }
    }
    expect(zones).toEqual(before);
  });

  it('no requiere DOM para construir o consultar las transiciones', () => {
    const zones: readonly WaterZone[] = Object.freeze([Object.freeze({ x0: 2, x1: 8, surface: 8 })]);
    const renderer = new WaterSurfaceRenderer();
    expect(() => renderer.draw({} as Ctx, zones, { fill: '#128cad', foam: '#a0f1ef' }, 0, 0)).not.toThrow();
    expect(waterRenderSpans(zones)).toHaveLength(1);
  });
});
