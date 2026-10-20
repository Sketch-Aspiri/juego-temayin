import { describe, expect, it } from 'vitest';
import { getNotebookEntry, NOTEBOOK_ENTRIES } from './index';
import { PLAYABLE_LEVELS, getLevel } from '../worlds';
import { STATION_PHOTOS } from '../stationInfo/photos';
import { buildLevel } from '../../engine/level/build';
import { T } from '../../engine/constants';
import { isSolidTile } from '../../engine/tiles';

describe('Catálogo del cuaderno de Toh', () => {
  it('ofrece nueve páginas breves con referencias y fotografía acreditada del entorno', () => {
    expect(NOTEBOOK_ENTRIES).toHaveLength(9);
    expect(new Set(NOTEBOOK_ENTRIES.map(entry => entry.id)).size).toBe(9);
    for (const entry of NOTEBOOK_ENTRIES) {
      expect(entry.text.split(/\s+/).length).toBeLessThanOrEqual(55);
      expect(entry.toh.length).toBeGreaterThan(20);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) expect(new URL(source.url).protocol).toBe('https:');
      expect(STATION_PHOTOS[entry.levelId].license).toBeTruthy();
    }
  });

  it('cada página tiene exactamente una marca, en su nivel y fuera de bloques o de la meta', () => {
    const marks = PLAYABLE_LEVELS.flatMap(def => buildLevel(def).discoveries.map(mark => ({ ...mark, levelId: def.id })));
    expect(marks).toHaveLength(9);
    for (const entry of NOTEBOOK_ENTRIES) {
      const matching = marks.filter(mark => mark.id === entry.id);
      expect(matching).toHaveLength(1);
      const mark = matching[0];
      expect(mark.levelId).toBe(entry.levelId);
      const level = buildLevel(getLevel(entry.levelId)!);
      const tx = Math.floor(mark.x / T), ty = Math.floor(mark.y / T);
      expect(tx).toBeGreaterThan(3);
      expect(mark.x / T).toBeLessThan(level.flagX - 2);
      expect(isSolidTile(level.grid[ty][tx]), entry.id).toBe(false);
      expect(isSolidTile(level.grid[Math.floor((mark.y + mark.h - 1) / T)][Math.floor((mark.x + mark.w - 1) / T)]), entry.id).toBe(false);
    }
    for (const mark of marks) expect(getNotebookEntry(mark.id)).toBeDefined();
  });
});
