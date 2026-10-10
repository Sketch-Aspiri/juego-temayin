import { describe, expect, it } from 'vitest';
import { T } from '../constants';
import { buildLevel } from './build';
import type { LevelDef } from './types';
import { currentAt, waterAt } from './zones';

const def: LevelDef = {
  id: 'prueba',
  name: 'Prueba',
  width: 40,
  theme: 'river',
  ops: [
    ['pit', 10, 14],
    ['water', 10, 14, 11],
    ['current', 10, 14, 11, 13, 2, -1],
    ['flag', 30],
  ],
};

describe('zonas de agua y corrientes', () => {
  const lvl = buildLevel(def);

  it('buildLevel traduce las ops water y current a zonas sin tocar la cuadrícula', () => {
    expect(lvl.water).toEqual([{ x0: 10, x1: 14, surface: 11 }]);
    expect(lvl.currents).toEqual([{ x0: 10, x1: 14, y0: 11, y1: 13, vx: 2, vy: -1 }]);
    expect(lvl.grid[11][12]).toBe(' ');
  });

  it('un nivel sin agua no tiene zonas', () => {
    const dry = buildLevel({ ...def, ops: [['flag', 30]] });
    expect(dry.water).toEqual([]);
    expect(dry.currents).toEqual([]);
  });

  it('waterAt encuentra el agua por debajo de la superficie', () => {
    expect(waterAt(lvl.water, 12 * T, 11.5 * T)).toEqual(lvl.water[0]);
    expect(waterAt(lvl.water, 12 * T, 10.5 * T)).toBeNull();
    expect(waterAt(lvl.water, 20 * T, 12 * T)).toBeNull();
  });

  it('currentAt encuentra la corriente dentro de su rectángulo', () => {
    expect(currentAt(lvl.currents, 14.9 * T, 13.9 * T)?.vx).toBe(2);
    expect(currentAt(lvl.currents, 15 * T, 12 * T)).toBeNull();
  });
});
