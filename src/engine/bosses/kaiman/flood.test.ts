import { describe, expect, it } from 'vitest';
import type { WaterZone } from '../../level/zones';
import { arenaSurface, floodArena, risingSurface } from './flood';

const zones: readonly WaterZone[] = [
  { x0: 10, x1: 20, surface: 11 },
  { x0: 62, x1: 83, surface: 11.5 },
];

describe('crecida del pantano', () => {
  it('encuentra la superficie del agua de la arena', () => {
    expect(arenaSurface(zones, 62, 83)).toBe(11.5);
    expect(arenaSurface(zones, 30, 40)).toBeNull();
  });

  it('sube solo el agua de la arena y sin mutar las zonas', () => {
    const out = floodArena(zones, 62, 83, 10.75);
    expect(out[1].surface).toBe(10.75);
    expect(out[0]).toBe(zones[0]);
    expect(zones[1].surface).toBe(11.5);
  });

  it('el agua nunca baja', () => {
    const out = floodArena(zones, 62, 83, 12);
    expect(out[1].surface).toBe(11.5);
  });

  it('interpola la superficie según el progreso (acotado a 0..1)', () => {
    expect(risingSurface(11.5, 10.5, 0.5)).toBeCloseTo(11);
    expect(risingSurface(11.5, 10.5, 2)).toBe(10.5);
    expect(risingSurface(11.5, 10.5, -1)).toBe(11.5);
  });
});
