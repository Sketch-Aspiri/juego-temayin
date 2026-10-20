import { fact, guide, sourced, type StationInfo } from './types';

const champoton = guide('Carrillo Puerto-Champotón', 54, 55);
const edzna = guide('Zona arqueológica de Edzná', 60, 61);
const campeche = guide('La ciudad amurallada', 68, 69);
const petenes = guide('Entre selva y manglares', 74, 75);
const tenabo = guide('Tenabo y Kankí', 76, 77);
const hecelchakan = guide('Hecelchakán y Xcalumkín', 82, 83);
const calkini = guide('Calkiní y El Remate', 84, 85);

export const WORLD_2_INFO: Readonly<Record<string, StationInfo>> = {
  '2-1': {
    location: 'Carrillo Puerto · Campeche', relation: 'direct',
    note: 'La guía la presenta como Carrillo Puerto-Champotón. Es un destino distinto de Felipe Carrillo Puerto, en Quintana Roo.',
    description: sourced('Esta parada campechana acerca al río Champotón y a la costa del golfo de México. La guía recorre desde aquí playas, manglares y edificios históricos. En Champotón, los templos y las fortificaciones conservan huellas de la vida del puerto y de su relación con el mar.', champoton),
    facts: [
      fact('Historia', 'El Fuerte de San Antonio de Champotón también es conocido como Castillo de Moch Cohuo.', champoton),
      fact('Naturaleza', 'En Playa Xpicob se observa bioluminiscencia: organismos diminutos hacen brillar el agua.', champoton),
      fact('Arquitectura', 'La Iglesia de Nuestra Señora de las Mercedes de Champotón fue fundada en el siglo XVII.', champoton),
    ],
  },
  '2-2': {
    location: 'Edzná · Campeche', relation: 'direct',
    description: sourced('Edzná creció en un valle fértil donde el manejo del agua fue fundamental. Sus habitantes construyeron canales y depósitos para aprovecharla. La antigua ciudad reúne edificios monumentales de distintos estilos, testigos de su papel como capital regional en el occidente de la península.', edzna),
    facts: [
      fact('Arquitectura', 'El Edificio de los Cinco Pisos es una de las construcciones emblemáticas de Edzná.', edzna),
      fact('Historia', 'Sus canales servían para conducir el agua y abastecer depósitos para consumo y riego.', edzna),
      fact('Arquitectura', 'En la ciudad se reconocen elementos de los estilos Petén, Chenes y Puuc.', edzna),
    ],
  },
  '2-3': {
    location: 'San Francisco de Campeche · Campeche', relation: 'direct',
    description: sourced('Campeche conserva un centro histórico junto al golfo de México. Sus murallas, puertas y baluartes recuerdan las defensas del antiguo puerto. Entre plazas y casonas, la arquitectura ayuda a leer una historia que también se cuenta en sus museos y espacios culturales.', campeche),
    facts: [
      fact('Historia', 'Las defensas del puerto incluyeron una muralla con ocho baluartes.', campeche),
      fact('Arquitectura', 'La Puerta de Tierra y la Puerta de Mar son dos referencias del recorrido por la ciudad amurallada.', campeche),
      fact('Historia', 'El patrimonio arquitectónico de Campeche le valió su inscripción como Patrimonio Mundial.', campeche),
    ],
  },
  '2-4': {
    location: 'Los Petenes · Campeche', relation: 'direct',
    note: 'El punto del juego representa la reserva y su entorno, no un edificio ferroviario.',
    description: sourced('Los Petenes forman un paisaje costero de manglares e islotes con vegetación de selva. Estos ambientes protegen una gran diversidad de plantas y animales. La reserva se extiende por varios municipios de Campeche y muestra la importancia de conservar juntos el agua, el bosque y la costa.', petenes),
    facts: [
      fact('Naturaleza', 'En la reserva conviven mangles rojos, negros y blancos.', petenes),
      fact('Naturaleza', 'Su franja costera abarca Campeche, Tenabo, Hecelchakán y Calkiní.', petenes),
      fact('Cultura viva', 'Cooperativas de comunidades mayas elaboran hamacas, tapetes, sombreros y otros productos en este entorno.', petenes),
    ],
  },
  '2-5': {
    location: 'Tenabo · Campeche', relation: 'direct',
    description: sourced('Tenabo invita a conocer la vida cotidiana del Camino Real campechano. La guía destaca sus talleres, celebraciones y arquitectura. En sus alrededores, la zona arqueológica de Kankí conserva otra parte de la historia del lugar, entre patios, columnas y edificios de piedra.', tenabo),
    facts: [
      fact('Cultura viva', 'En los talleres de Tenabo se elaboran hamacas, huipiles y ternos.', tenabo),
      fact('Arquitectura', 'La fachada de la Iglesia de la Asunción destaca por su espadaña, el remate donde se colocan las campanas.', tenabo),
      fact('Arquitectura', 'Kankí conserva edificios con elementos del estilo Puuc y patios comunicados en varios niveles.', tenabo),
    ],
  },
  '2-6': {
    location: 'Hecelchakán · Campeche', relation: 'direct',
    description: sourced('En Hecelchakán, el mercado, los edificios históricos y el museo acercan a los saberes de la región. La guía enlaza esta parada con Xcalumkín y con las piezas de Jaina. Son distintas maneras de conocer la historia maya a través de objetos, inscripciones y arquitectura.', hecelchakan),
    facts: [
      fact('Historia', 'El Museo de Arqueología Maya del Camino Real conserva piezas procedentes de la isla de Jaina.', hecelchakan),
      fact('Arquitectura', 'En Xcalumkín se usaron bloques de caliza tallados y ensamblados para levantar edificios de estilo Puuc.', hecelchakan),
      fact('Cultura viva', 'El mercado José del Carmen Obregón reúne frutas tropicales, semillas y textiles.', hecelchakan),
    ],
  },
  '2-7': {
    location: 'Calkiní · Campeche', relation: 'direct',
    description: sourced('Calkiní combina patrimonio construido, trabajo artesanal y paisajes de agua. La guía propone conocer su iglesia y acercarse a los tejidos de Nunkiní. Hacia El Remate, los manglares y un ojo de agua muestran otra faceta de esta región campechana.', calkini),
    facts: [
      fact('Cultura viva', 'Las artesanas de Nunkiní tejen tapetes con figuras geométricas usando fibras de henequén.', calkini),
      fact('Naturaleza', 'El ojo de agua de El Remate se comunica con el mar mediante un canal natural.', calkini),
      fact('Arquitectura', 'La iglesia de San Luis Obispo conserva un gran retablo realizado en madera de cedro.', calkini),
    ],
  },
};
