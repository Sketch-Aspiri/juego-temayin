import { fact, guide, sourced, type StationInfo } from './types';

const maxcanu = guide('Maxcanú y Grutas de Calcehtok', 90, 91);
const merida = guide('Mérida, la ciudad blanca', 106, 107);
const plancha = guide('Al aire libre: La Plancha y Cuxtal', 114, 115);
const tixkokob = guide('Tixkokob', 120, 121);
const ake = guide('Los caminos del sur: Aké y Acanceh', 122, 123);
const izamal = guide('Izamal, Pueblo Mágico', 128, 129);

export const WORLD_3_INFO: Readonly<Record<string, StationInfo>> = {
  '3-1': {
    location: 'Maxcanú · Yucatán', relation: 'direct',
    description: sourced('El entorno de Maxcanú reúne campos de cultivo, patrimonio construido y caminos hacia el mundo subterráneo. Las grutas de Calcehtok guardan pasadizos y formaciones de roca. Desde esta parada, la guía también propone descubrir Oxkintok y las antiguas ciudades de la región Puuc.', maxcanu),
    facts: [
      fact('Naturaleza', 'Las grutas de Calcehtok contienen estalactitas y estalagmitas en un recorrido de túneles y bóvedas.', maxcanu),
      fact('Naturaleza', 'Al atardecer, una colonia de murciélagos sale de las grutas de Calcehtok.', maxcanu),
      fact('Historia', 'Oxkintok formó parte de antiguas rutas comerciales que enlazaban la región con otras ciudades.', maxcanu),
    ],
  },
  '3-2': {
    location: 'Mérida · Yucatán', relation: 'direct',
    note: 'El nivel se llama Mérida; su punto en el mapa corresponde a la estación Teya-Mérida.',
    description: sourced('La capital yucateca reúne plazas, museos y edificios de distintos periodos. La guía propone empezar por la Plaza Grande y recorrer sus calles para conocer la historia de la ciudad. En su patrimonio también hay espacios dedicados al arte, a la vida al aire libre y al ferrocarril.', guide('Mérida y sus espacios culturales', 106, 115)),
    facts: [
      fact('Historia', 'La ciudad de Mérida fue fundada por Francisco de Montejo en 1542.', merida),
      fact('Cultura viva', 'El Gran Ateneo Peninsular reúne espacios dedicados al patrimonio y a las actividades culturales.', merida),
      fact('Historia', 'La Plancha cuenta con un Museo de los Ferrocarriles y exhibición de unidades ferroviarias.', plancha),
    ],
  },
  '3-3': {
    location: 'Tixkokob · Yucatán', relation: 'direct',
    description: sourced('Tixkokob está ligado al trabajo artesanal y al paisaje henequenero de Yucatán. La guía destaca el tejido de hamacas y los recorridos por comunidades cercanas. En Aké, el patrimonio arqueológico y una antigua hacienda permiten descubrir historias de épocas diferentes en un mismo entorno.', guide('Tixkokob y los caminos del sur', 120, 123)),
    facts: [
      fact('Cultura viva', 'Las hamacas de Tixkokob se urden con hilo de algodón; también se hacen sillas con esta técnica.', tixkokob),
      fact('Arquitectura', 'En el centro de Tixkokob se encuentra el ex Convento y Templo de San Bernardino.', tixkokob),
      fact('Historia', 'En la hacienda San Lorenzo Aké se conserva una desfibradora de henequén descrita por la guía.', ake),
    ],
  },
  '3-4': {
    location: 'Entorno de Mérida · Yucatán', relation: 'regional',
    note: 'Teya representa una hacienda en el juego. Estos datos describen el entorno de Mérida, no la historia particular de esa hacienda.',
    description: sourced('Para acompañar este destino, miramos el paisaje natural y cultural de los alrededores de Mérida. La guía presenta Cuxtal como un espacio de conservación donde también viven comunidades mayahablantes. Selva, cenotes y labores cotidianas forman parte de esta región de Yucatán.', plancha),
    facts: [
      fact('Naturaleza', 'La reserva Cuxtal protege selva baja caducifolia, cenotes y cavernas al sur de Mérida.', plancha),
      fact('Cultura viva', 'En las comunidades de Cuxtal se habla maya y se realizan actividades artesanales, agrícolas y ganaderas.', plancha),
      fact('Naturaleza', 'Cuxtal tiene un papel importante como reservorio de agua para Mérida.', plancha),
    ],
  },
  '3-5': {
    location: 'Izamal · Yucatán', relation: 'direct',
    description: sourced('En Izamal, los edificios mayas y la arquitectura colonial comparten espacio con la vida de la ciudad. Sus fachadas amarillas y blancas acompañan el recorrido. La guía propone conocer tanto el convento como los antiguos conjuntos que aún se conservan en el centro y sus alrededores.', izamal),
    facts: [
      fact('Historia', 'A Izamal se le llama Ciudad de las Tres Culturas por la presencia de lo maya, lo colonial y lo contemporáneo.', izamal),
      fact('Arquitectura', 'El convento de San Antonio de Padua fue construido sobre un antiguo centro de peregrinación dedicado a Itzamná.', izamal),
      fact('Historia', 'Kinich Kak Moo fue un importante edificio dedicado al Sol.', izamal),
    ],
  },
};
