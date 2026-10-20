import { fact, guide, sourced, type StationInfo } from './types';

const cancun = guide('Cancún y San Miguelito', 160, 161);
const nichupte = guide('Manglares de Nichupté', 162, 163);
const morelos = guide('Puerto Morelos y Ruta de los Cenotes', 172, 173);
const playa = guide('Playa del Carmen y Circuito Paamul II', 178, 179);
const mapaTulum = guide('Mapa de atractivos de Tulum y Tulum Aeropuerto', 184, 185);
const muyil = guide('Muyil y Xelhá', 190, 191);
const lagunas = guide('Tulum y sus lagunas', 194, 195);

export const WORLD_5_INFO: Readonly<Record<string, StationInfo>> = {
  '5-1': {
    location: 'Cancún · Quintana Roo', relation: 'direct',
    note: 'El punto ferroviario corresponde a Cancún Aeropuerto; la ficha describe la ciudad y su entorno.',
    description: sourced('Además de sus playas, Cancún conserva patrimonio arqueológico y paisajes de humedales. La guía recorre sus museos, los antiguos asentamientos costeros y los manglares de Nichupté. Son lugares que permiten conocer otra parte del Caribe y la relación histórica de sus habitantes con el mar.', guide('Cancún y Manglares de Nichupté', 160, 163)),
    facts: [
      fact('Historia', 'Un sendero comunica el Museo Maya de Cancún con la zona arqueológica de San Miguelito.', cancun),
      fact('Historia', 'San Miguelito y El Rey participaron en el comercio marítimo y en actividades pesqueras.', nichupte),
      fact('Naturaleza', 'Los humedales de Nichupté son refugio de aves, reptiles y mamíferos.', nichupte),
    ],
  },
  '5-2': {
    location: 'Puerto Morelos · Quintana Roo', relation: 'direct',
    description: sourced('Puerto Morelos combina la vida de un pueblo pesquero con los paisajes submarinos del Caribe. Frente a su costa se conserva un arrecife que forma parte del sistema mesoamericano. Tierra adentro, la guía propone descubrir jardines, senderos y una ruta de cenotes entre la selva.', morelos),
    facts: [
      fact('Naturaleza', 'El arrecife de Puerto Morelos forma parte del Gran Arrecife Mesoamericano.', morelos),
      fact('Naturaleza', 'En el arrecife hay corales de distintas formas, como el cuerno de alce y el coral estrella.', morelos),
      fact('Cultura viva', 'El Jardín Botánico Dr. Alfredo Barrera Marín permite conocer plantas medicinales y vestigios de un campamento chiclero.', morelos),
    ],
  },
  '5-3': {
    location: 'Playa del Carmen · Quintana Roo', relation: 'direct',
    description: sourced('En Playa del Carmen, la vida de la ciudad se encuentra con los vestigios de un antiguo puerto maya. La guía reúne paseos por sus espacios públicos y referencias a su patrimonio arqueológico. En la región también hay cavernas que conservan rastros de actividades del pasado.', playa),
    facts: [
      fact('Historia', 'El asentamiento maya de Playa del Carmen funcionó como puerto para las poblaciones de Cozumel.', playa),
      fact('Cultura viva', 'El Portal Maya es una de las referencias del Parque Los Fundadores.', playa),
      fact('Historia', 'La Cueva de las Manitas, en el circuito regional Paamul II, conserva pinturas rupestres.', playa),
    ],
  },
  '5-4': {
    location: 'Xcaret y costa oriental · Quintana Roo', relation: 'regional',
    note: 'La guía sitúa Xcaret en su mapa regional. Los datos ampliados corresponden a otros sitios de la costa oriental, identificados por su nombre.',
    description: sourced('El mapa de la guía sitúa la zona arqueológica de Xcaret en el corredor costero al norte de Tulum. Para acompañar el nivel, Toh comparte contexto de esta región: antiguos puertos, lagunas y ciudades que se relacionaban a través de las rutas comerciales del litoral.', guide('Mapa regional y puertos de la costa oriental', 184, 191)),
    facts: [
      fact('Historia', 'Xcaret aparece como zona arqueológica en el mapa de atractivos de Tulum y Tulum Aeropuerto.', mapaTulum),
      fact('Historia', 'En esta misma región, Muyil formó parte de una red comercial costera.', muyil),
      fact('Arquitectura', 'En Xelhá se conservan conjuntos con pinturas murales, como el de Los Pájaros.', muyil),
    ],
  },
  '5-5': {
    location: 'Puerto Aventuras y costa oriental · Quintana Roo', relation: 'regional',
    note: 'Puerto Aventuras figura en el mapa regional de la guía. Los datos siguientes describen ese corredor costero, no instalaciones de la localidad.',
    description: sourced('Puerto Aventuras aparece en el mapa que enlaza los atractivos de la costa oriental. Esta ficha amplía la mirada hacia el paisaje regional, donde antiguos asentamientos y cuerpos de agua forman parte de una misma historia. Cada dato identifica el lugar concreto al que se refiere.', guide('Mapa regional y Muyil', 184, 191)),
    facts: [
      fact('Historia', 'El mapa regional incluye Puerto Aventuras junto a los recorridos hacia Xcaret, Xelhá y Tulum.', mapaTulum),
      fact('Naturaleza', 'La laguna Chunyaxché, cerca de Muyil, está rodeada de abundante flora y fauna.', muyil),
      fact('Historia', 'Xelhá fue un puerto vinculado al reino de Cobá.', muyil),
    ],
  },
  '5-6': {
    location: 'Akumal y entorno de Yal-kú · Quintana Roo', relation: 'regional',
    note: 'Akumal es una referencia de la bahía en el juego. La guía aporta aquí contexto regional de Yal-kú y las lagunas, sin documentar la batalla de Sargazo.',
    description: sourced('Para acompañar el destino de Akumal, esta ficha recorre los paisajes de lagunas y manglares descritos en la sección regional de Tulum. La guía destaca Yal-kú y Kaan Luum como ejemplos de esa diversidad, entre aguas transparentes, raíces de mangle y lugares para observar aves.', lagunas),
    facts: [
      fact('Naturaleza', 'Las aguas claras de Yal-kú permiten observar peces y raíces de manglar.', lagunas),
      fact('Naturaleza', 'Yal-kú es también un lugar para la observación de aves.', lagunas),
      fact('Naturaleza', 'La laguna Kaan Luum presenta distintas tonalidades de azul y un cenote en su interior.', lagunas),
    ],
  },
};
