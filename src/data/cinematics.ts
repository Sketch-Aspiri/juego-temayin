import { INTRO_FILES, INTRO_SCENES, SPRITES, type IntroScene, type SpriteRef } from './intro';
import { PUAS_COVER, PUAS_VICTORY_SCENES } from './puasVictory';
import { BOSS_VICTORY_SPRITES, CINEMATIC_DECK_BACKGROUND, TEMAYIN_CINEMATIC_POSES } from './bossVictoryArt';
import { SECRETOS_SCENES } from './cinematics/secretos';
import { KAIMAN_VICTORY_SCENES } from './cinematics/kaimanVictory';
import { HUAY_CHIVO_VICTORY_SCENES } from './cinematics/huayChivoVictory';
import { HUAY_PEK_VICTORY_SCENES } from './cinematics/huayPekVictory';
import { SARGAZO_VICTORY_SCENES } from './cinematics/sargazoVictory';
import { LORENCILLO_VICTORY_SCENES } from './cinematics/lorencilloVictory';
import { CAMAZOTZ_VICTORY_SCENES } from './cinematics/camazotzVictory';
import { REUNION_SPRITE } from './world7Art';
import { HANAL_PIXAN_SCENES } from './cinematics/hanalPixan';
import { HANAL_PIXAN_BACKGROUND, HANAL_PIXAN_SPRITES } from './hanalPixanArt';
import { HANAL_PIXAN_LEVEL } from './levels/seasonal/hanal-pixan';

export type CinematicId = 'intro' | 'puas-victory' | 'kaiman-victory' | 'huayChivo-victory'
  | 'huayPek-victory' | 'sargazo-victory' | 'lorencillo-victory' | 'camazotz-victory' | 'hanal-pixan' | 'secretos-victory';

export interface CinematicDef {
  readonly id: CinematicId;
  readonly chapter: string;
  readonly title: string;
  readonly description: string;
  readonly cover: { readonly background: string; readonly actor: SpriteRef };
  readonly scenes: readonly IntroScene[];
  /** Se desbloquea y reproduce al completar este nivel; sin él está siempre disponible. */
  readonly afterLevel?: string;
  /** Se presenta antes de cada visita al especial, sin marcar el prólogo como visto. */
  readonly beforeLevel?: string;
  /** Se desbloquea y reproduce al completar por primera vez los siete niveles secretos. */
  readonly afterAllSecrets?: boolean;
}

/** Orden narrativo del menú. Añadir una entrada conecta también desbloqueo y reproducción. */
export const CINEMATICS: Readonly<Record<CinematicId, CinematicDef>> = {
  'hanal-pixan': {
    id: 'hanal-pixan', chapter: 'Especial de temporada', title: 'Hanal Pixán',
    description: 'Un sendero de luz, memoria y alebrijes antes de partir de Palenque.',
    cover: { background: HANAL_PIXAN_BACKGROUND, actor: HANAL_PIXAN_SPRITES.temayin },
    scenes: HANAL_PIXAN_SCENES, beforeLevel: HANAL_PIXAN_LEVEL.id,
  },
  intro: {
    id: 'intro', chapter: 'Prólogo', title: 'El eclipse de Camazotz',
    description: 'Un Sol de Jade, una promesa y el comienzo de la aventura.',
    cover: { background: 'backgrounds/ruins.webp', actor: SPRITES.decidido },
    scenes: INTRO_SCENES,
  },
  'puas-victory': {
    id: 'puas-victory', chapter: 'Capítulo 1 · Escárcega', title: 'El primer tramo libre',
    description: 'La victoria sobre Púas abre un nuevo camino para Temayin y Toh.',
    cover: { background: 'backgrounds/lair.webp', actor: PUAS_COVER },
    scenes: PUAS_VICTORY_SCENES, afterLevel: '1-6',
  },
  'kaiman-victory': {
    id: 'kaiman-victory', chapter: 'Capítulo 2 · Calkiní', title: 'El pantano vuelve a la calma',
    description: 'Tras las olas de Kaimán, el tren pone rumbo a las haciendas de Yucatán.',
    cover: { background: 'backgrounds/swamp.webp', actor: BOSS_VICTORY_SPRITES.kaiman.farewell },
    scenes: KAIMAN_VICTORY_SCENES, afterLevel: '2-7',
  },
  'huayChivo-victory': {
    id: 'huayChivo-victory', chapter: 'Capítulo 3 · Izamal', title: 'Amanece en la ciudad amarilla',
    description: 'Los engaños de Huay Chivo se desvanecen y el camino a los cenotes queda abierto.',
    cover: { background: 'backgrounds/yellowCity.webp', actor: BOSS_VICTORY_SPRITES.huayChivo.farewell },
    scenes: HUAY_CHIVO_VICTORY_SCENES, afterLevel: '3-5',
  },
  'huayPek-victory': {
    id: 'huayPek-victory', chapter: 'Capítulo 4 · Nuevo Xcán', title: 'Más allá de la niebla',
    description: 'Huay Pek descansa y una brisa del Caribe anuncia la siguiente aventura.',
    cover: { background: 'backgrounds/deepJungle.webp', actor: BOSS_VICTORY_SPRITES.huayPek.farewell },
    scenes: HUAY_PEK_VICTORY_SCENES, afterLevel: '4-5',
  },
  'sargazo-victory': {
    id: 'sargazo-victory', chapter: 'Capítulo 5 · Akumal', title: 'Un mar para volver',
    description: 'Las tortugas recuperan su hogar y Temayin continúa por la Costa Maya.',
    cover: { background: 'backgrounds/reef.webp', actor: BOSS_VICTORY_SPRITES.sargazo.farewell },
    scenes: SARGAZO_VICTORY_SCENES, afterLevel: '5-6',
  },
  'lorencillo-victory': {
    id: 'lorencillo-victory', chapter: 'Capítulo 6 · Chetumal', title: 'La última ruta hacia el eclipse',
    description: 'Lorencillo cede el paso. Al otro lado de la selva, Camazotz aguarda.',
    cover: { background: CINEMATIC_DECK_BACKGROUND, actor: BOSS_VICTORY_SPRITES.lorencillo.farewell },
    scenes: LORENCILLO_VICTORY_SCENES, afterLevel: '6-6',
  },
  'camazotz-victory': {
    id: 'camazotz-victory', chapter: 'Capítulo 7 · Calakmul', title: 'El Sol de Jade vuelve a brillar',
    description: 'El rescate de Temayina, el regreso por Centenario y el final de la aventura.',
    cover: { background: 'mundo7/calakmul-amanecer.webp', actor: REUNION_SPRITE },
    scenes: CAMAZOTZ_VICTORY_SCENES, afterLevel: '7-4',
  },
  'secretos-victory': {
    id: 'secretos-victory', chapter: 'Desvíos secretos', title: 'Los siete sellos de jade',
    description: 'Toh celebra los acertijos de numerología maya y el Corazón de jade.',
    cover: { background: 'backgrounds/ruins.webp', actor: TEMAYIN_CINEMATIC_POSES.celebrate },
    scenes: SECRETOS_SCENES, afterAllSecrets: true,
  },
};

export const ALL_CINEMATICS: readonly CinematicDef[] = Object.values(CINEMATICS);

export function cinematicBeforeLevel(levelId: string): CinematicDef | undefined {
  return ALL_CINEMATICS.find(cinematic => cinematic.beforeLevel === levelId);
}

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
