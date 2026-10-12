import { describe, expect, it } from 'vitest';
import { GROUND, ROWS } from '../../engine/constants';
import { buildLevel } from '../../engine/level/build';
import type { Op } from '../../engine/level/types';
import { isSolidTile } from '../../engine/tiles';
import { waterBank } from './waterBanks';

const gridFor = (ops: readonly Op[]) => buildLevel({ id: 'orilla', name: 'Orilla', width: 24, theme: 'beach', ops }).grid;

describe('Orillas sólidas de los niveles', () => {
  it.each([1, -1] as const)('contiene el agua y baja hacia tierra en dirección %s', direction => {
    const grid = gridFor(waterBank(12, 3, direction));
    for (let step = 0; step < 5; step++) {
      const x = 12 - step * direction, top = 3 + step * 2;
      expect(grid[top - 1][x]).toBe(' ');
      for (let y = top; y < ROWS; y++) expect(isSolidTile(grid[y][x])).toBe(true);
    }
    expect(grid[GROUND - 1][12 + direction]).toBe(' ');
  });

  it('contiene superficies fraccionarias y conserva un zócalo al abrir la arena', () => {
    const grid = gridFor([['wall', 12], ...waterBank(12, 10.75, -1)]);
    expect(grid[0][12]).toBe('X');
    for (let y = 10; y < ROWS; y++) expect(grid[y][12]).toBe('G');
  });
});
