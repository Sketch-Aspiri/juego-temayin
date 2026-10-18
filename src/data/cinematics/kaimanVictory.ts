import { SPRITES, type IntroScene } from '../intro';
import { BOSS_VICTORY_SPRITES, CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

const KAIMAN = BOSS_VICTORY_SPRITES.kaiman;

export const KAIMAN_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'kaiman-pantano-en-calma', background: 'backgrounds/swamp.webp', tone: 'dawn',
    text: 'La última ola se deshizo entre los mangles. Kaimán Moreleti bajó el hocico, agotado, y Temayin celebró: el paso de Calkiní estaba libre.',
    actors: [
      { sprite: TEMAYIN.celebrate, x: 27, bottom: 30, height: 55, anim: 'enter-left', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: KAIMAN.defeated, x: 71, bottom: 30, height: 29, flip: true, anim: 'still', portrait: { x: 71, bottom: 12, height: 20 } },
    ], effects: [],
  },
  {
    id: 'kaiman-deja-pasar', background: 'backgrounds/mangrove.webp', tone: 'day', speaker: 'Kaimán Moreleti',
    text: 'Está bien, jaguar… puedes pasar. Camazotz creyó que nadie cruzaría mi pantano. ¡Veamos qué cara pone cuando sepa que lo lograste!',
    actors: [
      { sprite: TEMAYIN.listen, x: 29, bottom: 30, height: 46, anim: 'still', portrait: { x: 28, bottom: 12, height: 39 } },
      { sprite: KAIMAN.farewell, x: 70, bottom: 30, height: 47, anim: 'still', portrait: { x: 73, bottom: 12, height: 33 } },
    ], effects: [],
  },
  {
    id: 'kaiman-toh-haciendas', background: 'backgrounds/hacienda.webp', tone: 'dusk', speaker: 'Toh',
    text: 'El tren nos llevará hacia las haciendas y las cuevas de Yucatán. En Izamal nos espera Huay Chivo. ¡Sus trucos no serán tan fáciles de esquivar!',
    actors: [
      { sprite: TEMAYIN.journey, x: 31, bottom: 29, height: 56, anim: 'enter-left', portrait: { x: 32, bottom: 12, height: 43 } },
      { sprite: SPRITES.tohFly, x: 72, bottom: 51, height: 24, flip: true, anim: 'float', portrait: { x: 76, bottom: 59, height: 22 } },
    ], effects: [],
  },
  {
    id: 'kaiman-tren-a-yucatan', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day', speaker: 'Temayin',
    text: 'Otro tramo queda atrás, Temayina. Cuando vuelva a verte, tendremos mucho que contarnos. Hasta entonces, seguiré adelante.',
    actors: [
      { sprite: TEMAYIN.seated, x: 32, bottom: 29, height: 47, anim: 'still', portrait: { x: 33, bottom: 15, height: 44 } },
      { sprite: SPRITES.tohFly, x: 70, bottom: 58, height: 20, flip: true, anim: 'float', portrait: { x: 77, bottom: 66, height: 19 } },
    ], effects: [],
  },
];
