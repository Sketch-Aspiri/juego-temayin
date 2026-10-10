import type { ThemeId } from '../types';
import { beachScenery, caveScenery, jungleScenery, type Scenery } from './backgrounds';
import { paintedScenery } from './scenery/painted';
import { palenqueScenery } from './scenery/palenque';
import { riverScenery } from './scenery/river';
import { swampScenery } from './scenery/swamp';
import { fortressScenery } from './scenery/fortress';
import { mangroveScenery } from './scenery/mangrove';
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

// Fondos pintados (public/assets/backgrounds); el escenario procedural sirve de respaldo mientras cargan.
const jungleArt = paintedScenery('jungle.webp', jungleScenery);
const beachArt = paintedScenery('beach.webp', beachScenery, { nearTop: 0.7 });
const lairArt = paintedScenery('lair.webp', jungleScenery);
const caveArt = paintedScenery('cave.webp', caveScenery, { nearTop: 0.7 });

/**
 * Registro de temas visuales. Para añadir uno: declarar su id en `ThemeId`,
 * escribir su `scenery` (procedural en `backgrounds.ts` o pintado con `paintedScenery`)
 * y registrarlo aquí.
 */
export const THEMES: Readonly<Record<ThemeId, ThemeDef>> = {
  jungle: {
    id: 'jungle',
    sky: ['#5ec8f5', '#bdeeff'],
    sun: true,
    scenery: jungleArt,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
  },
  beach: {
    id: 'beach',
    sky: ['#3fb7f0', '#d9f6ff'],
    sun: true,
    scenery: beachArt,
    groundTop: 'sandTop',
    groundBody: 'sand',
    platform: 'wood',
    water: { fill: '#1aa7c9', foam: '#7fe6f0' },
  },
  lair: {
    id: 'lair',
    sky: ['#3a1f4a', '#d0663a'],
    tint: 'rgba(60,10,40,.12)',
    sun: true,
    scenery: lairArt,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
  },
  cave: {
    id: 'cave',
    sky: ['#071822', '#1d5c66'],
    sun: false,
    scenery: caveArt,
    groundTop: 'rockTop',
    groundBody: 'rock',
    platform: 'crystal',
    water: { fill: '#118fa6', foam: '#6fe3d6' },
  },
  // Mundo 1: cañón del Usumacinta y pantanos de Tabasco (AGENTS.md §4.7).
  river: {
    id: 'river',
    sky: ['#4fb3e0', '#c8ecf5'],
    sun: true,
    scenery: riverScenery,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
    water: { fill: '#3f8f8a', foam: '#a8e0d0' },
  },
  swamp: {
    id: 'swamp',
    sky: ['#7fa38a', '#d3e2c8'],
    tint: 'rgba(60,80,50,.15)',
    sun: false,
    scenery: swampScenery,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'wood',
    water: { fill: '#4d6b3c', foam: '#9fb88a' },
  },
  // 1-1: templos de Palenque entre la selva (fondo `ruins.webp`).
  palenque: {
    id: 'palenque',
    sky: ['#3f8fe0', '#bfe6ff'],
    sun: false,
    scenery: palenqueScenery,
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'stone',
  },
  // Mundo 2: murallas de San Francisco de Campeche y manglares de Los Petenes.
  fortress: {
    id: 'fortress',
    sky: ['#4aa8e8', '#d4efff'],
    sun: true,
    scenery: fortressScenery,
    groundTop: 'sillarTop',
    groundBody: 'sillar',
    platform: 'sillar',
    // Sin `water`: los fosos de la muralla son secos (hoyos sin fondo, no se nada).
  },
  mangrove: {
    id: 'mangrove',
    sky: ['#6fb8c8', '#e0f0e4'],
    tint: 'rgba(40,70,50,.08)',
    sun: true,
    scenery: mangroveScenery,
    groundTop: 'mudTop',
    groundBody: 'mud',
    platform: 'mangroveRoot',
    // Agua salobre: verde turbio con espuma clara.
    water: { fill: '#3f7f73', foam: '#b5ddc8' },
  },
};
