import { SPRITES, type IntroScene } from '../intro';
import { TEMAYIN_CINEMATIC_POSES as TEMAYIN } from '../bossVictoryArt';

/** Cierre de los siete sellos de jade; la numerología es la real y la ofrenda de jade es fantasía de la aventura. */
export const SECRETOS_SCENES: readonly IntroScene[] = [
  {
    id: 'secretos-siete-sellos', background: 'backgrounds/ruins.webp', tone: 'dawn', speaker: 'Toh',
    text: '¡Siete sellos de jade! Cada puerta se abrió con números mayas: puntos que valen uno, rayas que valen cinco y una concha para el cero.',
    actors: [
      { sprite: TEMAYIN.celebrate, x: 28, bottom: 8, height: 60, anim: 'enter-left', portrait: { x: 28, bottom: 8, height: 44 } },
      { sprite: SPRITES.tohFly, x: 72, bottom: 34, height: 30, anim: 'float', portrait: { x: 73, bottom: 40, height: 24 } },
    ], effects: [],
  },
  {
    id: 'secretos-contar-de-veinte', background: 'backgrounds/ruins.webp', tone: 'day', speaker: 'Toh',
    text: 'Los mayas contaban de veinte en veinte: por eso sus calendarios, el Tzolk\'in de 260 días y el Haab de 365, nacen de multiplicar y sumar con el veinte.',
    actors: [
      { sprite: TEMAYIN.listen, x: 30, bottom: 8, height: 56, anim: 'still', portrait: { x: 28, bottom: 8, height: 42 } },
      { sprite: SPRITES.tohPerch, x: 70, bottom: 26, height: 32, anim: 'float', portrait: { x: 73, bottom: 36, height: 25 } },
    ], effects: [],
  },
  {
    id: 'secretos-corazon-de-jade', background: 'backgrounds/ruins.webp', tone: 'dusk', speaker: 'Toh',
    text: 'Como premio, el Corazón de jade late contigo: desde ahora empiezas cada nivel con una vida extra. ¡Gracias por aprender conmigo, Temayin!',
    actors: [
      { sprite: TEMAYIN.grateful, x: 30, bottom: 8, height: 58, anim: 'still', portrait: { x: 28, bottom: 8, height: 43 } },
      { sprite: SPRITES.tohFly, x: 70, bottom: 36, height: 28, anim: 'float', portrait: { x: 73, bottom: 42, height: 22 } },
    ], effects: [],
  },
];
