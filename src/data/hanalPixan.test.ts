import { describe, expect, it } from 'vitest';
import { cinematicBeforeLevel, CINEMATICS } from './cinematics';
import { HANAL_PIXAN_ART_FILES, HANAL_PIXAN_ENEMIES, HANAL_PIXAN_SPRITES } from './hanalPixanArt';
import { HANAL_PIXAN_LEVEL as level } from './levels/seasonal/hanal-pixan';
import { ALL_LEVELS, getLevel, nextLevelId, PLAYABLE_LEVELS } from './worlds';
import { EMPTY_PROGRESS, isUnlocked, recordCompletion, sanitizeProgress } from '../store/progress';
import { PAINTED_ART } from '../engine/render/artCache';

describe('Especial de temporada Hanal Pixán', () => {
  it('está disponible antes de Palenque sin alterar la campaña ni sus bloqueos', () => {
    expect(PLAYABLE_LEVELS[0]).toBe(level);
    expect(ALL_LEVELS[0].id).toBe('1-1');
    expect(ALL_LEVELS).not.toContain(level);
    expect(isUnlocked(EMPTY_PROGRESS, level.id)).toBe(true);
    expect(isUnlocked(EMPTY_PROGRESS, '1-1')).toBe(true);
    expect(isUnlocked(EMPTY_PROGRESS, '1-2')).toBe(false);
    expect(nextLevelId(level.id)).toBe('1-1');
    expect(getLevel(level.id)).toBe(level);
  });

  it('guarda su récord junto a los antiguos sin desbloquear otros niveles', () => {
    const old = { bestScore: 1000, stars: 2 as const, completions: 1 };
    const previous = sanitizeProgress({ levels: { '1-6': old } });
    const progress = recordCompletion(previous, { levelId: level.id, score: 400, stars: 1,
      coinRatio: 0.3, deaths: 0, session: { score: 400, coins: 5, lives: 3 } });
    expect(sanitizeProgress(progress)).toEqual(progress);
    expect(progress.levels['1-6']).toEqual(old);
    expect(previous.levels[level.id]).toBeUndefined();
    expect(isUnlocked(progress, '1-2')).toBe(false);
  });

  it('tiene una cinemática previa propia y alebrijes para cada enemigo del recorrido', () => {
    expect(cinematicBeforeLevel(level.id)).toBe(CINEMATICS['hanal-pixan']);
    expect(cinematicBeforeLevel('1-1')).toBeUndefined();
    expect(CINEMATICS['hanal-pixan'].scenes[0].text).toContain('nivel especial de temporada');
    for (const op of level.ops) if (op[0] === 'spawn') expect(HANAL_PIXAN_ENEMIES[op[1]]).toBeDefined();
    const files = new Set(Object.keys(import.meta.glob('../../public/assets/**/*.webp')));
    for (const file of HANAL_PIXAN_ART_FILES) {
      expect(files.has(`../../public/assets/${file}`), file).toBe(true);
      expect(PAINTED_ART).toContain(file);
    }
    for (const art of Object.values(HANAL_PIXAN_SPRITES)) {
      expect(art.frame[0] + art.frame[2]).toBeLessThanOrEqual(art.sheetW);
      expect(art.frame[1] + art.frame[3]).toBeLessThanOrEqual(art.sheetH);
    }
  });
});
