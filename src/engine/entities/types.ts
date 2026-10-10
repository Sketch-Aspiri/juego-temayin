import type { Body, EnemyId } from '../types';
import type { ItemKind } from '../tiles';

export type AnimName = 'run' | 'jump' | 'fall' | 'idle' | 'win';

export interface Player extends Body {
  /** Índice del columpio activo; null cuando está suelto. */
  swinging: number | null;
  ropeCooldown: number;
  face: 1 | -1;
  anim: AnimName;
  frame: number;
  animT: number;
  runT: number;
  coyote: number;
  jumpBuf: number;
  shield: boolean;
  fire: boolean;
  /** Segundos de invulnerabilidad restantes. */
  inv: number;
  /** Segundos restantes de la animación de aterrizaje. */
  land: number;
  /** Segundos restantes de la pose de lanzar fuego. */
  throwT: number;
  /** El centro del cuerpo está dentro de una zona de agua (física de nado). */
  swimming: boolean;
  /** Segundos de oxígeno restantes (0..OXYGEN_MAX). */
  oxygen: number;
  /** Segundos sumergidos que aún congela el snorkel (0 = sin snorkel). */
  snorkel: number;
  /** Segundos restantes del efecto visual de la última brazada. */
  strokeT: number;
  /** Lleva la pelota de pok ta pok (la tecla de disparo la lanza, ver `entities/ball.ts`). */
  ball: boolean;
}

export interface Enemy extends Body {
  id: EnemyId;
  /** Altura base de los enemigos voladores. */
  baseY: number;
  /** 0 = vivo; >0 = tiempo transcurrido desde que murió. */
  dead: number;
  flip: boolean;
  alive: boolean;
  active: boolean;
  t: number;
  /** Estado libre para comportamientos propios (p. ej. 0 = acecha, 1 = ataca). */
  state: number;
  /** Temporizador libre para comportamientos propios (segundos). */
  timer: number;
}

export interface Item extends Body {
  kind: ItemKind;
  /** Píxeles que le faltan por salir del bloque. */
  rise: number;
  still: boolean;
  gone: boolean;
}

export type ParticleKind = 'coin' | 'brick' | 'spark' | 'dust';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  rot: number;
  col: string;
  gone: boolean;
}

export interface Popup {
  x: number;
  y: number;
  t: number;
  txt: string;
}

export interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  gone: boolean;
}

export interface Quill {
  /** Aspecto del proyectil: púa (jefe Púas) o fruto (saraguato). Por defecto, púa. */
  kind?: 'quill' | 'fruit';
  x: number;
  y: number;
  vx: number;
  vy: number;
  gone: boolean;
}
