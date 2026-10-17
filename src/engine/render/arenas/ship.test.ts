import { describe, expect, it } from 'vitest';
import { shipAngle } from './ship';

describe('shipAngle', () => {
  it('sin escora solo hay un vaivén casi imperceptible', () => {
    expect(Math.abs(shipAngle(0, 500))).toBeLessThan(0.01);
  });

  it('inclina el decorado hacia el lado de la deriva y de forma bien visible', () => {
    expect(shipAngle(1, 0)).toBeGreaterThan(0.08);
    expect(shipAngle(-1, 0)).toBeLessThan(-0.08);
  });
});
