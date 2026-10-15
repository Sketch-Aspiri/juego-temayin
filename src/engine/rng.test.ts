import { describe, expect, it } from 'vitest';
import { makeRng } from './rng';

describe('azar sembrado del motor', () => {
  it('devuelve la misma secuencia para la misma semilla', () => {
    // Organizar
    const a = makeRng(0x1a3a);
    const b = makeRng(0x1a3a);
    // Actuar
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    // Comprobar
    expect(seqA).toEqual(seqB);
  });

  it('produce valores en [0, 1) y secuencias distintas con semillas distintas', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const seqA = Array.from({ length: 500 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(seqA.slice(0, 5)).not.toEqual(seqB);
  });
});
