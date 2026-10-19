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
  readonly sheet?: readonly [number, number];
}

export const BOSS_PRESENTATIONS: Readonly<Record<BossId, BossPresentation>> = {
  camazotz: {
    image: 'bosses/camazotz.webp', frame: [19, 93, 373, 324], sheet: [1254, 1254],
    hint: 'Esquiva la picada y pisa al aterrizar. Después, enciende cuatro antorchas con fuego. En el eclipse, reúne tres luces y usa los pilares contra el rayo.',
    arena: 'Cima de Calakmul · Trono de fantasía', color: '#f4cf75',
  },
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
  lorencillo: {
    image: 'bosses/lorencillo.webp', frame: [45, 90, 457, 420],
    hint: 'Salta la estocada y pisa la espalda expuesta. A media vida encadena dos: ¡espera la segunda! Evita las marcas de cañón, también en las cofas.',
    // TODO(cultura): Lorencillo en Chetumal es ficción; el ataque histórico fue en Campeche en 1685.
    arena: 'Bahía de Chetumal', color: '#7fd0e0',
  },
  huayPek: {
    image: 'bosses/huayPek.webp', frame: [11, 122, 485, 385],
    hint: '¡Salta sobre los ladridos y golpéalo cuando brillen sus ojos!',
    arena: 'Claro de niebla de Nuevo Xcán', color: '#99eee5',
  },
};
