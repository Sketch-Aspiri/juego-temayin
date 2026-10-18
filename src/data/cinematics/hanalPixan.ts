import type { IntroScene } from '../intro';
import { HANAL_PIXAN_BACKGROUND as background, HANAL_PIXAN_SPRITES as art } from '../hanalPixanArt';

/** Una aventura de fantasía, separada de los sucesos del prólogo de la campaña. */
export const HANAL_PIXAN_SCENES: readonly IntroScene[] = [
  {
    id: 'hanal-bienvenida', background, tone: 'dusk', speaker: 'Toh',
    text: '¡Bienvenido a Hanal Pixán, un nivel especial de temporada! Antes de partir de Palenque, nos espera un camino de luces y colores.',
    actors: [
      { sprite: art.temayin, x: 30, bottom: 8, height: 64, anim: 'enter-left', portrait: { x: 28, bottom: 8, height: 46 } },
      { sprite: art.toh, x: 70, bottom: 30, height: 36, anim: 'float', portrait: { x: 74, bottom: 38, height: 29 } },
    ], effects: [],
  },
  {
    id: 'hanal-memoria', background, tone: 'dusk', speaker: 'Toh',
    text: 'Hanal Pixán significa «comida de las ánimas». Las familias recuerdan con cariño a sus seres queridos. Esta noche de alebrijes es nuestra fantasía para acompañar la celebración.',
    actors: [
      { sprite: art.temayina, x: 30, bottom: 8, height: 62, anim: 'enter-left', portrait: { x: 27, bottom: 8, height: 45 } },
      { sprite: art.toh, x: 72, bottom: 28, height: 38, anim: 'float', portrait: { x: 74, bottom: 38, height: 28 } },
    ], effects: [],
  },
  {
    id: 'hanal-camino', background, tone: 'dusk', speaker: 'Toh',
    text: 'Los puentes ceden y el viento pone a prueba tus saltos. Busca mi luz a mitad del sendero. Al completar la meta ganarás el Amuleto de luz: ¡un escudo al empezar cada nivel de tu aventura!',
    actors: [
      { sprite: art.temayin, x: 28, bottom: 8, height: 62, anim: 'enter-left', portrait: { x: 26, bottom: 8, height: 44 } },
      { sprite: art.coati, x: 72, bottom: 8, height: 43, anim: 'enter-right', portrait: { x: 74, bottom: 8, height: 34 } },
      { sprite: art.firefly, x: 62, bottom: 65, height: 14, anim: 'float', portrait: { x: 64, bottom: 67, height: 14 } },
    ], effects: [],
  },
];
