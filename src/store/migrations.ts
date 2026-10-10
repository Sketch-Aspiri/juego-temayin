/**
 * Migraciones del guardado (AGENTS.md §7.3). Funciones puras: nunca mutan la entrada.
 * Se aplican ANTES de `sanitizeProgress` y solo a datos leídos de la clave antigua.
 */

/** Ids de la v2 (campaña de 5 niveles) -> ids de la v3 (Tren Maya). */
export const V2_TO_V3_LEVEL_IDS: Readonly<Record<string, string>> = {
  '1-1': '1-1', // La Selva -> Palenque
  '1-3': '1-6', // Guarida de Púas -> Escárcega
  '1-2': '5-3', // La Playa -> Playa del Carmen
  '2-1': '4-3', // Cenote Escondido -> Valladolid
  '2-2': '4-2', // Ríos Subterráneos -> Xibalbá
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Renombra las claves de `raw.levels` de ids v2 a ids v3. Las claves que no
 * existían en la v2 se descartan (no pueden coincidir por azar con ids v3).
 * Si `raw` no tiene la forma esperada se devuelve tal cual: `sanitizeProgress`
 * se encarga de rechazarlo.
 */
export function migrateV2Progress(raw: unknown): unknown {
  if (!isObject(raw) || !isObject(raw.levels)) return raw;
  const levels: Record<string, unknown> = {};
  for (const [oldId, record] of Object.entries(raw.levels)) {
    const newId = Object.hasOwn(V2_TO_V3_LEVEL_IDS, oldId) ? V2_TO_V3_LEVEL_IDS[oldId] : undefined;
    if (newId) levels[newId] = record;
  }
  return { ...raw, levels };
}
