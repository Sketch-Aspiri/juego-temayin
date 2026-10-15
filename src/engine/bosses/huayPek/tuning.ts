/**
 * Ajustes del Huay Pek. Tiempos en segundos, velocidades en px/s.
 * Cuando hay dos valores, el primero es la fase 1 y el segundo la fase 2 (niebla).
 */

export const HUAY_PEK_HP = 6;
export const HUAY_PEK_W = 110;
export const HUAY_PEK_H = 80;

/** Multiplicador de velocidad en la fase 2. */
export const PHASE2_SPEED = 1.3;
/** Aullido de la fase 2: la niebla cubre la arena y no se le puede dañar. */
export const RISE_TIME = 2.4;

export const GRAVITY = 2000;
export const MAX_FALL = 1000;

export const INTRO_TIME = 2.4;
/** Acecho: camina despacio hacia el jugador antes de cada ataque. */
export const PROWL_SPEED = 90;
export const PROWL_TIME = [1.4, 0.9] as const;

/** Gruñido (aviso) antes de ladrar. */
export const GROWL_TIME = [0.7, 0.5] as const;
/** Pose de ladrido tras soltar la onda. */
export const BARK_TIME = 0.6;
/** Ondas de choque que suelta cada ladrido (fase 1, fase 2). */
export const BARK_WAVES = [1, 2] as const;
/** Separación (px) entre ondas consecutivas de un mismo ladrido. */
export const WAVE_GAP = 200;
export const WAVE_SPEED = [330, 410] as const;
export const WAVE_W = 30;
/** Altura de la onda: se salta con un salto normal (no con un toque corto). */
export const WAVE_H = 30;

/** Se agazapa (aviso) antes de saltar sobre el jugador. */
export const CROUCH_TIME = [0.6, 0.42] as const;
export const LEAP_JUMP = 900;

/** Se deshace en niebla... */
export const FADE_TIME = 0.7;
/** ...viaja oculto... */
export const HIDDEN_TIME = [0.9, 0.7] as const;
/** ...y reaparece detrás del jugador: ojos rojos y gruñido antes de embestir. */
export const WARN_TIME = [0.95, 0.7] as const;
/** Distancia (px) a la espalda del jugador donde reaparece. */
export const BEHIND_DIST = 230;
export const LUNGE_SPEED = 520;
/** Tope de la embestida si no choca con un muro. */
export const LUNGE_MAX_TIME = 1.2;

/** Ojos encendidos, mareado: la única ventana para pisarlo o quemarlo. */
export const VULNERABLE_TIME = [2.2, 1.6] as const;

export const HURT_TIME = 0.9;
export const DEAD_TIME = 2.5;

/** Bolas de fuego con los ojos encendidos que equivalen a un pisotón. */
export const FIRE_HITS_PER_HP = 2;
/** Margen (px) entre los pies del jugador y el lomo para contar como pisotón. */
export const STOMP_MARGIN = 34;
export const STOMP_BOUNCE = 700;
export const STOMP_BOUNCE_HELD = 900;
export const STOMP_PUSH = 260;
export const STOMP_REBOUND = 600;
export const KNOCKBACK = 320;

export const SCORE_STOMP = 1000;
export const SCORE_FIRE = 100;
export const SCORE_KILL = 5000;

/** Opacidad máxima de la niebla de la fase 2 y radio (px) del claro que deja el jugador. */
export const FOG_ALPHA = 0.78;
export const FOG_LIGHT_RADIUS = 170;
/** Radio (px) de la luz de los ojos encendidos: delatan la ventana de daño en la niebla. */
export const EYE_LIGHT_RADIUS = 80;
/** Niebla ligera de ambiente en la fase 1 (solo a ras de suelo). */
export const FOG_AMBIENT = 0.22;

/** Valor de una pareja [fase 1, fase 2]. */
export const byPhase = (pair: readonly [number, number], phase2: boolean): number => (phase2 ? pair[1] : pair[0]);
