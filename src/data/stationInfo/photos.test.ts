import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../worlds';
import { STATIONS } from '../stations';
import { STATION_PHOTOS } from './photos';

describe('Fotografías reales de las fichas', () => {
  it('incluye una fotografía local acreditada para cada destino de la campaña', () => {
    expect(Object.keys(STATION_PHOTOS).sort()).toEqual(ALL_LEVELS.map(level => level.id).sort());
    const files = new Set<string>();
    let totalBytes = 0;
    for (const [id, photo] of Object.entries(STATION_PHOTOS)) {
      expect(photo.file).toBe(`estaciones/${id}.webp`);
      files.add(photo.file);
      const path = resolve('public/assets', photo.file);
      const header = readFileSync(path).subarray(0, 12).toString('ascii');
      expect(header.startsWith('RIFF') && header.endsWith('WEBP')).toBe(true);
      expect(photo.width).toBeGreaterThanOrEqual(400);
      expect(photo.height).toBeGreaterThanOrEqual(200);
      expect(Math.max(photo.width, photo.height)).toBeLessThanOrEqual(800);
      expect(photo.alt.length).toBeGreaterThan(25);
      expect(photo.caption.length).toBeGreaterThan(10);
      expect(photo.author.length).toBeGreaterThan(1);
      expect(photo.author).not.toMatch(/<[^>]+>/);
      expect(photo.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(photo.license).toMatch(/^(CC BY|CC0|Dominio público)/);
      expect(photo.licenseUrl).toMatch(/^https?:\/\/creativecommons\.org\//);
      if (STATIONS[id].kind === 'fiction') {
        expect(photo.scope).toBe('surroundings');
        expect(photo.caption).toMatch(/fictici/);
      }
      totalBytes += statSync(path).size;
    }
    expect(files.size).toBe(39);
    expect(totalBytes).toBeLessThan(4 * 1024 * 1024);
  });
});
