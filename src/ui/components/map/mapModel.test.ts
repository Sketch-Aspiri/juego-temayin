import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_LEVELS, WORLDS } from '../../../data/worlds';
import { STATIONS } from '../../../data/stations';
import { EMPTY_PROGRESS, type Progress } from '../../../store/progress';
import { fitMapView, FULL_MAP, latestStation, mapPoint, worldDiscovered, worldView } from './mapModel';
import { MapFog } from './MapLandscape';
import { StationMarkers } from './StationMarkers';
import { createElement } from 'react';

const record = { stars: 2, bestScore: 1200, completions: 1 } as const;

describe('Descubrimiento de mundos en el mapa', () => {
  it('adapta la cámara al visor completo sin deformar la geografía', () => {
    for (const [width, height] of [[1440, 1080], [390, 844], [844, 390]]) {
      const view = fitMapView(FULL_MAP, width, height);
      expect(view.width / view.height).toBeCloseTo(width / height, 8);
      const center = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
      expect(center.x).toBeCloseTo(FULL_MAP.width / 2, 8);
      expect(center.y).toBeCloseTo(FULL_MAP.height / 2, 8);
      expect(view.x).toBeLessThanOrEqual(FULL_MAP.x);
      expect(view.y).toBeLessThanOrEqual(FULL_MAP.y);
    }
    const inset = 390;
    const view = fitMapView(FULL_MAP, 1440, 1080, inset);
    const screenCenter = (FULL_MAP.width / 2 - view.x) / view.width * 1440;
    expect(screenCenter).toBeCloseTo((1440 - inset) / 2, 8);
  });
  it('revela solo Palenque al comenzar, con un punto encendido y cinco apagados', () => {
    expect(WORLDS.map(world => worldDiscovered(EMPTY_PROGRESS, world))).toEqual([true, false, false, false, false, false]);
    const html = renderToStaticMarkup(createElement(StationMarkers, {
      progress: EMPTY_PROGRESS, view: FULL_MAP, selected: '1-1', onSelect: () => undefined,
    }));
    expect(html.match(/data-station=/g)).toHaveLength(6);
    expect(html).toContain('1-1 · Palenque · Disponible');
    expect(html).toContain('1-2 · Boca del Cerro · Bloqueado');
    expect(html).not.toContain('data-station="2-1"');
    expect(latestStation(EMPTY_PROGRESS)).toBe('1-1');
  });

  it('retira las nubes del siguiente mundo al completar el jefe', () => {
    const progress: Progress = { levels: { '1-6': record }, tickets: [] };
    const html = renderToStaticMarkup(createElement(MapFog, { progress, maskId: 'test-fog' }));
    expect(worldDiscovered(progress, WORLDS[1])).toBe(true);
    expect(html).not.toContain('data-cloud-world="golfo-campeche"');
    expect(html).toContain('data-cloud-world="yucatan-haciendas"');
    expect(html).toContain('data-cloud-world="calakmul"');
    expect(latestStation(progress)).toBe('2-1');
  });

  it('respeta récords migrados y boletos aunque falten estaciones anteriores', () => {
    const progress: Progress = { levels: { '5-3': record }, tickets: ['yucatan-haciendas'] };
    expect(worldDiscovered(progress, WORLDS[4])).toBe(true);
    expect(worldDiscovered(progress, WORLDS[2])).toBe(true);
    expect(worldDiscovered(progress, WORLDS[1])).toBe(false);
    expect(latestStation(progress)).toBe('5-4');
  });

  it('encuadra cada tramo sin deformarlo ni dejar estaciones fuera de la vista', () => {
    for (const world of WORLDS) {
      const view = worldView(world);
      expect(view.width / view.height).toBeCloseTo(FULL_MAP.width / FULL_MAP.height, 8);
      for (const level of world.levels) {
        const point = mapPoint(STATIONS[level.id]);
        expect(point.x).toBeGreaterThan(view.x);
        expect(point.x).toBeLessThan(view.x + view.width);
        expect(point.y).toBeGreaterThan(view.y);
        expect(point.y).toBeLessThan(view.y + view.height);
      }
    }
    const completed: Progress = { levels: Object.fromEntries(ALL_LEVELS.map(level => [level.id, record])), tickets: [] };
    const html = renderToStaticMarkup(createElement(MapFog, { progress: completed, maskId: 'all-fog' }));
    expect(html.match(/data-cloud-world=/g)).toHaveLength(1);
  });
});
