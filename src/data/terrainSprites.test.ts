import { describe, expect, it } from 'vitest';
import { MUD_TERRAIN_SPRITES, TERRAIN_SPRITES } from './terrainSprites';
import { THEMES } from '../engine/render/themes';
import { PAINTED_ART } from '../engine/render/artCache';

interface Atlas {
  readonly width: number;
  readonly height: number;
  readonly alpha: boolean;
  readonly frames: readonly { x: number; y: number; width: number; height: number }[];
}

const atlases = import.meta.glob<Atlas>('../../public/assets/terreno/*.atlas.json', { eager: true, import: 'default' });

describe('Suelo pintado de pantano y manglar', () => {
  it('cubre el atlas completo con 24 recortes contiguos, sin márgenes transparentes', () => {
    const atlas = atlases['../../public/assets/terreno/suelo-pantano.atlas.json'];
    const rectangles = new Set(atlas.frames.map(frame => `${frame.x},${frame.y}`));
    expect(atlas.alpha).toBe(false);
    expect(rectangles.size).toBe(24);
    expect(atlas.frames.reduce((area, frame) => area + frame.width * frame.height, 0)).toBe(atlas.width * atlas.height);
    for (const sprite of Object.values(MUD_TERRAIN_SPRITES)) {
      const [x, y, width, height] = sprite.frame;
      const rows = 'rows' in sprite ? sprite.rows : 1;
      expect(x + width * sprite.columns).toBe(atlas.width);
      expect(y + height * rows).toBeLessThanOrEqual(atlas.height);
      for (let row = 0; row < rows; row++) for (let column = 0; column < sprite.columns; column++) {
        expect(rectangles.has(`${x + column * width},${y + row * height}`)).toBe(true);
      }
    }
  });

  it.each(['swamp', 'mangrove'] as const)('el tema %s usa el suelo mejorado y lo precarga', theme => {
    expect(TERRAIN_SPRITES[THEMES[theme].groundTop]).toBe(MUD_TERRAIN_SPRITES.mudTop);
    expect(TERRAIN_SPRITES[THEMES[theme].groundBody]).toBe(MUD_TERRAIN_SPRITES.mud);
    expect(PAINTED_ART.filter(file => file === MUD_TERRAIN_SPRITES.mud.file)).toHaveLength(1);
  });
});
