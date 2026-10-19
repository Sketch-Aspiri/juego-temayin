import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from './worlds';
import { MAP_BOUNDS, MAP_HEIGHT, MAP_WIDTH, projectPosition, STATIONS } from './stations';
import { PENINSULA_LAND } from './peninsulaGeography';

describe('Cartografía de la campaña', () => {
  it('sitúa todos los niveles principales dentro de la misma proyección', () => {
    expect(Object.keys(STATIONS).sort()).toEqual(ALL_LEVELS.map(level => level.id).sort());
    for (const level of ALL_LEVELS) {
      const station = STATIONS[level.id];
      const point = projectPosition(station);
      expect(station.label).toBe(level.name);
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(1);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(1);
    }
  });

  it('conserva norte, este y distancias con la escala del paralelo 20', () => {
    const merida = projectPosition(STATIONS['3-2']);
    const cancun = projectPosition(STATIONS['5-1']);
    const palenque = projectPosition(STATIONS['1-1']);
    expect(merida.y).toBeLessThan(palenque.y);
    expect(cancun.x).toBeGreaterThan(merida.x);
    const eastWestKm = (MAP_BOUNDS.east - MAP_BOUNDS.west) * Math.cos(20 * Math.PI / 180);
    const northSouthKm = MAP_BOUNDS.north - MAP_BOUNDS.south;
    expect(MAP_WIDTH / MAP_HEIGHT).toBeCloseTo(eastWestKm / northSouthKm, 8);
  });

  it('distingue estaciones verificables, lugares turísticos y escenarios ficticios', () => {
    const osmIds = Object.values(STATIONS).filter(station => station.kind === 'station').map(station => station.osmWay);
    expect(new Set(osmIds).size).toBe(osmIds.length);
    expect(osmIds.every(id => Number.isSafeInteger(id))).toBe(true);
    expect(STATIONS['3-4'].reference).toContain('Hacienda');
    expect(STATIONS['4-2'].kind).toBe('fiction');
    expect(STATIONS['5-4'].kind).toBe('place');
    expect(PENINSULA_LAND.map(land => land.name)).toEqual(expect.arrayContaining(['Mexico', 'Belize', 'Guatemala']));
  });
});
