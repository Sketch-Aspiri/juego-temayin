import type { ThemeId } from '../types';
import { beachScenery, caveScenery, jungleScenery, type Scenery } from './backgrounds';
import { paintedScenery } from './scenery/painted';
import { palenqueScenery } from './scenery/palenque';
import { riverScenery } from './scenery/river';
import { ruinsScenery } from './scenery/ruins';
import { swampScenery } from './scenery/swamp';
import { fortressScenery } from './scenery/fortress';
import { mangroveScenery } from './scenery/mangrove';
import { haciendaScenery } from './scenery/hacienda';
import { xibalbaScenery } from './scenery/xibalba';
import type { TexId } from './textures';
import { reefScenery } from './scenery/reef';
import { hanalPixanScenery } from './hanalPixan';

export interface WaterStyle {
  fill: string;
  foam: string;
  /** Opacidad del cuerpo del agua (por defecto `WATER_ALPHA` de waterSurface); más alta tapa el fondo pintado. */
  alpha?: number;
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
  /** Desplazamiento continuo del fondo (px/s), p. ej. el paisaje que pasa junto a un tren en marcha. */
  motion?: number;
}

const MS_PER_SECOND = 1000;
/** Velocidad del paisaje junto al tren de 6-2 (px/s de cámara; el parallax lo atenúa). */
const TRAIN_SCENERY_SPEED = 240;

/** Cámara que recibe el escenario: la del mundo más el avance propio del tema (`motion`). Pura. */
export function sceneryCam(theme: ThemeDef, cam: number, now: number): number {
  return cam + (theme.motion ?? 0) * (now / MS_PER_SECOND);
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
  rioBec: {
    id: 'rioBec', sky: ['#64a9d4', '#efd1a3'], sun: false,
    scenery: paintedScenery('rioBec.webp', ruinsScenery),
    groundTop: 'limestoneTop', groundBody: 'limestone', platform: 'carved',
  },
  batCave: {
    id: 'batCave', sky: ['#080d22', '#2e3a51'], sun: false,
    scenery: paintedScenery('batCave.webp', caveScenery),
    groundTop: 'rockTop', groundBody: 'rock', platform: 'stone',
  },
  deepJungle: {
    id: 'deepJungle', sky: ['#071b26', '#263e3e'], sun: false,
    scenery: paintedScenery('deepJungle.webp', jungleScenery),
    groundTop: 'grass', groundBody: 'dirt', platform: 'wood',
  },
  throne: {
    id: 'throne', sky: ['#2a1738', '#dd874f'], sun: false,
    scenery: paintedScenery('throne.webp', ruinsScenery, { far: 0.025, near: 0.08 }),
    groundTop: 'limestoneTop', groundBody: 'limestone', platform: 'carved',
  },
  calakmulDawn: {
    id: 'calakmulDawn', sky: ['#90d5dc', '#ffe9a6'], sun: false,
    scenery: paintedScenery('mundo7/calakmul-amanecer.webp', ruinsScenery),
    groundTop: 'limestoneTop', groundBody: 'limestone', platform: 'carved',
  },
  hanalPixan: {
    id: 'hanalPixan', sky: ['#092e32', '#184c49'], sun: false,
    scenery: hanalPixanScenery, groundTop: 'mudTop', groundBody: 'mud', platform: 'stone',
  },
  reef: {
    id: 'reef', sky: ['#075578', '#51c4c3'], sun: false,
    scenery: paintedScenery('reef.webp', reefScenery, { nearTop: 0.75 }),
    groundTop: 'sandTop', groundBody: 'sand', platform: 'stone',
    water: { fill: '#128cad', foam: '#a0f1ef' },
  },
  yellowCity: {
    id: 'yellowCity', sky: ['#318bc9', '#fff0c0'], sun: false,
    scenery: paintedScenery('yellowCity.webp', haciendaScenery),
    groundTop: 'masonry', groundBody: 'limestone', platform: 'masonry',
  },
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
    groundTop: 'mudTop',
    groundBody: 'mud',
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
  // Mundo 2: zonas arqueológicas de caliza (Edzná) y su variante al atardecer (Hecelchakán).
  ruins: {
    id: 'ruins',
    sky: ['#4a9be0', '#d6ecff'],
    sun: true,
    scenery: ruinsScenery,
    groundTop: 'limestoneTop',
    groundBody: 'limestone',
    platform: 'carved',
  },
  ruinsDusk: {
    id: 'ruinsDusk',
    sky: ['#6a3f7a', '#f2a65a'],
    tint: 'rgba(225,95,45,.28)',
    sun: true,
    scenery: ruinsScenery,
    groundTop: 'limestoneTop',
    groundBody: 'limestone',
    platform: 'carved',
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
  // Mundo 2: haciendas henequeneras al atardecer (AGENTS.md §4.7).
  hacienda: {
    id: 'hacienda',
    sky: ['#e8794a', '#ffd9a0'],
    sun: false,
    scenery: haciendaScenery,
    groundTop: 'redEarthTop',
    groundBody: 'redEarth',
    platform: 'masonry',
  },
  // Mundo 4: Xibalbá, el inframundo del Popol Vuh (negro y rojo, roca volcánica y niebla).
  xibalba: {
    id: 'xibalba',
    sky: ['#0d0507', '#4a1410'],
    tint: 'rgba(40,0,10,.12)',
    sun: false,
    scenery: xibalbaScenery,
    groundTop: 'xibRockTop',
    groundBody: 'xibRock',
    platform: 'xibBone',
    // Agua oscura de cueva inundada con reflejos de brasa en la superficie.
    water: { fill: '#1a2238', foam: '#e0644a' },
  },
  // Mundo 4: la selva de noche, con velo azul oscuro (4-5 Nuevo Xcán).
  jungleNight: {
    id: 'jungleNight',
    sky: ['#0b1430', '#2a3f6e'],
    tint: 'rgba(6,12,44,.18)',
    sun: false,
    scenery: paintedScenery('deepJungle.webp', jungleScenery),
    groundTop: 'grass',
    groundBody: 'dirt',
    platform: 'wood',
  },
  // Mundo 6 · Costa Maya y Bacalar (AGENTS.md §4.7).
  cliff: {
    id: 'cliff', sky: ['#38b6e8', '#d8f4ff'], sun: true,
    scenery: paintedScenery('cliff.webp', beachScenery, { nearTop: 0.7 }),
    groundTop: 'limestoneTop', groundBody: 'limestone', platform: 'carved',
  },
  lagoon: {
    id: 'lagoon', sky: ['#4fc3ee', '#e4faff'], sun: true,
    scenery: paintedScenery('lagoon.webp', beachScenery, { nearTop: 0.7 }),
    groundTop: 'sandTop', groundBody: 'sand', platform: 'wood',
    // Más opaca y algo más profunda que el mar pintado, para que la zona nadable se distinga.
    water: { fill: '#0e86b4', foam: '#ffffff', alpha: 0.68 },
  },
  // Chetumal: bahía pintada al atardecer y tablones de cubierta y casco.
  bay: {
    id: 'bay', sky: ['#7a4fa0', '#ffb36b'], tint: 'rgba(255,140,70,.14)', sun: false,
    scenery: paintedScenery('bay.webp', beachScenery, { nearTop: 0.7 }),
    groundTop: 'shipDeck', groundBody: 'shipHull', platform: 'shipDeck',
    // Canales del malecón: azul marino casi opaco, para que no parezcan arena del fondo.
    water: { fill: '#14587f', foam: '#ffe7c8', alpha: 0.85 },
  },
  // 6-2: el paisaje corre junto al tren en marcha.
  jungleTrain: {
    id: 'jungleTrain', sky: ['#5ec8f5', '#bdeeff'], sun: true,
    scenery: paintedScenery('jungle.webp', jungleScenery),
    groundTop: 'trainRoof', groundBody: 'trainSide', platform: 'trainRoof',
    motion: TRAIN_SCENERY_SPEED,
  },
};
