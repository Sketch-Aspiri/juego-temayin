import { SPRITES, type IntroScene, type SpriteRef } from '../intro';
import { AKUMAL_TURTLES, SARGAZO_ALLY_FILE } from '../sargazoArt';
import { BOSS_VICTORY_SPRITES, CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

const SARGAZO = BOSS_VICTORY_SPRITES.sargazo;
const TURTLE: SpriteRef = { file: SARGAZO_ALLY_FILE, sheetW: 1774, sheetH: 887, frame: AKUMAL_TURTLES.swim.frame, isolated: true };

export const SARGAZO_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'sargazo-tortugas-libres', background: 'escenarios/akumal-submarino.webp', tone: 'day',
    text: 'El núcleo del Capitán Sargazo dejó de agitar el agua. Los enredos se soltaron y las tortugas de Akumal pudieron nadar libres otra vez.',
    actors: [
      { sprite: SARGAZO.defeated, x: 70, bottom: 30, height: 43, anim: 'still', portrait: { x: 73, bottom: 12, height: 29 } },
      { sprite: TEMAYIN.swim, x: 25, bottom: 48, height: 28, anim: 'float', portrait: { x: 29, bottom: 53, height: 23 } },
      { sprite: TURTLE, x: 26, bottom: 30, height: 17, anim: 'float', portrait: { x: 27, bottom: 20, height: 16 } },
    ], effects: [],
  },
  {
    id: 'sargazo-cuidar-la-bahia', background: 'backgrounds/beach.webp', tone: 'day', speaker: 'Temayin',
    text: 'Las tortugas necesitan un mar limpio. Estas botellas van fuera del agua. ¡Cuidemos la bahía para que puedan volver siempre!',
    actors: [
      { sprite: TEMAYIN.grateful, x: 28, bottom: 30, height: 53, anim: 'still', portrait: { x: 28, bottom: 12, height: 43 } },
      { sprite: SARGAZO.farewell, x: 72, bottom: 30, height: 48, anim: 'still', portrait: { x: 74, bottom: 12, height: 38 } },
    ], effects: [],
  },
  {
    id: 'sargazo-toh-costa-maya', background: 'backgrounds/cliff.webp', tone: 'day', speaker: 'Toh',
    text: '¡Buen trabajo! Seguiremos hacia Tulum y los azules de Bacalar. Más al sur, en Chetumal, Lorencillo vigila el paso desde su barco.',
    actors: [
      { sprite: TEMAYIN.journey, x: 31, bottom: 29, height: 56, anim: 'enter-left', portrait: { x: 32, bottom: 12, height: 43 } },
      { sprite: SPRITES.tohFly, x: 72, bottom: 51, height: 24, flip: true, anim: 'float', portrait: { x: 76, bottom: 59, height: 22 } },
    ], effects: [],
  },
  {
    id: 'sargazo-tren-a-tulum', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day',
    text: 'Mientras las tortugas se alejaban entre los corales, Temayin y Toh retomaron el viaje. El tren siguió la costa, con una nueva esperanza a bordo.',
    actors: [
      { sprite: TEMAYIN.seated, x: 32, bottom: 29, height: 47, anim: 'still', portrait: { x: 33, bottom: 15, height: 44 } },
      { sprite: SPRITES.tohFly, x: 71, bottom: 58, height: 20, flip: true, anim: 'float', portrait: { x: 77, bottom: 66, height: 19 } },
    ], effects: [],
  },
];
