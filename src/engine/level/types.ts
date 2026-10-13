import type { BossId, EnemyId, ThemeId } from '../types';
import type { Darkness } from '../render/lighting';

/**
 * Operaciones del DSL de niveles. Todas las coordenadas x están en bloques.
 *  ['boat'|'turtle', x, y, largo, dx, dy, periodo] plataformas de una sola cara:
 *    barcos y tortugas protegidas; misma oscilación y unidades que `mover`.
 *    Las tortugas no son enemigos y no pueden recibir daño de ningún proyectil.
 *
 * Mundo 3: `hammock` rebota solo al caer; `rope` engancha en el aire y se suelta
 * con salto; `torch` ilumina. Todas las coordenadas y largos están en bloques.
 *  ['hammock', x, y, largo]                 hamaca trampolín horizontal
 *  ['rope', x, y, largo]                    ancla del columpio y longitud de cuerda
 *  ['torch', x, y]                          luz fija de antorcha
 *  ['truck', x, y, largo, dx, periodo]       vagoneta de henequén, plataforma móvil
 *                                           horizontal con período en segundos
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
 * Zonas que frenan (AGENTS.md §5.5). No tocan la cuadrícula: van a `BuiltLevel.slowZones`
 * (ver `slowZones.ts`). Con los pies dentro, la velocidad máxima y el salto se reducen
 * (`SLOW_ZONE_SPEED_FACTOR`, `SLOW_ZONE_JUMP_FACTOR`).
 *  ['resin', x0, x1, y]       resina de chicle en la fila `y` (el suelo, en y + 1),
 *                             columnas x0..x1 (inclusive). No arde.
 *  ['sargassum', x0, x1, y]   sargazo varado, igual que la resina; las bolas de fuego
 *                             lo queman y lo eliminan de la zona (SARGASSUM_BURN_RADIUS)
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
 *
 * Baluartes (AGENTS.md §4.3, 2-3 Campeche):
 *  ['cannon', x, y, dir]                    cañón de baluarte de 2 bloques sólidos en la
 *                                           fila y (columnas x y x+1): culata `K` y boca
 *                                           `>` (dir 1, apunta a la derecha) o `<` (dir -1).
 *                                           Es una plataforma: se pisa como cualquier bloque.
 *
 * Plataformas móviles (AGENTS.md §5.4). Tampoco tocan la cuadrícula: van a
 * `BuiltLevel.platforms` (ver `entities/platforms.ts`). Son de un solo sentido: se
 * atraviesan desde abajo y el jugador que cae encima se apoya y es arrastrado.
 *  ['train', x, y, vagones, velocidad, recorrido]
 *                                           tren de `vagones` vagones (5 bloques cada
 *                                           uno, 2 de alto) con el techo en la fila y;
 *                                           va y vuelve `recorrido` bloques (negativo =
 *                                           hacia la izquierda) a `velocidad` bloques/s,
 *                                           parando un instante en cada extremo
 *  ['mover', x, y, largo, dx, dy, periodo]  plataforma de `largo` bloques que oscila
 *                                           suavemente hasta (x+dx, y+dy) y vuelve en
 *                                           `periodo` segundos
 *
 * Franjas pegajosas sobre suelo firme (ver `level/slowZones.ts`):
 *  ['resin', x0, x1, y]                    resina de chicle, frena carrera y salto
 *  ['sargassum', x0, x1, y]                sargazo, mismos efectos; el fuego lo quema
 *                                           fila y libre, con suelo en y+1
 *
 * Juego de pelota (AGENTS.md §4.3 · 4-1 Chichén Itzá, ver `entities/hoops.ts`). No
 * toca la cuadrícula: va a `BuiltLevel.hoops`.
 *  ['hoop', x, y]                           aro de piedra empotrado en el muro de la
 *                                           cancha, en el bloque (x, y) (no sólido). Al
 *                                           pasar la pelota de pok ta pok (bloque `P`) por
 *                                           su centro se enciende una vez: +2000 puntos y
 *                                           5 granos de cacao (incluidos en `totalCoins`)
 */
export type Op =
  | readonly ['boat' | 'turtle', number, number, number, number, number, number]
  // Vagoneta: ['truck', x, y, largo, recorridoHorizontal, periodoEnSegundos].
  | readonly ['truck', number, number, number, number, number]
  // Hamacas y cuerdas: coordenadas en bloques; largo en bloques. Antorchas son luces fijas.
  | readonly ['hammock', number, number, number]
  | readonly ['rope', number, number, number]
  | readonly ['torch', number, number]
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
  | readonly ['resin', number, number, number]
  | readonly ['sargassum', number, number, number]
  | readonly ['water', number, number, number]
  | readonly ['current', number, number, number, number, number, number]
  | readonly ['bubbles', number, number]
  | readonly ['crumble', number, number, number]
  | readonly ['cannon', number, number, 1 | -1]
  | readonly ['train', number, number, number, number, number]
  | readonly ['mover', number, number, number, number, number, number]
  | readonly ['hoop', number, number];

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
  /** false oculta el agua decorativa del tema en los fosos; no altera las zonas de nado. */
  decorativeWater?: boolean;
  /** Segundos disponibles (300 por defecto). */
  time?: number;
  /** Columna del punto de control (mitad del nivel por defecto). */
  checkpoint?: number;
  boss?: BossConfig;
  /** Oscuridad visual del nivel: radio en píxeles y opacidad entre 0 y 1. */
  darkness?: Darkness;
  /** Consejo de Toh mostrado al entrar, en español. */
  hint?: string;
  /** Lluvia escénica: no altera la física ni el progreso. */
  weather?: 'rain';
  ops: readonly Op[];
}

export interface WorldDef {
  id: string;
  number: number;
  name: string;
  levels: readonly LevelDef[];
}
