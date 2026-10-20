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

const NUMERATION_SOURCE: DiscoverySource = {
  label: 'INAH · Anales de Antropología · numeración maya',
  url: 'https://revistas.inah.gob.mx/index.php/anales/article/view/7069/7912',
};
const CALENDAR_SOURCE: DiscoverySource = {
  label: 'Smithsonian NMAI · Sistema de calendario maya',
  url: 'https://maya.nmai.si.edu/sites/default/files/resources/Sistema%20de%20calendario%20maya.pdf',
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
  { id: 'edzna-cinco-pisos', levelId: '2-2', place: 'Edzná', title: 'El Edificio de los Cinco Pisos', category: 'Arquitectura',
    text: 'El Edificio de los Cinco Pisos es una de las construcciones emblemáticas de Edzná. La antigua ciudad creció en un valle fértil y sus habitantes construyeron canales y depósitos para aprovechar el agua.',
    toh: 'Cuenta los pisos con la mirada: cada nivel ayuda a imaginar lo grande que fue esta ciudad.',
    sources: [guideSource('Zona arqueológica de Edzná', 60, 61)] },
  { id: 'petenes-manglares', levelId: '2-4', place: 'Petenes', title: 'Tres tipos de mangle', category: 'Naturaleza',
    text: 'En la Reserva de la Biosfera Los Petenes conviven mangles rojos, negros y blancos. Estas plantas crecen entre la selva y el manglar, cerca de la costa campechana.',
    toh: '¿Ves cómo las raíces se asoman sobre el agua? Se observan con cuidado, sin pisarlas ni cortarlas.',
    sources: [guideSource('Entre selva y manglares', 74, 75)] },
  { id: 'izamal-convento', levelId: '3-5', place: 'Izamal', title: 'El convento sobre un centro de peregrinación', category: 'Historia',
    text: 'El convento de San Antonio de Padua fue construido sobre un antiguo centro de peregrinación dedicado a Itzamná. Izamal se llama Ciudad de las Tres Culturas por reunir lo maya, lo colonial y lo contemporáneo.',
    toh: 'Mira el amarillo del convento y los arcos de su atrio: Izamal se reconoce desde lejos.',
    sources: [guideSource('Izamal, Pueblo Mágico', 128, 129)] },
  { id: 'chichen-castillo', levelId: '4-1', place: 'Chichén Itzá', title: 'El Castillo y la serpiente de luz', category: 'Arquitectura',
    text: 'En El Castillo, un efecto de luz y sombra dibuja triángulos que parecen el cuerpo de una serpiente. Los distintos conjuntos de la ciudad estaban unidos por caminos llamados sacbés.',
    toh: 'Mira las escalinatas de El Castillo: la luz y la sombra también pueden contar historias.',
    sources: [guideSource('Zona arqueológica de Chichén Itzá', 136, 137)] },
  { id: 'valladolid-cacao', levelId: '4-3', place: 'Valladolid', title: 'El cacao, ofrenda y moneda', category: 'Historia',
    text: 'En Valladolid, el museo Choco Story explica el uso del cacao como ofrenda y moneda en el mundo prehispánico. Por eso los granos de cacao tienen un lugar especial en esta aventura.',
    toh: 'Cada grano que recoges te recuerda que el cacao fue muy valioso para los pueblos mayas.',
    sources: [guideSource('Valladolid, Pueblo Mágico', 148, 149)] },
  { id: 'nuevo-xcan-mono-arana', levelId: '4-5', place: 'Nuevo Xcán', title: 'Monos araña de Punta Laguna', category: 'Naturaleza',
    text: 'La reserva de Otoch Ma’ax Yetel Kooh alberga monos araña y monos aulladores. En Punta Laguna, la cooperativa Nahil Tucha participa en el cuidado del área natural.',
    toh: 'Mira hacia las ramas altas y escucha: a los monos se les observa desde lejos.',
    sources: [guideSource('Nuevo Xcan y Punta Laguna', 152, 153)] },
  { id: 'morelos-arrecife', levelId: '5-2', place: 'Puerto Morelos', title: 'El arrecife de Puerto Morelos', category: 'Naturaleza',
    text: 'El arrecife de Puerto Morelos forma parte del Gran Arrecife Mesoamericano. Allí hay corales de distintas formas, como el cuerno de alce y el coral estrella.',
    toh: 'Un coral es un ser vivo: se mira de cerca, pero nunca se toca ni se rompe.',
    sources: [guideSource('Puerto Morelos y Ruta de los Cenotes', 172, 173)] },
  { id: 'akumal-yalku', levelId: '5-6', place: 'Akumal', title: 'Las aguas claras de Yal-kú', category: 'Naturaleza',
    text: 'Las aguas claras de Yal-kú permiten observar peces y raíces de manglar. También es un lugar para la observación de aves.',
    toh: 'Si el agua es tan clara, puedes mirar sin molestar. ¡Observa con paciencia!',
    sources: [guideSource('Tulum y sus lagunas', 194, 195)] },
  { id: 'tulum-castillo', levelId: '6-1', place: 'Tulum', title: 'El Castillo de Tulum', category: 'Arquitectura',
    text: 'La antigua ciudad de Tulum también fue conocida con el nombre maya de Zamá. Su Castillo conserva un templo con columnas de forma serpentina, dentro de un recinto con muralla.',
    toh: 'Busca el templo de lo alto: las columnas en forma de serpiente son su sello.',
    sources: [guideSource('Zona arqueológica de Tulum', 186, 187)] },
  { id: 'limones-chacchoben', levelId: '6-4', place: 'Limones', title: 'Chacchoben y sus lagunas', category: 'Historia',
    text: 'El surgimiento de Chacchoben estuvo ligado a dos fuentes de agua: las lagunas del Ocho y de Chacchoben. En la zona arqueológica se reconocen rasgos de los estilos Petén, Río Bec y Chenes.',
    toh: 'Dónde hay agua, hubo ciudades. Observa el basamento escalonado y piensa qué lo rodeaba.',
    sources: [guideSource('Limones-Chacchoben', 204, 205)] },
  { id: 'xpujil-tres-torres', levelId: '7-1', place: 'Xpujil', title: 'Las Tres Torres de Xpuhil', category: 'Arquitectura',
    text: 'La Estructura I de Xpuhil tiene tres torres con templos simulados en su parte superior. El edificio de las Tres Torres cuenta con doce aposentos.',
    toh: 'Cuenta las torres y no te dejes engañar: los templos de arriba son simulados.',
    sources: [guideSource('Xpujil y zona arqueológica de Xpuhil', 232, 233)] },
  { id: 'calakmul-estructura-2', levelId: '7-3', place: 'Calakmul', title: 'La gran Estructura II', category: 'Historia',
    text: 'Calakmul fue una capital regional y rival de Tikal, en la actual Guatemala. La Estructura II es uno de los grandes basamentos que destacan alrededor de la plaza central.',
    toh: 'Entre tanta selva, un gran basamento asoma: así se reconocía una capital.',
    sources: [guideSource('Zona arqueológica de Calakmul', 238, 239)] },
  // Páginas del códice de numerología: se registran al cruzar la puerta de jade de cada secreto.
  // TODO(cultura): confirmar con la literatura especializada las páginas exactas de cada fuente.
  { id: 'codice-cuenta', levelId: '1-extra', place: 'Códice maya', title: 'Puntos y rayas', category: 'Historia',
    text: 'Los mayas escribían los números con tres signos: el punto vale 1, la raya vale 5 y la concha representa el cero. El 13 se escribe con dos rayas y tres puntos.',
    toh: 'Cuenta los signos de cada estela antes de elegir: cada raya equivale a cinco puntos.',
    sources: [NUMERATION_SOURCE] },
  { id: 'codice-suma', levelId: '2-extra', place: 'Códice maya', title: 'Sumar con rayas', category: 'Historia',
    text: 'Para sumar con puntos y rayas se juntan los signos: cinco puntos se cambian por una raya. Así 9 + 8 = 17, que se escribe con tres rayas y dos puntos.',
    toh: 'Cuando junte cinco puntos, cámbialos por una raya. ¡Es la regla del conteo maya!',
    sources: [NUMERATION_SOURCE] },
  { id: 'codice-serie', levelId: '3-extra', place: 'Códice maya', title: 'Contar de cinco en cinco', category: 'Historia',
    text: 'Como cada raya vale cinco, muchas series crecen una raya a la vez. La serie 3, 8, 13, 18 añade una raya en cada paso.',
    toh: 'Compara dos numerales vecinos y fíjate qué signo se añadió.',
    sources: [NUMERATION_SOURCE] },
  { id: 'codice-cero', levelId: '4-extra', place: 'Códice maya', title: 'La concha y el cero', category: 'Historia',
    text: 'La concha representa el cero en la numeración maya. No suma nada por sí sola, pero señala un lugar vacío y permite escribir cantidades grandes sin confundirse.',
    toh: 'Si una piedra tiene una concha, vale cero: sumarla no cambia el resultado.',
    sources: [NUMERATION_SOURCE] },
  { id: 'codice-posicion', levelId: '5-extra', place: 'Códice maya', title: 'Números que se apilan', category: 'Historia',
    text: 'Los mayas apilaban sus numerales: abajo van las unidades y cada nivel de arriba vale veinte veces más. Un punto sobre tres puntos es 1 × 20 + 3 = 23.',
    toh: 'Lee de abajo hacia arriba: primero las unidades y luego las veintenas.',
    sources: [NUMERATION_SOURCE] },
  { id: 'codice-uinal', levelId: '6-extra', place: 'Códice maya', title: 'El uinal de veinte días', category: 'Historia',
    text: 'En el calendario maya, el uinal es un periodo de 20 días. Dos uinales son 40 días, que se escriben con un 2 sobre una concha: 2 × 20 + 0.',
    toh: 'Veinte días forman un uinal. ¿Cuántos días hay en dos?',
    sources: [CALENDAR_SOURCE, NUMERATION_SOURCE] },
  { id: 'codice-tzolkin', levelId: '7-extra', place: 'Códice maya', title: "El Tzolk'in de 260 días", category: 'Historia',
    text: "El Tzolk'in combina los números del 1 al 13 con 20 nombres de día y se repite cada 260 días. Por eso 13 × 20 = 260.",
    toh: 'Trece números por veinte nombres: multiplica y tendrás la duración del ciclo sagrado.',
    sources: [CALENDAR_SOURCE] },
  { id: 'codice-haab', levelId: '7-extra', place: 'Códice maya', title: 'El Haab de 365 días', category: 'Historia',
    text: 'El Haab es el calendario solar: 18 meses de 20 días suman 360, y cinco días finales completan 365. Por eso 18 × 20 + 5 = 365.',
    toh: 'Primero multiplica los meses por sus días y no olvides los cinco días finales.',
    sources: [CALENDAR_SOURCE] },
] as const satisfies readonly NotebookEntry[];

export type DiscoveryId = typeof NOTEBOOK_ENTRIES[number]['id'];
export const getNotebookEntry = (id: string): NotebookEntry | undefined => NOTEBOOK_ENTRIES.find(entry => entry.id === id);
export const isDiscoveryId = (id: unknown): id is DiscoveryId => typeof id === 'string' && !!getNotebookEntry(id);
