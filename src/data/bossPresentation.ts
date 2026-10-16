import type { BossId } from '../engine/types';
import { KAIMAN_REST_FRAME, KAIMAN_REST_NEIGHBOR } from './kaimanArt';

interface BossPresentation {
  readonly image: string;
  /** Recorte del retrato dentro de la hoja existente, sin mostrar las otras poses. */
  readonly frame?: readonly [number, number, number, number];
  /** Región del atlas ajena al personaje que se oculta sin recortar su silueta. */
  readonly cutout?: readonly [number, number, number, number];
  readonly hint: string;
  readonly arena: string;
  readonly color: string;
}

export const BOSS_PRESENTATIONS: Readonly<Record<BossId, BossPresentation>> = {
  sargazo: {
    image: 'bosses/sargazo.webp', frame: [15, 69, 499, 447],
    hint: '¡Libera a las tortugas! Su pulso abre el núcleo: tócalo nadando. Cerca de ellas recuperas aire.',
    arena: 'Bahía de Akumal', color: '#8af9ea',
  },
  puas: {
    image: 'jefe_grande.webp', hint: 'Esquiva sus púas. ¡Písalo cuando esté mareado!',
    arena: 'Guarida de la selva', color: '#ffb665',
  },
  kaiman: {
    image: 'bosses/kaiman.webp', frame: KAIMAN_REST_FRAME, cutout: KAIMAN_REST_NEIGHBOR,
    hint: 'Esquiva lodo y semillas. ¡Pisa el lomo expuesto o dispara a las fauces abiertas!',
    arena: 'Pantano de Calkiní', color: '#a8e5a2',
  },
  huayChivo: {
    image: 'bosses/huayChivo.webp', frame: [42, 64, 427, 466],
    hint: 'Los ojos señalan el arco real. Reenciende antorchas con fuego. ¡Písalo cuando vea estrellas!',
    arena: 'Atrio de Izamal', color: '#ffe185',
  },
  huayPek: {
    image: 'bosses/huayPek.webp', frame: [11, 122, 485, 385],
    hint: '¡Salta sobre los ladridos y golpéalo cuando brillen sus ojos!',
    arena: 'Claro de niebla de Nuevo Xcán', color: '#99eee5',
  },
};
