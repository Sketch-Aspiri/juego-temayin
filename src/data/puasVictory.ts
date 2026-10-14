import { SPRITES, type IntroScene, type SpriteRef } from './intro';

/** Púas vencido: el último cuadro de la hoja que utiliza el combate. */
export const PUAS_DEFEATED: SpriteRef = {
  file: 'jefe.webp', sheetW: 1200, sheetH: 190, frame: [966, 44, 232, 144],
};

export const PUAS_VICTORY_SCENES: readonly IntroScene[] = [
  {
    id: 'puas-vencido', background: 'backgrounds/lair.webp', tone: 'dusk',
    text: 'Con un último salto, Temayin venció a Púas. La guarida quedó en silencio y el camino a Escárcega volvió a abrirse.',
    actors: [
      { sprite: SPRITES.alegre, x: 28, bottom: 25, height: 59, anim: 'enter-left', portrait: { x: 27, bottom: 14, height: 44 } },
      { sprite: PUAS_DEFEATED, x: 71, bottom: 28, height: 35, flip: true, anim: 'still', portrait: { x: 73, bottom: 14, height: 26 } },
    ],
    effects: [],
  },
  {
    id: 'toh-primer-tramo', background: 'backgrounds/jungle.webp', tone: 'day', speaker: 'Toh',
    text: '¡Lo lograste, Temayin! El primer tramo está libre. Nos espera Campeche, pero cuidado: Kaimán Moreleti vigila sus pantanos.',
    actors: [
      { sprite: SPRITES.atento, x: 30, bottom: 25, height: 58, anim: 'still', portrait: { x: 30, bottom: 10, height: 46 } },
      { sprite: SPRITES.tohPerch, x: 70, bottom: 43, height: 34, flip: true, anim: 'fly-in', portrait: { x: 75, bottom: 47, height: 24 } },
    ],
    effects: [],
  },
  {
    id: 'promesa-de-temayin', background: 'backgrounds/river.webp', tone: 'dusk', speaker: 'Temayin',
    text: 'Resiste, Temayina. Ni las púas ni las sombras van a detenerme. ¡Seguiré tu rastro estación por estación!',
    actors: [
      { sprite: SPRITES.decidido, x: 40, bottom: 25, height: 62, anim: 'enter-left', portrait: { x: 44, bottom: 12, height: 60 } },
    ],
    effects: [],
  },
  {
    id: 'rumbo-a-campeche', background: 'backgrounds/jungle.webp', tone: 'dawn',
    text: 'El silbato del Tren Maya anunció la partida. Con Toh a su lado, Temayin dejó Escárcega y emprendió el viaje hacia el Golfo de Campeche.',
    actors: [
      { sprite: SPRITES.alegre, x: 25, bottom: 32, height: 48, anim: 'still', portrait: { x: 30, bottom: 31, height: 45 } },
      { sprite: SPRITES.tohFly, x: 67, bottom: 55, height: 22, flip: true, anim: 'float', portrait: { x: 74, bottom: 61, height: 20 } },
    ],
    effects: ['train'],
  },
];
