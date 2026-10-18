import { SPRITES, type IntroScene } from '../intro';
import { BOSS_VICTORY_SPRITES, CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

const CHIVO = BOSS_VICTORY_SPRITES.huayChivo;

export const HUAY_CHIVO_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'huay-chivo-amanecer', background: 'backgrounds/yellowCity.webp', tone: 'dawn',
    text: 'Los fuegos fatuos se apagaron y el amanecer devolvió su color a Izamal. Huay Chivo se sentó bajo los arcos: esta vez, sus trucos no habían bastado.',
    actors: [
      { sprite: TEMAYIN.celebrate, x: 28, bottom: 30, height: 55, anim: 'enter-left', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: CHIVO.defeated, x: 71, bottom: 30, height: 44, flip: true, anim: 'still', portrait: { x: 73, bottom: 12, height: 36 } },
    ], effects: ['sunrise'],
  },
  {
    id: 'huay-chivo-reconoce-valor', background: 'backgrounds/yellowCity.webp', tone: 'day', speaker: 'Huay Chivo',
    text: 'Supiste mirar entre mis engaños, pequeño guardián. Sigue tu camino. Más allá de los cenotes, Huay Pek aguarda entre la niebla.',
    actors: [
      { sprite: TEMAYIN.grateful, x: 28, bottom: 30, height: 53, anim: 'still', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: CHIVO.farewell, x: 71, bottom: 30, height: 43, anim: 'still', portrait: { x: 74, bottom: 12, height: 30 } },
    ], effects: [],
  },
  {
    id: 'huay-chivo-toh-cenotes', background: 'backgrounds/ruins.webp', tone: 'day', speaker: 'Toh',
    text: '¡Rumbo a Chichén Itzá! Después vendrán cuevas y cenotes. Si el camino se oscurece, busca una luz y escucha: siempre puede haber una salida cerca.',
    actors: [
      { sprite: TEMAYIN.listen, x: 29, bottom: 30, height: 48, anim: 'still', portrait: { x: 29, bottom: 12, height: 40 } },
      { sprite: SPRITES.tohPerch, x: 72, bottom: 44, height: 32, flip: true, anim: 'fly-in', portrait: { x: 76, bottom: 47, height: 24 } },
    ], effects: [],
  },
  {
    id: 'huay-chivo-rumbo-a-los-cenotes', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day',
    text: 'El tren dejó atrás la ciudad amarilla. Temayin miró el cielo iluminado y guardó aquella imagen: un día, el Sol de Jade volvería a brillar así para todos.',
    actors: [
      { sprite: TEMAYIN.seated, x: 32, bottom: 29, height: 47, anim: 'still', portrait: { x: 33, bottom: 15, height: 44 } },
      { sprite: SPRITES.tohFly, x: 71, bottom: 58, height: 20, flip: true, anim: 'float', portrait: { x: 77, bottom: 66, height: 19 } },
    ], effects: [],
  },
];
