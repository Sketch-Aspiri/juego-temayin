import { INTRO_FILES, INTRO_SCENES, SPRITES, type IntroScene, type SpriteRef } from './intro';
import { PUAS_VICTORY_SCENES } from './puasVictory';

export type CinematicId = 'intro' | 'puas-victory';

export interface CinematicDef {
  readonly id: CinematicId;
  readonly chapter: string;
  readonly title: string;
  readonly description: string;
  readonly cover: { readonly background: string; readonly actor: SpriteRef };
  readonly scenes: readonly IntroScene[];
  /** Se desbloquea y reproduce al completar este nivel; sin él está siempre disponible. */
  readonly afterLevel?: string;
}

/** Orden narrativo del menú. Añadir una entrada conecta también desbloqueo y reproducción. */
export const CINEMATICS: Readonly<Record<CinematicId, CinematicDef>> = {
  intro: {
    id: 'intro', chapter: 'Prólogo', title: 'El eclipse de Camazotz',
    description: 'Un Sol de Jade, una promesa y el comienzo de la aventura.',
    cover: { background: 'backgrounds/ruins.webp', actor: SPRITES.decidido },
    scenes: INTRO_SCENES,
  },
  'puas-victory': {
    id: 'puas-victory', chapter: 'Capítulo 1 · Escárcega', title: 'El primer tramo libre',
    description: 'La victoria sobre Púas abre un nuevo camino para Temayin y Toh.',
    cover: { background: 'backgrounds/lair.webp', actor: SPRITES.alegre },
    scenes: PUAS_VICTORY_SCENES, afterLevel: '1-6',
  },
};

export const ALL_CINEMATICS: readonly CinematicDef[] = Object.values(CINEMATICS);

export function cinematicAfterLevel(levelId: string): CinematicDef | undefined {
  return ALL_CINEMATICS.find(cinematic => cinematic.afterLevel === levelId);
}

/** Incluye los efectos compartidos de la introducción y los recursos de futuras escenas. */
export const CINEMATIC_FILES: readonly string[] = [...new Set([
  ...INTRO_FILES,
  ...ALL_CINEMATICS.flatMap(cinematic => [
    cinematic.cover.background, cinematic.cover.actor.file,
    ...cinematic.scenes.flatMap(scene => [scene.background, ...scene.actors.map(actor => actor.sprite.file)]),
  ]),
])];
