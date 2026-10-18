import { describe, expect, it } from 'vitest';
import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import { AudioEngine } from '../audio';
import { T } from '../constants';
import { Input } from '../input';
import { World } from '../World';
import { gardenSurface } from './hanalGarden';

describe('Flores y velas del sendero', () => {
  const w = new World({ def: HANAL_PIXAN_LEVEL, input: new Input(), audio: new AudioEngine(),
    session: { coins: 0, score: 0, lives: 3 } });
  it('deja libres los barrancos, el agua y sus bordes', () => {
    for (const op of HANAL_PIXAN_LEVEL.ops) {
      if (op[0] !== 'pit') continue;
      for (let x = op[1]; x <= op[2]; x++) expect(gardenSurface(w, x * T)).toBeNull();
    }
    expect(gardenSurface(w, 353 * T)).toBeNull();
  });
  it('apoya el decorado sobre el terreno real, incluso en los escalones', () => {
    expect(gardenSurface(w, 8 * T)).toBe(12 * T);
    expect(gardenSurface(w, 568 * T)).toBe(9 * T);
  });
});
