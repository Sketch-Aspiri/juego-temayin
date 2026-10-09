import type { ThemeId } from '../types';
import { beachScenery, caveScenery, jungleScenery, type Scenery } from './backgrounds';
import type { TexId } from './textures';

export interface WaterStyle {
  fill: string;
  foam: string;
}

export interface ThemeDef {
  id: ThemeId;
  /** Degradado del cielo: arriba / abajo. */
  sky: readonly [string, string];
  /** Velo de color por encima del fondo. */
  tint?: string;
  sun: boolean;
  scenery: Scenery;
  groundTop: TexId;
  groundBody: TexId;
  platform: TexId;
  /** Agua visible dentro de los hoyos. */
  water?: WaterStyle;
}

/**
 * Registro de temas visuales. Para añadir uno: declarar su id en `ThemeId`,
 * escribir su `scenery` en `backgrounds.ts` y registrarlo aquí.
 */
export const THEMES: Readonly<Record<ThemeId, ThemeDef>> = {
  jungle: {
    id: 'jungle',
    sky: ['#5ec8f5', '#bdeeff'],
    sun: true,
    scenery: jungleScenery,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
  },
  beach: {
    id: 'beach',
    sky: ['#3fb7f0', '#d9f6ff'],
    sun: true,
    scenery: beachScenery,
    groundTop: 'sandTop',
    groundBody: 'sand',
    platform: 'wood',
    water: { fill: '#1aa7c9', foam: '#7fe6f0' },
  },
  lair: {
    id: 'lair',
    sky: ['#3a1f4a', '#d0663a'],
    tint: 'rgba(60,10,40,.22)',
    sun: true,
    scenery: jungleScenery,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
  },
  cave: {
    id: 'cave',
    sky: ['#071822', '#1d5c66'],
    sun: false,
    scenery: caveScenery,
    groundTop: 'rockTop',
    groundBody: 'rock',
    platform: 'crystal',
    water: { fill: '#118fa6', foam: '#6fe3d6' },
  },
};
