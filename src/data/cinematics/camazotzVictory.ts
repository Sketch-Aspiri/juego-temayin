import { SPRITES, type IntroScene } from '../intro';
import { CAMAZOTZ_FRAMES, REUNION_SPRITE } from '../world7Art';
import { CINEMATIC_TRAIN_BACKGROUND, TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

export const CAMAZOTZ_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'camazotz-el-eclipse-se-rompe', background: 'mundo7/calakmul-amanecer.webp', tone: 'dawn',
    text: 'Camazotz dejó caer sus alas. El Sol de Jade deshizo la jaula de sombra y Temayina quedó libre. La noche eterna había terminado.',
    actors: [
      { sprite: TEMAYIN.celebrate, x: 26, bottom: 28, height: 47, anim: 'still', portrait: { x: 24, bottom: 12, height: 35 } },
      { sprite: { file: 'bosses/camazotz.webp', sheetW: 1254, sheetH: 1254, frame: CAMAZOTZ_FRAMES.defeated, isolated: true },
        x: 72, bottom: 30, height: 35, anim: 'still', portrait: { x: 74, bottom: 12, height: 28 } },
    ], effects: [],
  },
  {
    id: 'camazotz-reencuentro', background: 'mundo7/calakmul-amanecer.webp', tone: 'day', speaker: 'Temayina',
    text: 'Sabía que llegarías, Temayin. La selva, los cenotes y el mar te trajeron hasta aquí… Ahora el Sol de Jade vuelve a iluminar nuestro hogar.',
    actors: [{ sprite: REUNION_SPRITE, x: 49, bottom: 25, height: 58, anim: 'still',
      portrait: { x: 50, bottom: 12, height: 44 } }], effects: [],
  },
  {
    id: 'camazotz-regreso-por-centenario', background: 'mundo7/calakmul-amanecer.webp', tone: 'day', speaker: 'Toh',
    text: 'El tren regresó por Centenario hasta Escárcega. Estación por estación, la península volvió a encenderse. Toh marcó la hora: era tiempo de volver a casa.',
    actors: [], effects: ['epilogue-map'],
  },
  {
    id: 'camazotz-creditos', background: CINEMATIC_TRAIN_BACKGROUND, tone: 'day',
    text: 'TEMAYIN · LA AVENTURA DEL JAGUAR. Una aventura de fantasía inspirada en lugares, fauna y relatos de la península de Yucatán. Gracias por acompañar a Temayin, Temayina y Toh. ¡Gracias por jugar!',
    actors: [
      { sprite: REUNION_SPRITE, x: 42, bottom: 25, height: 51, anim: 'still', portrait: { x: 46, bottom: 12, height: 41 } },
      { sprite: SPRITES.tohPerch, x: 80, bottom: 38, height: 23, anim: 'still', portrait: { x: 78, bottom: 44, height: 15 } },
    ], effects: [],
  },
];
