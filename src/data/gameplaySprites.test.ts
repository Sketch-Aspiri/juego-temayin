import { describe, expect, it } from 'vitest';
import { GAMEPLAY_SPRITES } from './gameplaySprites';
import { NEW_GAMEPLAY_SPRITES } from './newGameplaySprites';
import { PAINTED_ART } from '../engine/render/artCache';

interface Atlas { readonly width: number; readonly height: number; readonly alpha: boolean }
const atlases = import.meta.glob<Atlas>('../../public/assets/**/*.atlas.json', { eager: true, import: 'default' });
const runtimeImages = import.meta.glob<string>('../../public/assets/**/*.webp', { eager: true, query: '?url', import: 'default' });
const sourceImages = import.meta.glob<string>('../../imagenes/nuevos/**/*.png', { eager: true, query: '?url', import: 'default' });
const prompts = import.meta.glob<string>('../../imagenes/nuevos/**/*.prompt.txt', { eager: true, query: '?raw', import: 'default' });

describe('Cobertura del arte jugable', () => {
  it.each(Object.entries({ ...GAMEPLAY_SPRITES, ...NEW_GAMEPLAY_SPRITES }))('%s tiene arte, recorte válido y precarga', (_id, sprite) => {
    const runtime = `../../public/assets/${sprite.file}`;
    expect(runtimeImages[runtime]).toBeDefined();
    const atlas = atlases[runtime.replace('.webp', '.atlas.json')];
    const [x, y, w, h] = sprite.frame;
    expect(atlas.alpha).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    expect(x + w).toBeLessThanOrEqual(atlas.width);
    expect(y + h).toBeLessThanOrEqual(atlas.height);
    expect(sprite.anchor.every(value => value >= 0 && value <= 1)).toBe(true);
    expect(PAINTED_ART).toContain(sprite.file);
  });

  it('conserva los originales y los prompts de todos los sprites nuevos', () => {
    for (const sprite of Object.values(NEW_GAMEPLAY_SPRITES)) {
      const source = sprite.file.replace('bosses/', 'jefes/').replace('.webp', '.png');
      const path = `../../imagenes/nuevos/${source}`;
      expect(sourceImages[path]).toBeDefined();
      expect(prompts[path.replace('.png', '.prompt.txt')]).toContain('stylized-concept');
    }
  });
});
