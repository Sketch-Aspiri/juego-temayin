import { describe, expect, it } from 'vitest';
import { componentLabels, isolateSprite } from './spriteMask';

function pixels(alphas: readonly number[]): Uint8ClampedArray {
  return new Uint8ClampedArray(alphas.flatMap(a => [120, 80, 40, a]));
}

describe('Aislamiento de las poses de un atlas', () => {
  it('conserva la silueta completa y elimina fragmentos vecinos sin alterar el color', () => {
    const rgba = pixels([255, 255, 0, 180, 255, 80, 0, 0, 0, 255, 0, 255]);
    isolateSprite(rgba, 4);
    expect(Array.from(rgba).filter((_v, i) => i % 4 === 3)).toEqual([255, 255, 0, 0, 255, 80, 0, 0, 0, 255, 0, 0]);
    for (let i = 0; i < rgba.length; i += 4) expect(Array.from(rgba.slice(i, i + 3))).toEqual([120, 80, 40]);
  });

  it('no une el último píxel de una fila con el primero de la siguiente', () => {
    const { mask } = componentLabels(pixels([0, 0, 255, 255, 255, 0]), 3);
    expect(mask[2]).not.toBe(mask[3]);
    expect(mask[3]).toBe(mask[4]);
  });

  it('conserva conexiones finas a resolución original y descarta el ruido alfa tenue', () => {
    const rgba = pixels([255, 40, 255, 0, 255, 39, 0, 0]);
    isolateSprite(rgba, 4);
    expect(rgba[2 * 4 + 3]).toBe(255);
    expect(rgba[1 * 4 + 3]).toBe(40);
    expect(rgba[5 * 4 + 3]).toBe(0);
  });

  it('admite recortes totalmente transparentes', () => {
    const rgba = pixels([0, 0, 0, 0]);
    expect(componentLabels(rgba, 2).largest).toBe(0);
    isolateSprite(rgba, 2);
    expect(rgba.every((v, i) => i % 4 !== 3 || v === 0)).toBe(true);
  });
});
