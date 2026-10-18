import type { BlessingId, OfferingConfig } from '../engine/blessings';
import type { SpriteRef } from './intro';
import { OBJECTS_FILE, OBJECTS_SHEET_SIZE, OBJECT_FRAMES } from './objectSprites';

const OBJECT_SHEET = { file: OBJECTS_FILE, sheetW: OBJECTS_SHEET_SIZE, sheetH: OBJECTS_SHEET_SIZE };

export interface BlessingDef {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly sprite: SpriteRef;
  readonly repeatable: boolean;
}

export const BLESSINGS: Readonly<Record<BlessingId, BlessingDef>> = {
  fire: { name: 'Fuego del habanero', description: 'Comienza con el poder de lanzar bolas de fuego.', price: 30,
    sprite: { ...OBJECT_SHEET, frame: OBJECT_FRAMES.chile }, repeatable: false },
  shield: { name: 'Escudo de jade', description: 'Comienza con un escudo que absorbe un golpe.', price: 20,
    sprite: { ...OBJECT_SHEET, frame: OBJECT_FRAMES.shield }, repeatable: false },
  life: { name: 'Corazón de jade', description: '50 cacao por vida extra. Elige cuántas llevar.', price: 50,
    sprite: { ...OBJECT_SHEET, frame: OBJECT_FRAMES.jadeHeart }, repeatable: true },
};

export const EK_CHUAH = {
  name: 'Ek Chuah',
  title: 'Un encuentro en el camino',
  greeting: 'Has llegado lejos, guardián. Tu cacao puede ayudarte en lo que viene. Elige una bendición y sigue tu camino.',
  note: 'Puedes comprar varias vidas. Fuego y escudo: uno de cada uno por encuentro; se pierden con el daño o al morir.',
  file: 'personajes/ek-chuah-caricatura.webp',
  // El intercambio de poderes es una adaptación ficticia para esta aventura familiar.
  source: 'https://www.inah.gob.mx/images/boletines/2024/753/Boletin%20753.pdf',
} as const;

export const EK_CHUAH_OFFERING: OfferingConfig = { deity: 'ekChuah', offers: ['fire', 'shield', 'life'] };
