import type { BossId } from '../engine/types';

interface BossPresentation {
  readonly image: string;
  /** Recorte del retrato dentro de la hoja existente, sin mostrar las otras poses. */
  readonly frame?: readonly [number, number, number, number];
  readonly hint: string;
  readonly arena: string;
  readonly color: string;
}

export const BOSS_PRESENTATIONS: Readonly<Record<BossId, BossPresentation>> = {
  puas: {
    image: 'jefe_grande.webp', hint: 'Esquiva sus púas. ¡Písalo cuando esté mareado!',
    arena: 'Guarida de la selva', color: '#ffb665',
  },
  kaiman: {
    image: 'bosses/kaiman.webp', frame: [15, 182, 517, 297],
    hint: '¡Salta las olas y pisa su lomo cuando emerja!',
    arena: 'Pantano de Calkiní', color: '#a8e5a2',
  },
  huayChivo: {
    image: 'bosses/huayChivo.webp', frame: [42, 64, 427, 466],
    hint: 'Esquiva la embestida. ¡Písalo cuando choque y vea estrellas!',
    arena: 'Atrio amarillo de Izamal', color: '#ffe185',
  },
  huayPek: {
    image: 'bosses/huayPek.webp', frame: [11, 122, 485, 385],
    hint: '¡Salta sobre los ladridos y golpéalo cuando brillen sus ojos!',
    arena: 'Claro de niebla de Nuevo Xcán', color: '#99eee5',
  },
};
