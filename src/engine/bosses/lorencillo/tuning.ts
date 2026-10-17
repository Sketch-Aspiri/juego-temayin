/**
 * Ajustes de Lorencillo. Tiempos en segundos, velocidades en px/s.
 * Las duplas `ByPhase` son [fase 1, fase 2]: la fase 2 empieza al bajar a `PHASE2_HP`.
 */

export type LorenPhase = 1 | 2;
export type ByPhase = readonly [number, number];
/** Valor de una dupla para la fase actual. */
export const byPhase = (values: ByPhase, phase: LorenPhase): number => values[phase - 1];

export const LORENCILLO_HP = 8;
/** A estos PV el barco empieza a inclinarse y el pirata acelera. */
export const PHASE2_HP = 4;
export const LORENCILLO_W = 70;
export const LORENCILLO_H = 90;
export const RNG_SEED = 0x1685;

export const INTRO_TIME = 2.0;
export const HURT_TIME = 0.8;
export const DEAD_TIME = 2.0;
/** Velocidad (px/s) con la que la cámara se centra en la arena. */
export const CAM_PAN = 1200;
/** Respiro entre ataques: inofensivo, solo mira al jugador. */
export const IDLE_TIME: ByPhase = [0.8, 0.5];

/** Estocada: se acerca, avisa y se lanza en línea recta. */
export const ADVANCE_SPEED: ByPhase = [140, 180];
/** Distancia (px) a la que deja de avanzar y prepara la estocada. */
export const LUNGE_RANGE = 170;
export const ADVANCE_MAX_TIME = 2.0;
export const WARN_TIME: ByPhase = [0.8, 0.65];
export const LUNGE_SPEED: ByPhase = [460, 560];
export const LUNGE_TIME = 0.55;
/** La fase 2 encadena una segunda estocada, siempre con un aviso nuevo. */
export const LUNGES: ByPhase = [1, 2];
export const RALLY_TIME = 1.4;
export const BLADE_REACH = 48;
export const BLADE_HEIGHT = 26;
/** Espalda expuesta tras la estocada fallida: única ventana de daño. */
export const EXPOSED_TIME: ByPhase = [2.2, 1.9];
/** Bolas de fuego dentro de la ventana que equivalen a un pisotón. */
export const FIRE_HITS_PER_HP = 2;

/** Cañonazos en arco: la marca de caída aparece `CANNON_WARN` antes de que salga la bala. */
export const CANNON_WARN = 0.8;
export const CANNON_SHELLS: ByPhase = [2, 3];
export const SHELL_FLIGHT = 0.9;
export const SHELL_APEX = 260;
export const SHELL_RADIUS = 34;
/** Retraso entre bala y bala de una misma salva. */
export const SHELL_GAP = 0.45;
/** Separación mínima entre dos marcas de una misma salva para que quede espacio. */
export const SHELL_SPREAD = 140;
// La última explosión termina antes del siguiente ataque; nunca invade una ventana.
export const CANNON_TIME: ByPhase = [2.6, 3.0];
export const SHELL_BURST_LIFE = 0.35;

/** Mástil: sube, lanza piratas cangrejo y baja. */
export const MAST_RISE = 0.5;
export const MAST_THROW_AT: readonly number[] = [0.9, 1.7];
export const MAST_TIME: ByPhase = [2.8, 3.0];
export const MAST_HEIGHT = 200;
/** Coincide con el mástil mayor del decorado pintado. */
export const MAIN_MAST_FRACTION = 0.35;
export const MAST_TRAVEL_SPEED = 320;
export const CRAB_THROW_SPEED = 125;
export const CRAB_THROW_LIFT = 180;
export const MAX_CRABS = 2;
export const CRAB_OFFSET_TILES = 2;

/** Selector (`choose.ts`). */
export const NEAR_TILES = 5;
export const MAX_ATTACKS_WITHOUT_WINDOW = 2;
export const NEAR_WEIGHT = { lunge: 2.2, cannon: 0.8, mast: 0.6 } as const;
export const FAR_WEIGHT = { lunge: 1.0, cannon: 1.6, mast: 1.2 } as const;

/** Inclinación de la cubierta (fase 2, `tilt.ts`). */
export const TILT_DRIFT = 90;
export const TILT_WARN = 1.0;
export const TILT_ACTIVE = 2.4;
export const TILT_REST = 1.6;

export const HURT_SHAKE = 0.3;
export const STOMP_MARGIN = 30;
export const STOMP_BOUNCE = 650;
export const STOMP_BOUNCE_HELD = 850;
export const STOMP_PUSH = 240;
export const SCORE_STOMP = 1000;
export const SCORE_FIRE = 100;
export const SCORE_KILL = 5000;
