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
 *  ['torch', x, y]                          antorcha encendida; el viento del jefe la apaga y el fuego la reenciende
 *  ['truck', x, y, largo, dx, periodo]       vagoneta de henequén, plataforma móvil
 *                                           horizontal con período en segundos
 *
 *  ['pit', x0, x1]            hoyo (sin suelo) entre las columnas x0..x1
 *  ['row', x, y, 'B?BMB']     fila de bloques (un carácter por bloque, ' ' = vacío)
 *  ['plat', x, y, largo]      plataforma de piedra
 *  ['coins', x, y, cantidad]  fila de monedas
 *  ['pipe', x, alto]          columna tallada de 2 bloques de ancho (id histórico conservado)
 *  ['stairs', x, n, dir]      escalera de n escalones (dir 1 sube, -1 baja)
 *  ['col', x, alto]           columna de piedra
 *  ['wall', x]                muro de arriba a abajo (arenas de jefe)
 *  ['flag', x] ['temple', x]  meta del nivel
 *  ['spawn', enemigo, x, y?]  enemigo (y por defecto: sobre el suelo)
 *  ['ticket', x, y]           boleto oculto no sólido, uno por mundo; se recoge al tocarlo
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
 * Viento y térmicas (Mundo 6, ver `entities/wind.ts`). No tocan la cuadrícula: van a
 * `BuiltLevel.winds`. Solo empujan a quien NO nada; la parte vertical solo actúa en el aire
 * (una térmica con vy < 0 alarga el salto y frena la caída). |vx| ≤ WIND_MAX_VX bloques/s.
 *  ['wind', x0, x1, y0, y1, vx, vy]         rectángulo de bloques x0..x1 × y0..y1 (inclusive);
 *                                           vx, vy en bloques/s (positivo = derecha / abajo)
 *
 * Luciérnagas (Mundo 6, ver `render/fireflies.ts`): luz fija pequeña en el bloque (x, y),
 * que va a `BuiltLevel.fireflies`. Solo alumbra (y se cuenta en `lightSources`) si el nivel
 * tiene `darkness`; sin oscuridad es solo decoración.
 *  ['firefly', x, y]
 *
 * Estromatolitos (Mundo 6 · Bacalar, ver `entities/stromatolites.ts`): seres vivos milenarios,
 * no se pisan. Escribe bloques sólidos `E` y un tramo en `BuiltLevel.stromatolites`. Quien se
 * apoya en un tramo más de STROMATOLITE_GRACE s lo daña una vez (-STROMATOLITE_PENALTY puntos,
 * nunca bajo 0, sin quitar vida). Van sobre suelo o lecho, lejos de checkpoint, meta y orillas.
 *  ['stromatolite', x, y, largo]
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
 *                                           Con la boca en pantalla avisa (mecha) y dispara
 *                                           balas rectas a la altura de su fila; van a
 *                                           `BuiltLevel.cannons` (`entities/cannons.ts`).
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
 *
 * Acertijos de numerología maya (niveles secretos, ver `entities/riddles.ts` y `entities/numerals.ts`).
 *  ['riddle', x, y, id, enunciado, respuesta]  estela no sólida de pie sobre la fila y. El enunciado son
 *                                           términos separados por espacio: `13` numeral maya (punto 1,
 *                                           raya 5, concha 0; 0..19), `1/3` apilados en base 20, `#40` cifras
 *                                           arábigas, y `+ × = ?`
 *  ['stone', x, y, termino, id]             piedra de respuesta sobre la fila y: tocarla con el término
 *                                           de la respuesta abre las puertas del acertijo; una errónea se
 *                                           apaga 1,2 s sin quitar vida ni cacao
 *  ['gate', x, id]                          puerta de jade: muro de arriba abajo que se retira al
 *                                           resolver el acertijo `id`
 */
/** `discovery`: marca de observación no sólida en columna/fila, con id estable de página;
 * se registra al tocarla, sin cambiar terreno, cacao ni estrellas. */
export type Op =
  | readonly ['discovery', number, number, string]
  | readonly ['ticket', number, number]
  | readonly ['riddle', number, number, string, string, string]
  | readonly ['stone', number, number, string, string]
  | readonly ['gate', number, string]
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
  | readonly ['stromatolite', number, number, number]
  | readonly ['firefly', number, number]
  | readonly ['wind', number, number, number, number, number, number]
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
  /** Encuentro opcional antes de empezar; sus precios y diálogos viven en src/data. */
  readonly offering?: import('../blessings').OfferingConfig;
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
  /**
   * Cámara automática (bloques/s): la pantalla avanza al menos a esta velocidad, p. ej. el
   * techo del tren en marcha. Se detiene al final del nivel, con el jefe y en la meta; si el
   * borde izquierdo empuja al jugador contra un bloque sólido, muere aplastado.
   */
  autoScroll?: number;
  /** Lluvia escénica: no altera la física ni el progreso. */
  weather?: 'rain';
  ops: readonly Op[];
}

export interface WorldDef {
  id: string;
  number: number;
  name: string;
  levels: readonly LevelDef[];
  /** Nivel secreto opcional: requiere el boleto de este mundo y no altera la campaña. */
  readonly bonus?: LevelDef;
}
