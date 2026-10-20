import { fact, guide, sourced, type StationInfo } from './types';

const chichen = guide('Zona arqueológica de Chichén Itzá', 136, 137);
const chichenViejo = guide('Chichén Viejo y Museo de Sitio', 138, 139);
const valladolid = guide('Valladolid, Pueblo Mágico', 148, 149);
const nuevoXcan = guide('Nuevo Xcan y Punta Laguna', 152, 153);
const leona = guide('Estación Leona Vicario', 155);

export const WORLD_4_INFO: Readonly<Record<string, StationInfo>> = {
  '4-1': {
    location: 'Chichén Itzá · Yucatán', relation: 'direct',
    description: sourced('Chichén Itzá reúne plazas, templos, caminos y cenotes en una de las grandes ciudades del mundo maya. Sus edificios muestran cambios a lo largo del tiempo. Mirar sus relieves y recorrer sus conjuntos permite descubrir cómo la arquitectura organizaba la vida de la antigua ciudad.', chichen),
    facts: [
      fact('Arquitectura', 'Los distintos conjuntos de la ciudad estaban unidos por caminos llamados sacbés.', chichen),
      fact('Arquitectura', 'En El Castillo, un efecto de luz y sombra dibuja triángulos que parecen el cuerpo de una serpiente.', chichen),
      fact('Historia', 'El Grupo de la Serie Inicial también es conocido como Chichén Viejo.', chichenViejo),
    ],
  },
  '4-2': {
    location: 'Entorno de Chichén Itzá · Yucatán', relation: 'fiction',
    note: 'Xibalbá es un escenario de fantasía de Temayin, no una estación real ni una entrada geográfica al inframundo.',
    description: { text: 'En la aventura, este nivel imagina un viaje subterráneo de sombras y agua. Su ubicación en el mapa sirve al relato del juego. Los datos de Toh que siguen hablan del patrimonio real de Chichén Itzá y no describen una localización comprobada de Xibalbá.', source: 'game' },
    facts: [
      fact('Historia', 'El nombre de Chichén Itzá se relaciona con el Cenote Sagrado y con los itzaes.', chichen),
      fact('Arquitectura', 'El Caracol, el Gran Juego de Pelota y el Cenote Sagrado forman parte del sitio arqueológico real.', chichen),
      fact('Historia', 'El Museo de Sitio presenta objetos recuperados en exploraciones arqueológicas de Chichén Itzá.', chichenViejo),
    ],
  },
  '4-3': {
    location: 'Valladolid · Yucatán', relation: 'direct',
    description: sourced('Las plazas y los barrios de Valladolid permiten acercarse a la historia y al arte de Yucatán. La guía propone caminar entre museos, templos y tiendas de artesanías. También invita a descubrir cómo el cacao y los objetos cotidianos ayudan a contar el pasado de la región.', valladolid),
    facts: [
      fact('Cultura viva', 'La Casa de los Venados reúne una colección de arte popular mexicano con muebles, cuadros y esculturas.', valladolid),
      fact('Historia', 'El museo Choco Story explica el uso del cacao como ofrenda y moneda en el mundo prehispánico.', valladolid),
      fact('Arquitectura', 'El ex Convento de San Bernardino de Siena conserva altos muros y almenas.', valladolid),
    ],
  },
  '4-4': {
    location: 'Leona Vicario · Quintana Roo', relation: 'direct',
    description: sourced('Leona Vicario forma parte de un paisaje de selva, cenotes y proyectos comunitarios. La guía destaca la posibilidad de conocer el entorno con las comunidades mayas. El parque del poblado, los campos frutales y los espacios ecoturísticos muestran distintas facetas de la vida local.', leona),
    facts: [
      fact('Naturaleza', 'Yum Ki’n y Popol Vuh son dos de los cenotes que la guía sitúa en el entorno de Leona Vicario.', leona),
      fact('Cultura viva', 'Tres Lagunas es un proyecto ecoturístico que reúne naturaleza, cultura e historia.', leona),
      fact('Cultura viva', 'El poblado conserva un parque con kiosco y campos frutales a su alrededor.', leona),
    ],
  },
  '4-5': {
    location: 'Nuevo Xcán · Quintana Roo', relation: 'direct',
    description: sourced('Nuevo Xcán acerca a proyectos de turismo comunitario, cenotes y recorridos por la selva. La guía destaca a las familias mayas que comparten conocimientos y cuidan el entorno. En esta región, aprender de quienes la habitan es una parte central del viaje.', nuevoXcan),
    facts: [
      fact('Cultura viva', 'El proyecto Ta’akbil Ja reúne a familias mayas en actividades de turismo comunitario.', nuevoXcan),
      fact('Naturaleza', 'En Punta Laguna, la cooperativa Nahil Tucha participa en el cuidado del área natural.', nuevoXcan),
      fact('Naturaleza', 'La reserva de Otoch Ma’ax Yetel Kooh alberga monos araña y monos aulladores.', nuevoXcan),
    ],
  },
};
