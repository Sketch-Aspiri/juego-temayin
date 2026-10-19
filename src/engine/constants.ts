/** Tamaño de un bloque en píxeles lógicos. */
export const T = 40;
/** Filas de cada nivel. */
export const ROWS = 14;
/** Fila superior del suelo. */
export const GROUND = 12;
/** Resolución lógica del lienzo. */
export const VW = 960;
export const VH = 560;
/** Paso fijo de simulación (120 Hz). */
export const STEP = 1 / 120;

export const PLAYER_W = 36;
export const PLAYER_H = 66;
export const PLAYER_START_TILE = 3;

export const DEFAULT_LEVEL_TIME = 300;
export const START_LIVES = 3;
/** Segundos entre la muerte y el reinicio / fin de partida. */
export const DEATH_DELAY = 3;

export const TAU = Math.PI * 2;

/** Gravedad del jugador en el aire (px/s²); la usan `jumpStep` y las pruebas de alcance de saltos. */
export const PLAYER_GRAVITY = 2200;

// ---------- Nado y oxígeno (AGENTS.md §5.1) ----------
/** Gravedad dentro del agua (px/s²); la normal es PLAYER_GRAVITY. */
export const SWIM_GRAVITY = 600;
/** Velocidad máxima de hundimiento (px/s): 3 bloques/s. */
export const MAX_SINK_SPEED = 120;
/** Frenado al entrar al agua cayendo más rápido que MAX_SINK_SPEED (px/s²). */
export const SWIM_ENTRY_BRAKE = 3000;
/** Velocidad vertical de una brazada (px/s): sube ~2 bloques por brazada. */
export const SWIM_STROKE = 320;
/** Salto para salir del agua desde la superficie (px/s): supera ~3 bloques sobre la superficie. */
export const SWIM_EXIT_JUMP = 760;
/** Velocidad horizontal máxima nadando (px/s): 4,5 bloques/s. */
export const SWIM_MAX_SPEED = 180;
/** Aceleración horizontal nadando (px/s²). */
export const SWIM_ACCEL = 900;
/** Frenado horizontal del agua sin pulsar dirección (px/s²). */
export const SWIM_DRAG = 500;
/** Profundidad (px desde la parte de arriba del cuerpo) que cuenta como "cabeza". */
export const SWIM_HEAD_DEPTH = 12;
/** Duración del efecto visual de brazada (s). */
export const STROKE_FX_TIME = 0.32;
/** Segundos de oxígeno con la cabeza bajo el agua. */
export const OXYGEN_MAX = 10;
/** Oxígeno recuperado por segundo en la superficie o en burbujas. */
export const OXYGEN_REFILL_RATE = 6;
/** Segundos sumergidos en los que el snorkel congela el consumo de oxígeno. */
export const SNORKEL_TIME = 15;

/** Ancho (px) que ocupa la pirámide de meta a partir de `templeX` (340 px + margen); la cámara la encuadra completa al llegar a la bandera. */
export const GOAL_VIEW_WIDTH = 9 * T;
/** Rapidez (1/s) con la que la cámara se desliza hacia la pirámide durante la secuencia de meta. */
export const GOAL_PAN_RATE = 2.5;

// ---------- Zonas que frenan: resina de chicle y sargazo (AGENTS.md §5.5) ----------
/** Multiplicador de la velocidad horizontal máxima con los pies en resina o sargazo. */
export const SLOW_ZONE_SPEED_FACTOR = 0.5;
/** Multiplicador del impulso de salto desde la zona: ~2 bloques de altura en vez de ~4. */
export const SLOW_ZONE_JUMP_FACTOR = 0.72;
/** Columnas de sargazo que quema una bola de fuego a cada lado de la columna donde cae. */
export const SARGASSUM_BURN_RADIUS = 1;

// ---------- Viento y térmicas (Mundo 6, op `wind`) ----------
/** Velocidad horizontal máxima del viento (bloques/s): por encima, correr contra él sería imposible. */
export const WIND_MAX_VX = 3;

// ---------- Estromatolitos de Bacalar (Mundo 6, op `stromatolite`) ----------
/** Segundos de pies sobre un estromatolito antes de dañarlo: un roce o un aterrizaje de paso no cuenta. */
export const STROMATOLITE_GRACE = 0.25;
/** Puntos que cuesta dañar un tramo (nunca baja de 0 ni quita vida). */
export const STROMATOLITE_PENALTY = 500;
