import { LORENCILLO_ACTIONS_FILE } from './lorencilloArt';
import type { Frame } from '../engine/render/artCache';

/** Arte de Costa Maya: fuentes y prompts originales en imagenes/nuevos/. */
export const BAY_ART = { file: 'backgrounds/bay.webp', frame: [0, 0, 1536, 1024] as Frame } as const;
export const SHIP_RIGGING = {
  file: 'escenarios/jarcia-lorencillo.webp', frame: [0, 0, 1536, 986] as Frame,
  /** Base del mástil mayor, como fracción del ancho de la arena. */
  mast: 0.35,
} as const;
export const COAST_TILES_FILE = 'terreno/vagon-costa-maya.webp';
export const WORLD6_ART_FILES: readonly string[] = [
  LORENCILLO_ACTIONS_FILE, BAY_ART.file, SHIP_RIGGING.file, COAST_TILES_FILE,
];
