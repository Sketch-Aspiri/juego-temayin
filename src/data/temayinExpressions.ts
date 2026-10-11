import type { SpriteRef } from './intro';

/** Expresiones narrativas; recortes de los atlas en imagenes/nuevos/personajes. */
export const TEMAYIN_EXPRESSIONS = {
  alegre: { file: 'personajes/temayin-alegre.webp', sheetW: 1157, sheetH: 1359, frame: [32, 2, 1108, 1349] },
  carinoso: { file: 'personajes/temayin-carinoso.webp', sheetW: 1157, sheetH: 1359, frame: [115, 9, 881, 1342] },
  sorprendido: { file: 'personajes/temayin-sorprendido.webp', sheetW: 1157, sheetH: 1359, frame: [65, 3, 1048, 1345] },
  preocupado: { file: 'personajes/temayin-preocupado.webp', sheetW: 1157, sheetH: 1359, frame: [10, 7, 1142, 1344] },
  decidido: { file: 'personajes/temayin-decidido.webp', sheetW: 1157, sheetH: 1359, frame: [34, 10, 1078, 1335] },
  atento: { file: 'personajes/temayin-atento.webp', sheetW: 1157, sheetH: 1359, frame: [74, 0, 946, 1345] },
} as const satisfies Readonly<Record<string, SpriteRef>>;
