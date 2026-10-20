import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getNotebookEntry, NOTEBOOK_ENTRIES } from './index';
import { getNotebookPhoto } from './photos';
import { ALL_LEVELS, BONUS_LEVELS, PLAYABLE_LEVELS, getLevel } from '../worlds';
import { STATION_PHOTOS } from '../stationInfo/photos';
import { buildLevel } from '../../engine/level/build';
import { T } from '../../engine/constants';
import { isSolidTile } from '../../engine/tiles';
import { NUMERAL_ILLUSTRATIONS } from './numeralIllustrations';
import { parseTerm } from '../../engine/entities/numerals';

describe('Catálogo del cuaderno de Toh', () => {
  it('ofrece cien páginas breves con referencias, fotografías acreditadas, apuntes de campo y códice', () => {
    expect(NOTEBOOK_ENTRIES).toHaveLength(100);
    expect(new Set(NOTEBOOK_ENTRIES.map(entry => entry.id)).size).toBe(100);
    expect(new Set(NOTEBOOK_ENTRIES.map(entry => entry.title)).size).toBe(100);
    expect(new Set(NOTEBOOK_ENTRIES.map(entry => entry.text)).size).toBe(100);
    for (const entry of NOTEBOOK_ENTRIES) {
      expect(entry.text.split(/\s+/).length).toBeLessThanOrEqual(55);
      expect(entry.toh.length).toBeGreaterThan(20);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const source of entry.sources) expect(new URL(source.url).protocol).toBe('https:');
      // El códice lleva ilustraciones de numerales; las páginas de campo conservan fotografías acreditadas.
      if (entry.place === 'Códice maya') expect(getNotebookPhoto(entry.id)).toBeUndefined();
      else expect(getNotebookPhoto(entry.id)?.license, entry.id).toBeTruthy();
    }
  });

  it('cada fotografía existe, tiene crédito y no se comparte entre páginas ni con la ficha de la estación', () => {
    const photos = NOTEBOOK_ENTRIES.flatMap(entry => {
      const photo = getNotebookPhoto(entry.id);
      return photo ? [{ entry, photo }] : [];
    });
    expect(photos).toHaveLength(78);
    expect(new Set(photos.map(({ photo }) => photo.file)).size).toBe(photos.length);
    for (const { entry, photo } of photos) {
      expect(existsSync(resolve('public/assets', photo.file)), entry.id).toBe(true);
      expect(photo.author, entry.id).toBeTruthy();
      expect(photo.licenseUrl.startsWith('https://'), entry.id).toBe(true);
      expect(photo.sourceUrl.startsWith('https://commons.wikimedia.org/'), entry.id).toBe(true);
      expect(photo.alt.length, entry.id).toBeGreaterThan(20);
      expect(photo.file, entry.id).not.toBe(STATION_PHOTOS[entry.levelId]?.file);
    }
  });

  it('ilustra las 22 páginas del códice con numerales válidos y no añade diagramas a páginas ajenas', () => {
    const codex = NOTEBOOK_ENTRIES.filter(entry => entry.place === 'Códice maya');
    expect(Object.keys(NUMERAL_ILLUSTRATIONS).sort()).toEqual(codex.map(entry => entry.id).sort());
    for (const entry of codex) {
      const tokens = NUMERAL_ILLUSTRATIONS[entry.id];
      expect(tokens.length).toBeGreaterThan(1);
      expect(() => tokens.forEach(parseTerm)).not.toThrow();
    }
  });

  it('reparte 78 páginas por toda la campaña y 22 por los siete secretos', () => {
    const count = (levelId: string) => NOTEBOOK_ENTRIES.filter(entry => entry.levelId === levelId).length;
    expect(ALL_LEVELS.reduce((sum, level) => sum + count(level.id), 0)).toBe(78);
    expect(BONUS_LEVELS.reduce((sum, level) => sum + count(level.id), 0)).toBe(22);
    for (const level of ALL_LEVELS) expect(count(level.id), level.id).toBeGreaterThanOrEqual(1);
    for (const level of BONUS_LEVELS) expect(count(level.id), level.id).toBe(level.id === '7-extra' ? 4 : 3);
  });

  it('cada página tiene exactamente una marca, en su nivel y fuera de bloques o de la meta', () => {
    const marks = PLAYABLE_LEVELS.flatMap(def => buildLevel(def).discoveries.map(mark => ({ ...mark, levelId: def.id })));
    expect(marks).toHaveLength(NOTEBOOK_ENTRIES.length);
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
