/**
 * Ajustes del Kaimán Moreleti. Tiempos en segundos, velocidades en px/s.
 * Las ternas son [fase 1, fase 2 (crecida), fase 3 (frenesí bajo la tormenta)].
 */

export type KaimanPhase = 1 | 2 | 3;
export type ByPhase = readonly [number, number, number];

export const KAIMAN_HP = 8;
/** PV a los que empieza la fase 2 (crece el agua y flotan troncos a la deriva). */
export const PHASE2_HP = 5;
/** PV a los que empieza la fase 3 (frenesí: tormenta, emboscadas dobles, más proyectiles). */
export const PHASE3_HP = 2;
export const KAIMAN_W = 170;
export const KAIMAN_H = 62;

/** Multiplicador de velocidad por fase. */
export const PHASE_SPEED: ByPhase = [1, 1.25, 1.45];
/** Fila hasta la que sube el agua de la arena en la fase 2 (deja la cabeza del jugador fuera). */
export const PHASE2_SURFACE = 10.75;
/** Duración de la crecida (el jefe ruge y no se le puede dañar). */
export const RISE_TIME = 2.4;
/** Rugido del frenesí al empezar la fase 3. */
export const ENRAGE_TIME = 1.8;

export const GRAVITY = 2000;
export const MAX_FALL = 1000;

export const INTRO_TIME = 2.4;
export const WALK_SPEED = 80;
export const WALK_TIME: ByPhase = [1.4, 1, 0.7];

/** Fauces abiertas antes de la mordida en carrera (aviso). */
export const GAPE_TIME: ByPhase = [0.75, 0.55, 0.45];
export const BITE_SPEED = 470;
/** Tope de la carrera si no llega a chocar con un muro. */
export const BITE_MAX_TIME = 2.6;
/** Jadeo con las fauces abiertas tras chocar: ventana para el fuego. */
export const PANT_TIME: ByPhase = [1.4, 1.1, 0.9];

export const TAIL_PREP_TIME: ByPhase = [0.65, 0.5, 0.42];
export const TAIL_TIME = 0.8;
export const WAVE_SPEED: ByPhase = [320, 390, 430];
export const WAVE_W = 34;
/** Altura de la ola: se salta con un salto normal. */
export const WAVE_H = 36;
/** Distancia (px) entre la primera ola y la segunda en la fase 3 (sale después, desde el mismo punto). */
export const WAVE_GAP = 190;

export const DIVE_TIME = 0.6;
/** Bajo el agua se acerca al jugador... */
export const SUBMERGED_TIME: ByPhase = [1.5, 1.15, 0.9];
export const SUBMERGED_SPEED = 260;
/** ...y se detiene bajo él: burbujas y ondas avisan antes de emerger. */
export const WARN_TIME: ByPhase = [0.9, 0.7, 0.6];
export const EMERGE_JUMP = 820;
/** Emersiones seguidas antes de quedar expuesto (en la fase 3 vuelve a hundirse una vez). */
export const DIVE_CHAIN: ByPhase = [1, 1, 2];
/** Lomo expuesto tras emerger: momento de pisarlo. */
export const EXPOSED_TIME: ByPhase = [2.2, 1.7, 1.4];

/** Escupitajo de lodo: fauces abiertas (el fuego daña) y bolas en arco. */
export const SPIT_PREP_TIME: ByPhase = [0.8, 0.65, 0.5];
export const SPIT_TIME = 0.9;
export const SPIT_BALLS: ByPhase = [3, 4, 5];
export const MUD_GRAVITY = 1100;
export const MUD_SIZE = 24;
/** Velocidad vertical inicial de la primera bola y aumento por bola (arcos distintos). */
export const MUD_LAUNCH_UP = 420;
export const MUD_LAUNCH_STEP = 70;
/** Dispersión: cada bola cae a una fracción distinta de la distancia al jugador. */
export const MUD_SPREAD = 0.35;

/** Coletazo contra el mangle: caen propágulos (semillas en forma de dardo). */
export const SLAM_PREP_TIME: ByPhase = [0.7, 0.6, 0.5];
export const SLAM_TIME = 1;
export const PROPAGULES: ByPhase = [3, 4, 6];
/** Aviso (sombra en la superficie) antes de que caiga cada propágulo. */
export const PROPAGULE_WARN: ByPhase = [1, 0.85, 0.7];
/** Retraso extra entre propágulos sucesivos (caen en cascada). */
export const PROPAGULE_STAGGER = 0.18;
export const PROPAGULE_FALL = 900;
export const PROPAGULE_W = 14;
export const PROPAGULE_H = 44;
/** Separación mínima (px) entre propágulos para que siempre haya hueco donde esquivar. */
export const PROPAGULE_GAP = 110;
/** Tiempo clavado en el lodo antes de desaparecer (ya no hace daño). */
export const PROPAGULE_STUCK = 0.6;

/** Si lleva tantos ataques sin sumergirse, el siguiente es la emboscada (garantiza pisotón). */
export const MAX_ATTACKS_WITHOUT_DIVE = 3;
/** Distancia (bloques) por debajo de la cual el jugador se considera cerca. */
export const NEAR_TILES = 5;

export const HURT_TIME = 0.9;
export const DEAD_TIME = 2.5;

/** Bolas de fuego dentro de las fauces abiertas que equivalen a un pisotón. */
export const FIRE_HITS_PER_HP = 2;
/** Margen (px) entre los pies del jugador y el lomo para contar como pisotón. */
export const STOMP_MARGIN = 34;
export const STOMP_BOUNCE = 700;
export const STOMP_BOUNCE_HELD = 900;
export const STOMP_PUSH = 260;
export const KNOCKBACK = 320;
export const EMERGE_LAUNCH = 650;

/** Troncos a la deriva de la fase 2: [columna, largo, recorrido en bloques, periodo]. */
export const DRIFT_LOGS: readonly (readonly [number, number, number, number])[] = [
  [67, 2, 3, 5.5],
  [76, 2, -3, 6.5],
];
/** Fila de los troncos a la deriva: medio hundidos en el agua crecida. */
export const DRIFT_LOG_ROW = 10.5;

export const SCORE_STOMP = 1000;
export const SCORE_FIRE = 100;
export const SCORE_KILL = 5000;

/** Valor de una terna según la fase. */
export const byPhase = (values: ByPhase, phase: KaimanPhase): number => values[phase - 1];
