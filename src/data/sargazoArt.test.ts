import { describe, expect, it } from 'vitest';
import { PAINTED_ART } from '../engine/render/artCache';
import { AKUMAL_TURTLES, SARGAZO_ACTION_FILE, SARGAZO_ALLY_FILE, SARGAZO_ARENA_FILE,
  SARGAZO_ART_FILES, SARGAZO_EFFECTS, SARGAZO_POSES } from './sargazoArt';

interface Atlas { width: number; height: number; alpha: boolean }
const atlases = import.meta.glob<Atlas>('../../public/assets/**/*.atlas.json', { eager: true, import: 'default' });
const images = import.meta.glob('../../public/assets/**/*.webp', { eager: true, query: '?url', import: 'default' });
const originals = import.meta.glob('../../imagenes/nuevos/**/*.png', { eager: true, query: '?url', import: 'default' });
const prompts = import.meta.glob<string>('../../imagenes/nuevos/**/*.prompt.txt', { eager: true, query: '?raw', import: 'default' });

describe('Arte submarino de Akumal', () => {
  it.each(SARGAZO_ART_FILES)('devuelve original, prompt, atlas y precarga de %s', file => {
    const runtime = `../../public/assets/${file}`;
    const source = `../../imagenes/nuevos/${file.replace('bosses/', 'jefes/').replace('.webp', '.png')}`;
    expect(images[runtime]).toBeDefined(); expect(originals[source]).toBeDefined();
    expect(prompts[source.replace('.png', '.prompt.txt')]).toMatch(/Use case:/);
    expect(atlases[runtime.replace('.webp', '.atlas.json')].alpha).toBe(file !== SARGAZO_ARENA_FILE);
    expect(PAINTED_ART).toContain(file);
  });

  it('devuelve recortes internos y anclas del caparazón dentro de cada pose', () => {
    for (const [file, frames] of [[SARGAZO_ACTION_FILE, Object.values(SARGAZO_POSES)],
      [SARGAZO_ALLY_FILE, [...Object.values(SARGAZO_EFFECTS), ...Object.values(AKUMAL_TURTLES).map(t => t.frame)]]] as const) {
      const atlas = atlases[`../../public/assets/${file.replace('.webp', '.atlas.json')}`];
      for (const [x, y, w, h] of frames) {
        expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0);
        expect(w).toBeGreaterThan(0); expect(h).toBeGreaterThan(0);
        expect(x + w).toBeLessThanOrEqual(atlas.width); expect(y + h).toBeLessThanOrEqual(atlas.height);
      }
    }
    for (const { frame: [x, y, w, h], anchor: [ax, ay] } of Object.values(AKUMAL_TURTLES)) {
      expect(ax).toBeGreaterThanOrEqual(x); expect(ax).toBeLessThanOrEqual(x + w);
      expect(ay).toBeGreaterThanOrEqual(y); expect(ay).toBeLessThanOrEqual(y + h);
    }
  });
});
