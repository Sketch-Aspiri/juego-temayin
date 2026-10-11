import { describe, expect, it } from 'vitest';
import { componentLabels, isolatedArt } from './art';

describe('Recortes de Capitán Sargazo', () => {
  it('conserva la silueta completa y separa fragmentos vecinos sin unir bordes de filas', () => {
    // Cuerpo en dos filas, fragmento aislado a la derecha y otro al inicio de la siguiente.
    const alpha = [1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1];
    const pixels = new Uint8ClampedArray(alpha.length * 4);
    alpha.forEach((a, i) => { pixels[i * 4 + 3] = a * 255; });
    const { mask, largest } = componentLabels(pixels, 5);
    expect([mask[0], mask[1], mask[5], mask[6]]).toEqual([largest, largest, largest, largest]);
    expect(mask[4]).not.toBe(largest); expect(mask[14]).not.toBe(largest);
    expect(mask[2]).toBe(0);
  });

  it('mantiene el respaldo procedural cuando no hay DOM', () => {
    expect(isolatedArt([531, 542, 491, 422])).toBeNull();
  });
});
