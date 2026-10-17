import { describe, expect, it } from 'vitest';
import { isThermal } from './wind';

describe('isThermal', () => {
  it('trata como térmica la zona cuyo eje dominante es vertical (se dibuja con chevrones, no con rayas de lluvia)', () => {
    expect(isThermal({ vx: 0, vy: -6 })).toBe(true);
    expect(isThermal({ vx: 1, vy: 5 })).toBe(true);
  });

  it('trata como viento horizontal el resto', () => {
    expect(isThermal({ vx: -7, vy: 0 })).toBe(false);
    expect(isThermal({ vx: 6, vy: -1 })).toBe(false);
  });
});
