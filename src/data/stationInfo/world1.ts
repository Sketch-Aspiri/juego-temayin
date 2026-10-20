import { fact, guide, sourced, type StationInfo } from './types';

const palenque = guide('Zona arqueológica de Palenque', 22, 23);
const parque = guide('Parque Nacional de Palenque', 25);
const pomona = guide('Zona arqueológica de Pomoná', 34, 35);
const usumacinta = guide('Cañón del Usumacinta y Tenosique', 36, 37);
const reforma = guide('Zona arqueológica Moral-Reforma', 42, 43);
const wanha = guide('Reserva de la Biosfera Wanha’', 44, 45);
const candelaria = guide('El Tigre y río Candelaria', 46, 47);
const escarcega = guide('Escárcega y El Tormento', 52, 53);

export const WORLD_1_INFO: Readonly<Record<string, StationInfo>> = {
  '1-1': {
    location: 'Palenque · Chiapas', relation: 'direct',
    description: sourced('Entre la selva y los arroyos de Chiapas se conserva una antigua ciudad maya. Palenque reúne templos, palacios e inscripciones que ayudan a conocer a sus gobernantes. El parque nacional que la rodea también protege un mundo de árboles, orquídeas y animales.', guide('Palenque y su parque nacional', 22, 25)),
    facts: [
      fact('Historia', 'En 1952, Alberto Ruz L’Huillier encontró la tumba de Pakal dentro del Templo de las Inscripciones.', palenque),
      fact('Arquitectura', 'El Palacio, el Juego de Pelota y el Templo de la Cruz Foliada forman parte de esta antigua ciudad.', palenque),
      fact('Naturaleza', 'En el parque viven tucanes y monos saraguatos; su orquideario conserva distintas especies de orquídeas.', parque),
    ],
  },
  '1-2': {
    location: 'Boca del Cerro · Tabasco', relation: 'direct',
    description: sourced('El Usumacinta recorre un paisaje de paredes rocosas, selva y senderos entre Boca del Cerro y Tenosique. Desde esta parada también se conoce Pomoná, una ciudad maya cuya historia estuvo ligada a la agricultura y a los intercambios de la región.', guide('Pomoná, cañón del Usumacinta y Tenosique', 34, 37)),
    facts: [
      fact('Naturaleza', 'En el cañón del Usumacinta se pueden observar farallones cubiertos de vegetación tropical.', usumacinta),
      fact('Historia', 'Pomoná fue un importante centro agrícola durante el periodo Clásico tardío.', pomona),
      fact('Arquitectura', 'Los tableros de Pomoná conservan inscripciones sobre sus gobernantes.', pomona),
    ],
  },
  '1-3': {
    location: 'Tenosique · Tabasco', relation: 'direct',
    description: sourced('En el entorno de Tenosique, los ríos, cenotes y cuevas conviven con las expresiones culturales de sus comunidades. La guía invita a conocer sus paisajes y su carnaval. Es un destino donde mirar la naturaleza y escuchar las historias del lugar forman parte del mismo viaje.', usumacinta),
    facts: [
      fact('Cultura viva', 'La danza del Pochó forma parte del Carnaval de Tenosique.', usumacinta),
      fact('Naturaleza', 'En el ejido de Santo Tomás se encuentran las cuevas del Tigre y del Zorro y la gruta de las Golondrinas.', usumacinta),
      fact('Historia', 'El museo Kalo’ mte’ resguarda una caja de madera maya decorada con jeroglíficos.', usumacinta),
    ],
  },
  '1-4': {
    location: 'El Triunfo · Tabasco', relation: 'direct',
    description: sourced('Esta parada acerca al entorno de Moral-Reforma y a los paisajes del río San Pedro. Antiguas plazas mayas, cascadas y humedales cuentan distintas historias de Tabasco. La naturaleza y los vestigios arqueológicos ayudan a entender la relación de las comunidades con el agua.', guide('Moral-Reforma y Wanha’', 42, 45)),
    facts: [
      fact('Historia', 'Moral-Reforma funcionó como puerto y espacio de intercambio entre ciudades mayas.', reforma),
      fact('Arquitectura', 'Sus conjuntos principales se distribuyen alrededor de dos plazas abiertas.', reforma),
      fact('Naturaleza', 'La Laguna de Chaschoc es un humedal donde se observan aves residentes y migratorias.', wanha),
    ],
  },
  '1-5': {
    location: 'Candelaria · Campeche', relation: 'direct',
    description: sourced('El río Candelaria une paisajes de selva, manantiales y antiguos asentamientos. La zona arqueológica El Tigre recuerda la importancia de navegar y comerciar por estos caminos de agua. En Salto Grande, el mismo río se abre en un paisaje de cascadas y rápidos.', candelaria),
    facts: [
      fact('Historia', 'El Tigre fue un puerto fluvial que conectaba la costa campechana con el Petén.', candelaria),
      fact('Arquitectura', 'En El Tigre se conservan grandes mascarones modelados en estuco.', candelaria),
      fact('Naturaleza', 'Manantiales y cenotes alimentan el río Candelaria a lo largo de su recorrido.', candelaria),
    ],
  },
  '1-6': {
    location: 'Escárcega · Campeche', relation: 'direct',
    description: sourced('La selva que rodea Escárcega ofrece oportunidades para conocer aves, árboles y orquídeas. La guía destaca el cenote Miguel Colorado y el centro forestal El Tormento. Sus espacios de conservación permiten descubrir que el bosque también es un lugar de investigación y aprendizaje.', escarcega),
    facts: [
      fact('Naturaleza', 'El Tormento conserva especies forestales y cuenta con un orquideario.', escarcega),
      fact('Naturaleza', 'Algunas orquídeas crecen sobre otros árboles; a esas plantas se les llama epífitas.', escarcega),
      fact('Cultura viva', 'El arboretum de El Tormento se utiliza para investigar, conservar y enseñar sobre los árboles.', escarcega),
    ],
  },
};
