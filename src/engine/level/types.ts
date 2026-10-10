import type { BossId, EnemyId, ThemeId } from '../types';

/**
 * Operaciones del DSL de niveles. Todas las coordenadas x están en bloques.
 *
 *  ['pit', x0, x1]            hoyo (sin suelo) entre las columnas x0..x1
 *  ['row', x, y, 'B?BMB']     fila de bloques (un carácter por bloque, ' ' = vacío)
 *  ['plat', x, y, largo]      plataforma de piedra
 *  ['coins', x, y, cantidad]  fila de monedas
 *  ['pipe', x, alto]          tubo de 2 columnas
 *  ['stairs', x, n, dir]      escalera de n escalones (dir 1 sube, -1 baja)
 *  ['col', x, alto]           columna de piedra
 *  ['wall', x]                muro de arriba a abajo (arenas de jefe)
 *  ['flag', x] ['temple', x]  meta del nivel
 *  ['spawn', enemigo, x, y?]  enemigo (y por defecto: sobre el suelo)
 *
 * Agua y corrientes (AGENTS.md §5.1 y §5.2). No tocan la cuadrícula: `buildLevel`
 * las traduce a zonas (`BuiltLevel.water`, `BuiltLevel.currents`, ver `zones.ts`).
 *  ['water', x0, x1, superficie]            agua en las columnas x0..x1 (inclusive)
 *                                           desde la fila `superficie` hasta el fondo
 *  ['current', x0, x1, y0, y1, vx, vy]      corriente en el rectángulo de bloques
 *                                           x0..x1 × y0..y1 (inclusive); vx, vy en
 *                                           bloques/s (positivo = derecha / abajo)
 *  ['bubbles', x, y]                        respiradero de burbujas en el bloque (x, y):
 *                                           una columna de burbujas sube hasta la
 *                                           superficie y recarga el oxígeno al tocarla
 *
 * Escombro que se derrumba (Mundo 2, ver `entities/crumble.ts`). Escribe bloques
 * sólidos `D` en la cuadrícula y un tramo en `BuiltLevel.crumbles`.
 *  ['crumble', x, y, largo]                 `largo` bloques de escombro desde (x, y): al
 *                                           pisarlos tiemblan, caen y reaparecen después
 */
export type Op =
  | readonly ['pit', number, number]
  | readonly ['row', number, number, string]
  | readonly ['plat', number, number, number]
  | readonly ['coins', number, number, number]
  | readonly ['pipe', number, number]
  | readonly ['stairs', number, number, number]
  | readonly ['col', number, number]
  | readonly ['wall', number]
  | readonly ['flag', number]
  | readonly ['temple', number]
  | readonly ['spawn', EnemyId, number, number?]
  | readonly ['water', number, number, number]
  | readonly ['current', number, number, number, number, number, number]
  | readonly ['bubbles', number, number]
  | readonly ['crumble', number, number, number];

export interface BossConfig {
  id: BossId;
  /** Columna donde aparece el jefe. */
  x: number;
  /** Primera y última columna de la arena. */
  arena: readonly [number, number];
}

export interface LevelDef {
  /** Identificador único, p. ej. "1-2". */
  id: string;
  name: string;
  /** Anchura del nivel en bloques. */
  width: number;
  theme: ThemeId;
  /** Segundos disponibles (300 por defecto). */
  time?: number;
  /** Columna del punto de control (mitad del nivel por defecto). */
  checkpoint?: number;
  boss?: BossConfig;
  ops: readonly Op[];
}

export interface WorldDef {
  id: string;
  number: number;
  name: string;
  levels: readonly LevelDef[];
}
