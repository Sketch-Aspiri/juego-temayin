import { guide, guideUrl, pageLabel, type FactCategory } from '../stationInfo/types';

export interface DiscoverySource {
  readonly label: string;
  readonly url: string;
}

export interface NotebookEntry {
  readonly id: string;
  readonly levelId: string;
  readonly place: string;
  readonly title: string;
  readonly category: FactCategory;
  readonly text: string;
  /** Invitación a observar, no una afirmación histórica adicional. */
  readonly toh: string;
  readonly sources: readonly DiscoverySource[];
}

const guideSource = (section: string, first: number, last = first): DiscoverySource => {
  const reference = guide(section, first, last);
  return { label: `INAH · ${section}, ${pageLabel(reference)}`, url: guideUrl(reference) };
};

export const NOTEBOOK_ENTRIES = [
  { id: 'palenque-palacio', levelId: '1-1', place: 'Palenque', title: 'El Palacio de Palenque', category: 'Arquitectura',
    text: 'El Palacio reúne patios, pasadizos y una torre. Sus espacios fueron utilizados por los gobernantes de la antigua ciudad maya.',
    toh: 'Mira los patios y la torre: un edificio puede guardar muchas historias.',
    sources: [{ label: 'INAH · El Palacio de Palenque', url: 'https://www.inah.gob.mx/foto-del-dia/el-palacio-de-palenque-lugar-de-la-elite-maya' }] },
  { id: 'palenque-saraguatos', levelId: '1-1', place: 'Palenque', title: 'Los monos saraguatos', category: 'Naturaleza',
    text: 'En el Parque Nacional de Palenque viven monos saraguatos y tucanes. La selva que rodea los edificios también forma parte de este lugar.',
    toh: 'Observa a la fauna desde lejos. Los animales reales tienen su propia vida; sus acciones en la aventura son fantasía.',
    sources: [guideSource('Parque Nacional de Palenque', 25)] },
  { id: 'palenque-orquideas', levelId: '1-1', place: 'Palenque', title: 'Las orquídeas de la selva', category: 'Naturaleza',
    text: 'El Parque Nacional de Palenque conserva distintas especies de orquídeas en su orquideario. Conocer sus plantas es otra manera de explorar la selva.',
    toh: '¿Cuántas formas de hojas y flores puedes distinguir? Observa sin arrancarlas.',
    sources: [guideSource('Parque Nacional de Palenque', 25)] },
  { id: 'campeche-muralla', levelId: '2-3', place: 'Campeche', title: 'La ciudad amurallada', category: 'Historia',
    text: 'Campeche conserva murallas, puertas y baluartes del antiguo puerto. Sus construcciones ayudan a conocer la historia de la ciudad.',
    toh: 'Sigue con la mirada la muralla e imagina cómo conectaba las defensas del puerto.',
    sources: [guideSource('La ciudad amurallada', 68, 69)] },
  { id: 'campeche-baluartes', levelId: '2-3', place: 'Campeche', title: 'Los baluartes', category: 'Arquitectura',
    text: 'La defensa de Campeche incluyó una muralla con ocho baluartes. Estos recintos formaban parte de las fortificaciones del puerto.',
    toh: 'En el juego los cañones ayudan a cruzar. En la ciudad real, las fortificaciones son patrimonio que debemos cuidar.',
    sources: [guideSource('La ciudad amurallada', 68, 69)] },
  { id: 'campeche-puertas', levelId: '2-3', place: 'Campeche', title: 'Las puertas de la ciudad', category: 'Arquitectura',
    text: 'La Puerta de Tierra y la Puerta de Mar son referencias de la ciudad amurallada. La Puerta de Mar comunicaba el recinto con el mar.',
    toh: 'Los nombres de los lugares también dan pistas. ¿Hacia dónde crees que llevaba cada puerta?',
    sources: [guideSource('La ciudad amurallada', 68, 69),
      { label: 'INAH · Puertas de Campeche', url: 'https://lugares.inah.gob.mx/es/node/4832?page=%2C%2C%2C1%2C0%2C0%2C0' }] },
  { id: 'bacalar-laguna', levelId: '6-5', place: 'Bacalar', title: 'Una laguna de agua dulce', category: 'Naturaleza',
    text: 'La laguna de Bacalar es de agua dulce. También se conoce como la Laguna de los Siete Colores.',
    toh: 'Aunque el agua recuerde al Caribe, estás explorando una laguna de agua dulce.',
    sources: [guideSource('Bacalar, Pueblo Mágico', 210, 211)] },
  { id: 'bacalar-estromatolitos', levelId: '6-5', place: 'Bacalar', title: 'Los estromatolitos', category: 'Naturaleza',
    text: 'Los estromatolitos son estructuras minerales construidas por comunidades de microbios. Su superficie viva es frágil: dañarla afecta a quienes las construyen.',
    toh: '¡Nada por encima y evita tocarlos! Descubrir también significa cuidar.',
    sources: [{ label: 'Tarjeta de Reporte de laguna Bacalar (2021) · Estromatolitos, pp. 10–11',
      url: 'https://sedeturqroo.gob.mx/pmts2030/documentos/marco_normativo/TARJETA-DE-REPORTE-DE-LAGUNA-BACALAR-DIGITAL-2021.pdf#page=5' }] },
  { id: 'bacalar-fuerte', levelId: '6-5', place: 'Bacalar', title: 'El Fuerte de San Felipe', category: 'Historia',
    text: 'El Fuerte de San Felipe alberga el Museo de Historia Regional. En Bacalar, el paisaje de la laguna convive con edificios que conservan la memoria del lugar.',
    toh: 'El fuerte es real; los piratas y poderes de nuestra aventura tienen elementos de fantasía.',
    sources: [guideSource('Bacalar, Pueblo Mágico', 210, 211)] },
] as const satisfies readonly NotebookEntry[];

export type DiscoveryId = typeof NOTEBOOK_ENTRIES[number]['id'];
export const getNotebookEntry = (id: string): NotebookEntry | undefined => NOTEBOOK_ENTRIES.find(entry => entry.id === id);
export const isDiscoveryId = (id: unknown): id is DiscoveryId => typeof id === 'string' && !!getNotebookEntry(id);
