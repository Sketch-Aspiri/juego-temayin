/** Posiciones WGS84. La proyección conserva el norte y la escala a 20° N. */
export interface GeoPoint { readonly latitude: number; readonly longitude: number }
export interface Station extends GeoPoint {
  readonly label: string;
  readonly kind: 'station' | 'place' | 'fiction';
  readonly reference?: string;
  readonly osmWay?: number;
}

export const MAP_BOUNDS = { west: -92.65, east: -86.25, south: 16.95, north: 22.10 } as const;
export const MAP_WIDTH = 1000;
const STANDARD_PARALLEL = 20 * Math.PI / 180;
export const MAP_HEIGHT = MAP_WIDTH * (MAP_BOUNDS.north - MAP_BOUNDS.south)
  / ((MAP_BOUNDS.east - MAP_BOUNDS.west) * Math.cos(STANDARD_PARALLEL));

export function projectPosition(point: GeoPoint): { x: number; y: number } {
  return {
    x: (point.longitude - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west),
    y: (MAP_BOUNDS.north - point.latitude) / (MAP_BOUNDS.north - MAP_BOUNDS.south),
  };
}

/** Estaciones: OpenStreetMap, consulta del 19/10/2026. Referencias en MAPA.md. */
export const STATIONS: Readonly<Record<string, Station>> = {
  '1-1': { label: 'Palenque', latitude: 17.533689, longitude: -91.979598, kind: 'station', osmWay: 1236749097 },
  '1-2': { label: 'Boca del Cerro', latitude: 17.429779, longitude: -91.495749, kind: 'station', osmWay: 1237337318 },
  '1-3': { label: 'Tenosique', latitude: 17.460388, longitude: -91.430602, kind: 'station', osmWay: 1237432410 },
  '1-4': { label: 'El Triunfo', latitude: 17.923839, longitude: -91.170990, kind: 'station', osmWay: 1237431003 },
  '1-5': { label: 'Candelaria', latitude: 18.184206, longitude: -91.044891, kind: 'station', osmWay: 1374278147 },
  '1-6': { label: 'Escárcega', latitude: 18.612709, longitude: -90.731326, kind: 'station', osmWay: 1237430289 },
  '2-1': { label: 'Carrillo Puerto', latitude: 19.092718, longitude: -90.523111, kind: 'station', osmWay: 1237431333 },
  '2-2': { label: 'Edzná', latitude: 19.588780, longitude: -90.368957, kind: 'station', osmWay: 1230979803 },
  '2-3': { label: 'San Francisco de Campeche', latitude: 19.823441, longitude: -90.476440, kind: 'station', osmWay: 1231429530 },
  '2-4': { label: 'Petenes', latitude: 20.050, longitude: -90.420, kind: 'place', reference: 'Reserva de Los Petenes · referencia regional' },
  '2-5': { label: 'Tenabo', latitude: 20.039731, longitude: -90.244654, kind: 'station', osmWay: 1233347522 },
  '2-6': { label: 'Hecelchakán', latitude: 20.174966, longitude: -90.152133, kind: 'station', osmWay: 1237936389 },
  '2-7': { label: 'Calkiní', latitude: 20.377257, longitude: -90.067853, kind: 'station', osmWay: 1233358244 },
  '3-1': { label: 'Maxcanú', latitude: 20.602829, longitude: -89.974953, kind: 'station', osmWay: 1233358899 },
  '3-2': { label: 'Mérida', latitude: 20.929307, longitude: -89.514338, kind: 'station', osmWay: 1237191098, reference: 'Estación Teya-Mérida' },
  '3-3': { label: 'Tixkokob', latitude: 20.987192, longitude: -89.398475, kind: 'station', osmWay: 1237428097 },
  '3-4': { label: 'Teya', latitude: 20.934444, longitude: -89.523889, kind: 'place', reference: 'Hacienda San Ildefonso Teya' },
  '3-5': { label: 'Izamal', latitude: 20.936267, longitude: -89.085401, kind: 'station', osmWay: 1237428560 },
  '4-1': { label: 'Chichén Itzá', latitude: 20.720609, longitude: -88.548757, kind: 'station', osmWay: 1373252844, reference: 'Chichén Itzá · zona arqueológica real, acceso por su estación' },
  // La entrada al inframundo es ficticia: se ancla a Chichén Itzá, sin inventar un paradero vigente.
  '4-2': { label: 'Xibalbá', latitude: 20.6843, longitude: -88.5678, kind: 'fiction', reference: 'Escenario de fantasía en el entorno de Chichén Itzá' },
  '4-3': { label: 'Valladolid', latitude: 20.739666, longitude: -88.193438, kind: 'station', osmWay: 1231434589 },
  '4-4': { label: 'Leona Vicario', latitude: 20.979468, longitude: -87.196699, kind: 'station', osmWay: 1237429059 },
  '4-5': { label: 'Nuevo Xcán', latitude: 20.878446, longitude: -87.602644, kind: 'station', osmWay: 1237429332 },
  '5-1': { label: 'Cancún', latitude: 21.028357, longitude: -86.875033, kind: 'station', osmWay: 1231436198, reference: 'Estación Cancún Aeropuerto' },
  '5-2': { label: 'Puerto Morelos', latitude: 20.850670, longitude: -86.950263, kind: 'station', osmWay: 1268476694 },
  '5-3': { label: 'Playa del Carmen', latitude: 20.678131, longitude: -87.116180, kind: 'station', osmWay: 1268475814 },
  '5-4': { label: 'Xcaret', latitude: 20.578056, longitude: -87.119167, kind: 'place', reference: 'Xcaret · caleta de Polé' },
  '5-5': { label: 'Puerto Aventuras', latitude: 20.5067, longitude: -87.2301, kind: 'place', reference: 'Localidad de Puerto Aventuras' },
  '5-6': { label: 'Akumal', latitude: 20.4000, longitude: -87.321111, kind: 'place', reference: 'Bahía de Akumal' },
  '6-1': { label: 'Tulum', latitude: 20.245818, longitude: -87.453556, kind: 'station', osmWay: 1315341909 },
  '6-2': { label: 'Tulum Aeropuerto', latitude: 20.151417, longitude: -87.639832, kind: 'station', osmWay: 1240504327 },
  '6-3': { label: 'Felipe Carrillo Puerto', latitude: 19.593152, longitude: -88.074476, kind: 'station', osmWay: 1374275730 },
  '6-4': { label: 'Limones', latitude: 19.027558, longitude: -88.118083, kind: 'station', osmWay: 1313270101, reference: 'Estación Limones / Chacchoben' },
  '6-5': { label: 'Bacalar', latitude: 18.708663, longitude: -88.397467, kind: 'station', osmWay: 1168901165 },
  '6-6': { label: 'Chetumal', latitude: 18.508162, longitude: -88.324237, kind: 'station', osmWay: 1161550501, reference: 'Estación Chetumal Aeropuerto' },
};

/** Solo decorado futuro; no registra niveles ni altera el progreso. */
export const CALAKMUL_REGION: readonly GeoPoint[] = [
  { latitude: 18.526526, longitude: -89.396527 },
  { latitude: 18.531446, longitude: -89.903292 },
  { latitude: 18.105, longitude: -89.810 },
];
