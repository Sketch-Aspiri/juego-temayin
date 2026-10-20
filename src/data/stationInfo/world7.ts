import { fact, guide, sourced, type StationInfo } from './types';

const xpujil = guide('Xpujil y zona arqueológica de Xpuhil', 232, 233);
const artesanias = guide('Ejido 20 de Noviembre', 236, 237);
const calakmul = guide('Zona arqueológica de Calakmul', 238, 239);
const selva = guide('Reserva de la Biosfera de Calakmul y Balamkú', 240, 241);

export const WORLD_7_INFO: Readonly<Record<string, StationInfo>> = {
  '7-1': {
    location: 'Xpujil · Campeche', relation: 'direct',
    description: sourced('Xpujil es un punto de partida para conocer antiguas ciudades de la región Río Bec. Las torres ornamentales de Xpuhil son parte de su patrimonio más reconocible. En los alrededores, los talleres artesanales muestran otras maneras de relacionarse con los recursos y las historias de la selva.', guide('Xpujil y talleres de su entorno', 232, 237)),
    facts: [
      fact('Arquitectura', 'La Estructura I de Xpuhil tiene tres torres con templos simulados en su parte superior.', xpujil),
      fact('Arquitectura', 'El edificio de las Tres Torres cuenta con doce aposentos.', xpujil),
      fact('Cultura viva', 'En el ejido 20 de Noviembre hay talleres que crean objetos a partir de semillas y madera recolectada.', artesanias),
    ],
  },
  '7-2': {
    location: 'Conhuas y entorno de Calakmul · Campeche', relation: 'regional',
    note: 'Conhuas es una referencia regional del mapa. La guía describe aquí el Volcán de los Murciélagos y otros paisajes de Calakmul.',
    description: sourced('La región de Calakmul guarda cuevas y refugios de fauna entre grandes extensiones de selva. Para acompañar Conhuas, Toh comparte los paisajes descritos por la guía en este entorno. Uno de los más singulares recibe su nombre por la salida de murciélagos al atardecer.', selva),
    facts: [
      fact('Naturaleza', 'El Volcán de los Murciélagos recibe ese nombre porque los animales salen formando una espiral que recuerda una columna de humo.', selva),
      fact('Naturaleza', 'La guía sitúa al Volcán de los Murciélagos sobre la carretera 186, al oeste de Xpujil.', selva),
      fact('Historia', 'En Balamkú se conserva un friso con escenas de ascenso al trono y representaciones de jaguares.', selva),
    ],
  },
  '7-3': {
    location: 'Calakmul · Campeche', relation: 'direct',
    note: 'La estación es un acceso a la región. La ciudad arqueológica y la reserva son lugares distintos del edificio ferroviario.',
    description: sourced('La ciudad maya de Calakmul se encuentra rodeada por la selva campechana. Sus grandes plazas y complejos arquitectónicos muestran la importancia que alcanzó. El patrimonio construido convive con una reserva que protege distintos tipos de selva y una gran diversidad de plantas y animales.', guide('Calakmul y su reserva', 238, 240)),
    facts: [
      fact('Historia', 'Calakmul fue una capital regional y rival de Tikal, en la actual Guatemala.', calakmul),
      fact('Arquitectura', 'La Estructura II es uno de los grandes basamentos que destacan alrededor de la plaza central.', calakmul),
      fact('Naturaleza', 'En la reserva conviven selvas altas, medianas y bajas.', selva),
    ],
  },
  '7-4': {
    location: 'Entorno de Calakmul · Campeche', relation: 'fiction',
    note: 'El Trono de Camazotz es un escenario ficticio del juego. No es una estación ni un recinto arqueológico visitable.',
    description: { text: 'La aventura imagina aquí su encuentro final y el rescate de Temayina. El trono, el eclipse eterno y el Sol de Jade pertenecen al relato de Temayin. Los datos culturales de esta ficha hablan de la ciudad real de Calakmul y del bosque que la rodea.', source: 'game' },
    facts: [
      fact('Arquitectura', 'La arquitectura de la antigua ciudad de Calakmul corresponde a la región del Petén.', calakmul),
      fact('Historia', 'La ciudad conserva estelas que ayudan a conocer su historia.', calakmul),
      fact('Naturaleza', 'La guía menciona al pájaro toh entre las aves que pueden observarse en el entorno de la reserva.', selva),
    ],
  },
};
