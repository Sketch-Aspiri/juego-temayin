import { describe, expect, it } from 'vitest';
import { ALL_CINEMATICS, CINEMATIC_FILES, CINEMATICS, cinematicAfterLevel } from './cinematics';
import { getLevel } from './worlds';

const PUBLIC_FILES = new Set(Object.keys(import.meta.glob('../../public/assets/**/*.webp')));

describe('Catálogo ampliable de cinemáticas', () => {
  it('registra el prólogo y la victoria del primer jefe sin duplicar desbloqueos', () => {
    expect(CINEMATICS.intro.afterLevel).toBeUndefined();
    expect(cinematicAfterLevel('1-6')).toBe(CINEMATICS['puas-victory']);
    expect(cinematicAfterLevel('1-1')).toBeUndefined();
    const levels = ALL_CINEMATICS.flatMap(cinematic => cinematic.afterLevel ? [cinematic.afterLevel] : []);
    expect(new Set(levels).size).toBe(levels.length);
    for (const level of levels) expect(getLevel(level)).toBeDefined();
    for (const [id, cinematic] of Object.entries(CINEMATICS)) expect(cinematic.id).toBe(id);
  });

  it('precarga imágenes existentes de todas las escenas y portadas', () => {
    for (const file of CINEMATIC_FILES) expect(PUBLIC_FILES.has(`../../public/assets/${file}`), file).toBe(true);
    for (const cinematic of ALL_CINEMATICS) {
      expect(CINEMATIC_FILES).toContain(cinematic.cover.background);
      expect(CINEMATIC_FILES).toContain(cinematic.cover.actor.file);
      for (const scene of cinematic.scenes) {
        expect(CINEMATIC_FILES).toContain(scene.background);
        for (const actor of scene.actors) expect(CINEMATIC_FILES).toContain(actor.sprite.file);
      }
    }
  });

  it.each(ALL_CINEMATICS)('$title tiene escenas completas, únicas y adaptadas a vertical', cinematic => {
    expect(cinematic.scenes.length).toBeGreaterThan(0);
    expect(new Set(cinematic.scenes.map(scene => scene.id)).size).toBe(cinematic.scenes.length);
    for (const scene of cinematic.scenes) {
      expect(scene.text.length).toBeGreaterThan(10);
      for (const actor of scene.actors) {
        const [x, y, w, h] = actor.sprite.frame;
        expect(x + w).toBeLessThanOrEqual(actor.sprite.sheetW);
        expect(y + h).toBeLessThanOrEqual(actor.sprite.sheetH);
        expect(actor.portrait, scene.id).toBeDefined();
        if (!actor.portrait) continue;
        const { x: center, bottom, height } = actor.portrait;
        const width = height * 1.25 * w / h;
        expect(center - width / 2, scene.id).toBeGreaterThanOrEqual(0);
        expect(center + width / 2, scene.id).toBeLessThanOrEqual(100);
        expect(bottom + height, scene.id).toBeLessThanOrEqual(100);
      }
    }
  });
});
