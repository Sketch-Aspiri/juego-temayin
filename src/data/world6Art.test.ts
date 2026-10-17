import { describe, expect, it } from 'vitest';
import { LORENCILLO_ACTIONS_FILE, LORENCILLO_POSES, LORENCILLO_STATE_POSE } from './lorencilloArt';
import { BAY_ART, COAST_TILES_FILE, SHIP_RIGGING, WORLD6_ART_FILES } from './world6Art';
import { PAINTED_ART } from '../engine/render/artCache';
import { TERRAIN_SPRITES } from './terrainSprites';
import { THEMES } from '../engine/render/themes';
import { MAIN_MAST_FRACTION } from '../engine/bosses/lorencillo/tuning';

interface Atlas { readonly width: number; readonly height: number; readonly alpha: boolean }
const atlases = import.meta.glob<Atlas>('../../public/assets/**/*.atlas.json', { eager: true, import: 'default' });

describe('Arte del Mundo 6', () => {
  it('precarga los cuatro recursos nuevos con sus metadatos de exportación', () => {
    for (const file of WORLD6_ART_FILES) {
      expect(PAINTED_ART).toContain(file);
      expect(atlases[`../../public/assets/${file.replace('.webp', '.atlas.json')}`]).toBeDefined();
    }
    expect(WORLD6_ART_FILES).toContain(BAY_ART.file);
    expect(WORLD6_ART_FILES).toContain(SHIP_RIGGING.file);
  });

  it('todas las poses tienen escala común, ancla en el recorte y límites válidos', () => {
    const scales = new Set(Object.values(LORENCILLO_POSES).map(pose => pose.scale));
    expect(scales.size).toBe(1);
    for (const pose of Object.values(LORENCILLO_POSES)) {
      const atlas = atlases[`../../public/assets/${pose.file.replace('.webp', '.atlas.json')}`];
      const [x, y, w, h] = pose.frame;
      expect(atlas.alpha).toBe(true);
      expect(x + w).toBeLessThanOrEqual(atlas.width);
      expect(y + h).toBeLessThanOrEqual(atlas.height);
      expect(pose.anchor[0]).toBeGreaterThanOrEqual(x);
      expect(pose.anchor[0]).toBeLessThanOrEqual(x + w);
      expect(pose.anchor[1]).toBe(y + h);
    }
  });

  it('cañonear, trepar y la transición tienen poses propias, además del lanzamiento', () => {
    const ids = ['cannon', 'mast', 'rally'] as const;
    expect(new Set(ids.map(id => LORENCILLO_STATE_POSE[id])).size).toBe(ids.length);
    for (const id of ids) expect(LORENCILLO_POSES[LORENCILLO_STATE_POSE[id]].file).toBe(LORENCILLO_ACTIONS_FILE);
    expect(LORENCILLO_POSES.throw.file).toBe(LORENCILLO_ACTIONS_FILE);
    expect(MAIN_MAST_FRACTION).toBe(SHIP_RIGGING.mast);
  });

  it('los vagones y la cubierta usan las cuatro variantes opacas del atlas', () => {
    const atlas = atlases[`../../public/assets/${COAST_TILES_FILE.replace('.webp', '.atlas.json')}`];
    expect(atlas.alpha).toBe(false);
    for (const id of ['trainRoof', 'trainSide', 'shipDeck', 'shipHull'] as const) {
      const sprite = TERRAIN_SPRITES[id]!;
      expect(sprite.file).toBe(COAST_TILES_FILE);
      expect(sprite.columns).toBe(4);
      expect(sprite.frame[0] + sprite.frame[2] * sprite.columns!).toBeLessThanOrEqual(atlas.width);
      expect(sprite.frame[1] + sprite.frame[3]).toBeLessThanOrEqual(atlas.height);
    }
    expect(THEMES.bay.groundTop).toBe('shipDeck');
    expect(THEMES.bay.groundBody).toBe('shipHull');
  });
});
