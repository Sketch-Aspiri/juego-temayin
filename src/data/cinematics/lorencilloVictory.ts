import { SPRITES, type IntroScene } from '../intro';
import { BOSS_VICTORY_SPRITES, CINEMATIC_DECK_BACKGROUND, CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

const LORENCILLO = BOSS_VICTORY_SPRITES.lorencillo;

export const LORENCILLO_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'lorencillo-cubierta-en-silencio', background: CINEMATIC_DECK_BACKGROUND, tone: 'day',
    text: 'Los cañones callaron y la cubierta dejó de inclinarse. Lorencillo se sentó junto a la borda: Temayin había ganado el paso por la bahía de Chetumal.',
    actors: [
      { sprite: TEMAYIN.celebrate, x: 29, bottom: 30, height: 55, anim: 'enter-left', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: LORENCILLO.defeated, x: 71, bottom: 30, height: 42, flip: true, anim: 'still', portrait: { x: 72, bottom: 12, height: 30 } },
    ], effects: [],
  },
  {
    id: 'lorencillo-cede-el-paso', background: CINEMATIC_DECK_BACKGROUND, tone: 'day', speaker: 'Lorencillo',
    text: 'Me has ganado, grumete. La ruta queda libre. Camazotz se oculta en Calakmul, más allá de la selva… pero ni yo navegaría bajo ese eclipse.',
    actors: [
      { sprite: TEMAYIN.listen, x: 29, bottom: 30, height: 47, anim: 'still', portrait: { x: 28, bottom: 12, height: 39 } },
      { sprite: LORENCILLO.farewell, x: 71, bottom: 30, height: 52, anim: 'still', portrait: { x: 73, bottom: 12, height: 39 } },
    ], effects: [],
  },
  {
    id: 'lorencillo-promesa-bajo-el-eclipse', background: 'backgrounds/throne.webp', tone: 'eclipse', speaker: 'Temayin',
    text: 'Ya sé dónde estás, Camazotz. He cruzado pantanos, cenotes y mares. Temayina, resiste: mi viaje aún no termina.',
    actors: [
      { sprite: TEMAYIN.journey, x: 29, bottom: 29, height: 55, anim: 'enter-left', portrait: { x: 31, bottom: 12, height: 42 } },
      { sprite: SPRITES.camazotzNight, x: 74, bottom: 52, height: 29, anim: 'float', portrait: { x: 74, bottom: 57, height: 25 } },
    ], effects: [],
  },
  {
    id: 'lorencillo-hacia-calakmul', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day', speaker: 'Toh',
    text: 'Calakmul nos espera al final de las vías. Descansa un momento, Temayin. Cuando llegue la hora, volveremos a partir juntos.',
    actors: [
      { sprite: TEMAYIN.seated, x: 32, bottom: 29, height: 47, anim: 'still', portrait: { x: 33, bottom: 15, height: 44 } },
      { sprite: SPRITES.tohFly, x: 71, bottom: 58, height: 20, flip: true, anim: 'float', portrait: { x: 77, bottom: 66, height: 19 } },
    ], effects: [],
  },
];
