import { describe, expect, it } from 'vitest';
import { PAINTED_ART } from '../engine/render/artCache';
import { CHIVO_ART_FILES, CHIVO_EFFECT_FILE, CHIVO_EFFECTS, CHIVO_EYES, CHIVO_POSES } from './huayChivoArt';

interface Atlas { width: number; height: number; alpha: boolean }
const atlases = import.meta.glob<Atlas>('../../public/assets/**/*.atlas.json', { eager: true, import: 'default' });
const images = import.meta.glob('../../public/assets/**/*.webp', { eager: true, query: '?url', import: 'default' });
const originals = import.meta.glob('../../imagenes/nuevos/**/*.png', { eager: true, query: '?url', import: 'default' });
const prompts = import.meta.glob<string>('../../imagenes/nuevos/**/*.prompt.txt', { eager: true, query: '?raw', import: 'default' });

describe('Arte del combate del Huay Chivo', () => {
  it.each(CHIVO_ART_FILES)('devuelve original, prompt, alfa y precarga de %s', file => {
    const runtime = `../../public/assets/${file}`;
    const source = `../../imagenes/nuevos/${file.replace('bosses/', 'jefes/').replace('.webp', '.png')}`;
    expect(images[runtime]).toBeDefined();
    expect(originals[source]).toBeDefined();
    expect(prompts[source.replace('.png', '.prompt.txt')]).toMatch(/Use case:/);
    expect(atlases[runtime.replace('.webp', '.atlas.json')].alpha).toBe(true);
    expect(PAINTED_ART).toContain(file);
  });

  it('devuelve recortes internos y anclas de pezuñas con escala anatómica uniforme', () => {
    for (const [id, pose] of Object.entries(CHIVO_POSES)) {
      const atlas = atlases[`../../public/assets/${pose.file.replace('.webp', '.atlas.json')}`];
      const [x, y, w, h] = pose.frame;
      expect(x + w).toBeLessThanOrEqual(atlas.width);
      expect(y + h).toBeLessThanOrEqual(atlas.height);
      expect(pose.anchor[0]).toBeGreaterThanOrEqual(x);
      expect(pose.anchor[0]).toBeLessThanOrEqual(x + w);
      expect(pose.anchor[1]).toBeGreaterThanOrEqual(y);
      expect(pose.anchor[1]).toBeLessThanOrEqual(y + h);
      expect(pose.scale).toBe(CHIVO_POSES.rest.scale);
      const eye = CHIVO_EYES[id as keyof typeof CHIVO_POSES];
      expect(eye[0]).toBeGreaterThanOrEqual(x);
      expect(eye[0]).toBeLessThanOrEqual(x + w);
      expect(eye[1]).toBeGreaterThanOrEqual(y);
      expect(eye[1]).toBeLessThanOrEqual(y + h);
    }
    const atlas = atlases[`../../public/assets/${CHIVO_EFFECT_FILE.replace('.webp', '.atlas.json')}`];
    for (const [x, y, w, h] of Object.values(CHIVO_EFFECTS)) {
      expect(x + w).toBeLessThanOrEqual(atlas.width);
      expect(y + h).toBeLessThanOrEqual(atlas.height);
    }
  });
});
