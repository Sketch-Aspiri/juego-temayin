/** Cuatro fases submarinas; tiempos en segundos y distancias en píxeles. */
export type SeaPhase = 1 | 2 | 3 | 4;
export type ByPhase = readonly [number, number, number, number];
export const byPhase = (v: ByPhase, phase: SeaPhase): number => v[phase - 1];
export const HP = 12;
export const WIDTH = 110;
export const HEIGHT = 100;
export const START_Y = 280;
export const HIT_SHAKE = 0.35;
export const SURFACE = 120;
export const FLOOR = 480;
export const INTRO_TIME = 2.4;
export const IDLE: ByPhase = [0.85, 0.7, 0.55, 0.4];
/** El descenso solo alcanza 120 px/s: se conserva tiempo para cambiar de profundidad. */
export const WARN: ByPhase = [1.2, 1.15, 1.1, 1.05];
export const TIDE_WARN = 1.6;
export const ATTACK_TIME: ByPhase = [1.35, 1.4, 1.55, 1.65];
export const EXPOSED: ByPhase = [5.0, 4.8, 4.6, 4.4];
export const HURT_TIME = 0.65;
export const SHED_TIME = 1.6;
export const DEAD_TIME = 2;
export const CAM_PAN = 1200;
export const FIRE_HITS = 2;
export const HIT_SCORE = 600;
export const DEFEAT_SCORE = 7000;
export const RNG_SEED = 0x5a6a;
export const MAX_WITHOUT_RESCUE = 2;
/** Salvas y lluvia: daño real, con nacimiento avisado y listas acotadas. */
export const BALL_SPEED: ByPhase = [170, 195, 220, 245];
export const BALL_COUNT: ByPhase = [3, 4, 5, 6];
export const BALL_RADIUS = 12;
export const BALL_LIFE = 6;
export const FAN_STEP = 0.24;
export const MAX_BALLS = 18;
export const NET_VOLLEY: ByPhase = [2.3, 2.0, 1.7, 1.45];
export const SEED_WARN = 0.8;
/** Cortina con hueco fijo alcanzable desde la altura anunciada. */
export const TIDE_SPEED: ByPhase = [125, 140, 155, 170];
export const TIDE_GAP: ByPhase = [180, 168, 156, 144];
export const TIDE_WIDTH = 26;
/** Embestida: fija altura y sentido al avisar; se atraviesa por encima o debajo. */
export const DASH_SPEED: ByPhase = [350, 400, 450, 500];
export const DASH_MARGIN = 25;
export const VORTEX_RADIUS = 85;
export const VORTEX_CORE = 23;
export const VORTEX_PULL: ByPhase = [180, 210, 235, 260];
export const VORTEX_LIFE = 3.2;
/** Tortugas aliadas: no tienen salud ni colisiones de daño. */
export const AIR_RADIUS = 82;
export const RESCUE_RADIUS = 76;
export const RESCUE_TIME = 0.6;
export const RESCUE_FIRE = 0.35;
export const PULSE_SPEED = 500;
export const PULSE_HIT = 35;
export const RESCUE_SCORE = 250;
export const BOOST_SPEED = 430;
export const BOOST_COOLDOWN = 2;
export const BOOST_RADIUS = 60;
export const CONTACT_PUSH = 220;
export const CONTACT_LIFT = 180;
export const WARNING_Y_MIN = 200;
export const WARNING_Y_MAX = 380;
export const RAIN_COLUMNS = 5;
export const RAIN_STAGGER = 0.12;
export const RAIN_SPEED = 150;
export const NEAR_DISTANCE = 280;

export const phaseFor = (hp: number): SeaPhase => hp <= 3 ? 4 : hp <= 6 ? 3 : hp <= 9 ? 2 : 1;
