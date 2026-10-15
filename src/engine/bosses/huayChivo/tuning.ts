import type { Darkness } from '../../render/lighting';

/**
 * Ajustes del Huay Chivo. Tiempos en segundos, velocidades en px/s.
 * Las ternas `ByPhase` son [fase 1, fase 2, fase 3]: atardecer, anochecer y noche cerrada.
 */

export type ChivoPhase = 1 | 2 | 3;
export type ByPhase = readonly [number, number, number];
/** Valor de una terna para la fase actual. */
export const byPhase = (values: ByPhase, phase: ChivoPhase): number => values[phase - 1];

export const HUAY_CHIVO_HP = 8;
/** Al bajar a estos PV cae la noche (fase 2) y luego la noche cerrada (fase 3). */
export const PHASE2_HP = 5;
export const PHASE3_HP = 2;
export const HUAY_CHIVO_W = 78;
/** Dos bloques de colisión: pasa bajo los refugios de fila 9 sin atravesar sus sólidos. */
export const HUAY_CHIVO_H = 80;

/** Multiplicador de la velocidad de embestida en cada fase. */
export const PHASE_SPEED: ByPhase = [1, 1.2, 1.35];
/** Respiro entre ataques: inofensivo, solo mira al jugador. */
export const IDLE_TIME: ByPhase = [1.0, 0.75, 0.55];
export const INTRO_TIME = 2.0;
export const HURT_TIME = 0.8;
/** Rugido mientras oscurece: no se le puede golpear ni hace daño. */
export const NIGHTFALL_TIME = 2.2;
export const DEAD_TIME = 2.0;
export const GRAVITY = 2000;
export const MAX_FALL = 1000;
/** Velocidad (px/s) con la que la cámara se centra en la arena. */
export const CAM_PAN = 1200;

/** Bolas de fuego dentro de la ventana de aturdimiento que equivalen a un pisotón. */
export const FIRE_HITS_PER_HP = 2;

/**
 * Centros de los tres arcos del atrio como fracción del ancho de la arena. Los usa
 * también `render/bossArena.ts` para que el decorado coincida con los teletransportes.
 */
export const ARCH_FRACTIONS = [0.25, 0.5, 0.75] as const;
/** Distancia mínima (px) entre el arco de destino y el jugador: nunca aparece encima. */
export const BLINK_MIN_DIST = 160;
/** Teletransporte: se desvanece, avisa en el arco de destino (humo y ojos) y aparece. */
export const FADE_TIME = 0.4;
export const BLINK_WARN: ByPhase = [0.9, 0.75, 0.65];
export const APPEAR_TIME = 0.15;

/** Raspa el suelo con la pezuña (aviso) antes de embestir. */
export const PAW_TIME: ByPhase = [0.85, 0.7, 0.6];
export const CHARGE_SPEED = 360;
/** Aturdido tras chocar con un borde: la única ventana para pisarlo o quemarlo. */
export const DAZED_TIME: ByPhase = [2.0, 1.9, 1.8];
export const DAZE_SHAKE = 0.3;
/** Probabilidad de dar media vuelta y embestir de nuevo tras el primer choque. */
export const DOUBLE_CHARGE_CHANCE: ByPhase = [0, 0.5, 1];
export const TURN_TIME = 0.6;

/** Pisotón (solo fases 2 y 3; el valor de la fase 1 no se usa). */
export const CROUCH_TIME: ByPhase = [0.7, 0.7, 0.6];
/** Alcance horizontal máximo (px) del salto hacia el jugador. */
export const LEAP_MAX_DX = 400;
/** Impulso del salto: su techo queda por debajo de la fila 5 (no toca el bloque de chile). */
export const LEAP_JUMP = 770;
export const STOMP_SHAKE = 0.35;
/** Parejas de ondas (una a cada lado) que suelta al aterrizar. */
export const STOMP_WAVE_PAIRS: ByPhase = [0, 1, 2];
export const WAVE_SPEED: ByPhase = [340, 340, 380];
export const WAVE_W = 30;
/** Altura de la onda: se salta con un salto normal. */
export const WAVE_H = 28;
/** Separación (px) entre ondas consecutivas del mismo lado: la segunda sale con retraso. */
export const WAVE_GAP = 330;
export const LAND_TIME = 0.6;

/** Invoca fuegos fatuos (aviso con brillo verde). */
export const CALL_TIME = 0.7;
export const WISP_COUNT: ByPhase = [2, 3, 3];
export const MAX_WISPS = 4;
/** Al nacer son inofensivos durante este tiempo. */
export const WISP_SPAWN_TIME = 0.5;
export const ORBIT_TIME: ByPhase = [1.6, 1.3, 1.1];
export const ORBIT_RADIUS = 80;
/** Velocidad angular (rad/s) de la órbita. */
export const ORBIT_SPEED = 2.4;
export const WISP_SPEED: ByPhase = [80, 95, 110];
/** Giro limitado (px/s²) de la persecución: se pueden esquivar cambiando de dirección. */
export const WISP_STEER = 140;
export const WISP_LIFE = 6.5;
/** Últimos segundos de vida: se desvanecen y ya no dañan. */
export const WISP_FADE = 0.6;
export const WISP_SIZE = 24;

/** Selector de ataques (`choose.ts`). */
export const NEAR_TILES = 5;
/** Tras estos ataques sin embestida ni teletransporte, fuerza uno de los dos (ventana garantizada). */
export const MAX_ATTACKS_WITHOUT_CHARGE = 2;
/** Semilla del azar del jefe: misma pelea para la misma partida de entradas. */
export const RNG_SEED = 0x1a3a;

/** Oscuridad de cada fase: la fase 1 conserva la luz del atardecer. */
export const NIGHT_DARKNESS: readonly [Darkness | null, Darkness, Darkness] = [
  null, { radius: 240, alpha: 0.5 }, { radius: 175, alpha: 0.8 },
];
/** Escalones de la rampa de oscuridad mientras cae la noche. */
export const DUSK_STEPS = 6;
export const NIGHTFALL_SHAKE = 0.5;

/** Radios (px) de las luces del jefe en la oscuridad. */
export const EYE_LIGHT_RADIUS = 60;
export const DAZED_LIGHT_RADIUS = 90;
export const WISP_LIGHT_RADIUS = 70;

export const HURT_SHAKE = 0.3;
/** Margen (px) entre los pies del jugador y el lomo para contar como pisotón. */
export const STOMP_MARGIN = 30;
export const STOMP_BOUNCE = 650;
export const STOMP_BOUNCE_HELD = 850;
export const STOMP_PUSH = 240;

export const SCORE_STOMP = 1000;
export const SCORE_FIRE = 100;
export const SCORE_KILL = 5000;
export const SCORE_WISP = 100;

/** Cornada corta: orientación fijada al avisar; saltar atrás o por encima la evita. */
export const HORN_WARN = 0.6;
export const HORN_TIME = 0.28;
export const HORN_RECOVER = 0.65;
export const HORN_REACH = 80;
export const HORN_HEIGHT = 76;
/** Polvo y pequeños restos sueltos: decorativos, nunca dañan ni alteran los arcos. */
export const STUCCO_COUNT = 5;
export const STUCCO_LIFE = 0.8;
export const STUCCO_FALL = 550;
export const STUCCO_SPREAD = 18;
export const STUCCO_Y = 220;
/** Pesos de ataques: cerca prioriza cuernos; lejos, magia y teletransporte. */
export const NEAR_WEIGHT = { charge: 1.5, blink: 0.9, stomp: 1.2, wisps: 0.5, horns: 2.2 } as const;
export const FAR_WEIGHT = { charge: 0.9, blink: 1.4, stomp: 1.0, wisps: 1.3, horns: 0 } as const;
