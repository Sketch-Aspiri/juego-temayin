import { fact, guide, sourced, type StationInfo } from './types';

const tulum = guide('Zona arqueológica de Tulum', 186, 187);
const parque = guide('Parque Nacional Tulum y Parque del Jaguar', 192, 193);
const carrillo = guide('Felipe Carrillo Puerto', 200, 201);
const chacc = guide('Limones-Chacchoben', 204, 205);
const bacalar = guide('Bacalar, Pueblo Mágico', 210, 211);
const canal = guide('Canal de los Piratas', 212);
const chetumal = guide('Chetumal', 218, 221);
const manatees = guide('Santuario de Manatíes', 222);

export const WORLD_6_INFO: Readonly<Record<string, StationInfo>> = {
  '6-1': {
    location: 'Tulum · Quintana Roo', relation: 'direct',
    description: sourced('La antigua ciudad de Tulum se asoma al Caribe desde su recinto amurallado. Su posición facilitó el aprovechamiento de los recursos marinos y el intercambio por mar. Los templos, palacios y accesos que conserva ayudan a imaginar la organización de este asentamiento costero.', tulum),
    facts: [
      fact('Historia', 'La antigua ciudad de Tulum también fue conocida con el nombre maya de Zamá.', tulum),
      fact('Arquitectura', 'La muralla delimita el recinto por tres lados y tiene cinco accesos.', tulum),
      fact('Arquitectura', 'El Castillo conserva un templo con columnas de forma serpentina.', tulum),
    ],
  },
  '6-2': {
    location: 'Tulum Aeropuerto · Quintana Roo', relation: 'regional',
    note: 'La guía agrupa Tulum y Tulum Aeropuerto. Estos datos corresponden a los parques de su entorno, no al edificio del aeropuerto.',
    description: sourced('Esta parada comparte con Tulum una sección de la guía dedicada al patrimonio de la costa oriental. Para conocer su entorno, Toh mira hacia los paisajes del Parque del Jaguar. Allí, la conservación de los ecosistemas y el conocimiento de la historia forman parte de un mismo recorrido.', parque),
    facts: [
      fact('Naturaleza', 'El Parque del Jaguar reúne humedales, dunas, selva, cenotes y playas.', parque),
      fact('Historia', 'Tankah, Tulum y Xelhá participaron en una importante ruta comercial marítima maya.', parque),
      fact('Cultura viva', 'El Museo de la Costa Oriental aborda la historia de las poblaciones mayas desde la antigüedad hasta el presente.', parque),
    ],
  },
  '6-3': {
    location: 'Felipe Carrillo Puerto · Quintana Roo', relation: 'direct',
    note: 'Este destino de Quintana Roo es distinto de Carrillo Puerto-Champotón, en Campeche.',
    description: sourced('Felipe Carrillo Puerto conserva una historia fundamental para comprender al pueblo maya de Quintana Roo. La guía presenta sus edificios, museos y expresiones culturales. El nombre antiguo de la población y sus espacios de memoria recuerdan acontecimientos del siglo XIX y la continuidad de sus comunidades.', carrillo),
    facts: [
      fact('Historia', 'La población fue conocida como Chan Santa Cruz antes de recibir su nombre actual.', carrillo),
      fact('Cultura viva', 'El Museo Maya Santa Cruz Xbáalam Naj presenta música mayapax, artesanías y otras expresiones de la región.', carrillo),
      fact('Arquitectura', 'El Santuario de la Cruz Parlante, también llamado Balam Nah, es uno de sus edificios emblemáticos.', carrillo),
    ],
  },
  '6-4': {
    location: 'Limones · Quintana Roo', relation: 'direct',
    note: 'La guía identifica esta parada como Limones-Chacchoben.',
    description: sourced('Desde Limones, la guía se acerca a los bosques de Noh Bec y a la antigua ciudad de Chacchoben. Los paisajes de selva y lagunas ayudan a entender la importancia de los recursos naturales. Los edificios arqueológicos muestran también vínculos con otras regiones del mundo maya.', chacc),
    facts: [
      fact('Historia', 'El surgimiento de Chacchoben estuvo ligado a dos fuentes de agua: las lagunas del Ocho y de Chacchoben.', chacc),
      fact('Arquitectura', 'En Chacchoben se reconocen rasgos de los estilos Petén, Río Bec y Chenes.', chacc),
      fact('Naturaleza', 'La guía destaca en Noh Bec la presencia de caobas centenarias.', chacc),
    ],
  },
  '6-5': {
    location: 'Bacalar · Quintana Roo', relation: 'direct',
    description: sourced('Bacalar reúne paisajes de agua dulce y edificios que cuentan la historia de la región. La Laguna de los Siete Colores acompaña la vida del pueblo. El fuerte, los museos y los canales permiten descubrir relaciones entre navegación, comercio y memoria local.', guide('Bacalar y Canal de los Piratas', 210, 212)),
    facts: [
      fact('Historia', 'El Fuerte de San Felipe alberga el Museo de Historia Regional.', bacalar),
      fact('Naturaleza', 'La Laguna de Bacalar es de agua dulce y también recibe el nombre de Laguna de los Siete Colores.', bacalar),
      fact('Historia', 'El Canal de los Piratas comunica la laguna de Bacalar con la Laguna Mariscal.', canal),
    ],
  },
  '6-6': {
    location: 'Chetumal · Quintana Roo', relation: 'direct',
    note: 'El punto ferroviario representa la estación Chetumal Aeropuerto; los datos describen la ciudad y su bahía.',
    description: sourced('La capital de Quintana Roo se encuentra junto a una gran bahía. Sus museos permiten conocer la historia regional y la diversidad del mundo maya. La guía también destaca los paisajes costeros y la conservación del manatí, una especie ligada a las aguas de este entorno.', guide('Chetumal y Santuario de Manatíes', 218, 222)),
    facts: [
      fact('Cultura viva', 'El Museo de la Cultura Maya aborda la historia de comunidades de México, Belice, Guatemala, Honduras y El Salvador.', chetumal),
      fact('Naturaleza', 'La bahía de Chetumal cuenta con un área protegida para conservar al manatí.', manatees),
      fact('Historia', 'En Oxtankah se captaba agua de lluvia mediante depósitos llamados chultunes.', chetumal),
    ],
  },
};
