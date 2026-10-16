import { describe, expect, it } from 'vitest';
import { buildLevel } from '../../../engine/level/build';
import { waterAt } from '../../../engine/level/zones';
import { T } from '../../../engine/constants';
import { isSolidTile } from '../../../engine/tiles';
import { LEVEL_5_6 } from './5-6-akumal';

describe('Arena acuática de Akumal', () => {
  it('devuelve agua continua y ningún bloque de refugio en todas las columnas de combate', () => {
    const level = buildLevel(LEVEL_5_6);
    const [left, right] = LEVEL_5_6.boss!.arena;
    for (let x = left; x <= right; x++) {
      expect(waterAt(level.water, (x + 0.5) * T, 4 * T)).not.toBeNull();
      for (let y = 0; y < 12; y++) expect(isSolidTile(level.grid[y][x]), `${x},${y}`).toBe(false);
    }
    expect(level.platforms.filter(p => p.kind === 'mover' && p.appearance === 'turtle' && p.x >= left)).toHaveLength(3);
  });
});
