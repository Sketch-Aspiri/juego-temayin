import { SPRITES, type IntroScene } from '../intro';
import { BOSS_VICTORY_SPRITES, CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

const PEK = BOSS_VICTORY_SPRITES.huayPek;

export const HUAY_PEK_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'huay-pek-silencio', background: 'backgrounds/deepJungle.webp', tone: 'night',
    text: 'El último ladrido se perdió entre los árboles de Nuevo Xcán. Huay Pek recogió su cola de luz y descansó. La niebla empezó a retirarse.',
    actors: [
      { sprite: TEMAYIN.listen, x: 28, bottom: 30, height: 47, anim: 'still', portrait: { x: 28, bottom: 12, height: 39 } },
      { sprite: PEK.defeated, x: 72, bottom: 30, height: 30, anim: 'still', portrait: { x: 72, bottom: 12, height: 23 } },
    ], effects: [],
  },
  {
    id: 'huay-pek-despedida', background: 'backgrounds/jungle.webp', tone: 'dawn', speaker: 'Temayin',
    text: 'Descansa, Huay Pek. Yo también tengo a alguien que me espera. Gracias por dejar libre el camino; aún me queda mucho por recorrer.',
    actors: [
      { sprite: TEMAYIN.grateful, x: 28, bottom: 30, height: 53, anim: 'still', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: PEK.farewell, x: 72, bottom: 30, height: 45, anim: 'still', portrait: { x: 73, bottom: 12, height: 36 } },
    ], effects: [],
  },
  {
    id: 'huay-pek-toh-caribe', background: 'backgrounds/beach.webp', tone: 'day', speaker: 'Toh',
    text: '¡Ya se siente la brisa del Caribe! Nos espera la Riviera Maya. En Akumal, las tortugas necesitan ayuda: Capitán Sargazo tiene atrapada la bahía.',
    actors: [
      { sprite: TEMAYIN.journey, x: 31, bottom: 29, height: 56, anim: 'enter-left', portrait: { x: 32, bottom: 12, height: 43 } },
      { sprite: SPRITES.tohFly, x: 72, bottom: 51, height: 24, flip: true, anim: 'float', portrait: { x: 76, bottom: 59, height: 22 } },
    ], effects: [],
  },
  {
    id: 'huay-pek-tren-al-mar', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day',
    text: 'Con la selva a sus espaldas y el mar en el horizonte, Temayin volvió al tren. Cada estación lo acercaba un poco más a Temayina.',
    actors: [
      { sprite: TEMAYIN.seated, x: 32, bottom: 29, height: 47, anim: 'still', portrait: { x: 33, bottom: 15, height: 44 } },
      { sprite: SPRITES.tohFly, x: 71, bottom: 58, height: 20, flip: true, anim: 'float', portrait: { x: 77, bottom: 66, height: 19 } },
    ], effects: [],
  },
];
