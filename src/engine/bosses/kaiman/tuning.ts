/**
 * Ajustes del Kaimán Moreleti. Tiempos en segundos, velocidades en px/s.
 * Cuando hay dos valores, el primero es la fase 1 y el segundo la fase 2 (agua alta).
 */

export const KAIMAN_HP = 6;
export const KAIMAN_W = 170;
export const KAIMAN_H = 62;

/** Multiplicador de velocidad en la fase 2. */
export const PHASE2_SPEED = 1.3;
/** Fila hasta la que sube el agua de la arena en la fase 2 (deja la cabeza del jugador fuera). */
export const PHASE2_SURFACE = 10.75;
/** Duración de la crecida (el jefe ruge y no se le puede dañar). */
export const RISE_TIME = 2.4;

export const GRAVITY = 2000;
export const MAX_FALL = 1000;

export const INTRO_TIME = 2.4;
export const WALK_SPEED = 80;
export const WALK_TIME = [1.5, 1] as const;

/** Fauces abiertas antes de la mordida en carrera (aviso). */
export const GAPE_TIME = [0.75, 0.5] as const;
export const BITE_SPEED = 470;
/** Tope de la carrera si no llega a chocar con un muro. */
export const BITE_MAX_TIME = 2.6;
/** Jadeo con las fauces abiertas tras chocar: ventana para el fuego. */
export const PANT_TIME = [1.4, 1] as const;

export const TAIL_PREP_TIME = [0.65, 0.45] as const;
export const TAIL_TIME = 0.8;
export const WAVE_SPEED = [320, 400] as const;
export const WAVE_W = 34;
/** Altura de la ola: se salta con un salto normal. */
export const WAVE_H = 36;

export const DIVE_TIME = 0.6;
/** Bajo el agua se acerca al jugador... */
export const SUBMERGED_TIME = [1.5, 1.1] as const;
export const SUBMERGED_SPEED = 260;
/** ...y se detiene bajo él: burbujas y ondas avisan antes de emerger. */
export const WARN_TIME = [0.9, 0.65] as const;
export const EMERGE_JUMP = 820;
/** Lomo expuesto tras emerger: momento de pisarlo. */
export const EXPOSED_TIME = [2.2, 1.6] as const;

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

export const SCORE_STOMP = 1000;
export const SCORE_FIRE = 100;
export const SCORE_KILL = 5000;

/** Valor de una pareja [fase 1, fase 2]. */
export const byPhase = (pair: readonly [number, number], phase2: boolean): number => (phase2 ? pair[1] : pair[0]);
