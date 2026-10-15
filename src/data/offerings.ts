import type { BlessingId, OfferingConfig } from '../engine/blessings';

export interface BlessingDef {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly symbol: string;
}

export const BLESSINGS: Readonly<Record<BlessingId, BlessingDef>> = {
  fire: { name: 'Fuego del habanero', description: 'Comienza con el poder de lanzar bolas de fuego.', price: 30, symbol: '✹' },
  shield: { name: 'Escudo de jade', description: 'Comienza con un escudo que absorbe un golpe.', price: 20, symbol: '⬡' },
  life: { name: 'Corazón de jade', description: 'Una vida extra para esta partida.', price: 50, symbol: '♥' },
};

export const EK_CHUAH = {
  name: 'Ek Chuah',
  title: 'Un encuentro en el camino',
  greeting: 'Has llegado lejos, guardián. Tu cacao puede ayudarte en lo que viene. Elige una bendición y sigue tu camino.',
  note: 'Una de cada bendición por encuentro. El fuego y el escudo se pierden con el daño o al morir.',
  file: 'personajes/ek-chuah-caricatura.webp',
  // El intercambio de poderes es una adaptación ficticia para esta aventura familiar.
  source: 'https://www.inah.gob.mx/images/boletines/2024/753/Boletin%20753.pdf',
} as const;

export const EK_CHUAH_OFFERING: OfferingConfig = { deity: 'ekChuah', offers: ['fire', 'shield', 'life'] };
