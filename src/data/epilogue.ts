import { STATIONS, type GeoPoint } from './stations';

/** Regreso narrativo por el ramal de Calakmul hacia Centenario y Escárcega. */
export const EPILOGUE_RETURN: readonly (GeoPoint & { readonly label: string })[] = [
  STATIONS['7-4'], STATIONS['7-3'],
  { latitude: 18.655836, longitude: -90.285856, label: 'Centenario' },
  STATIONS['1-6'],
];
