import type { Body, EnemyId } from '../types';
import type { ItemKind } from '../tiles';

export type AnimName = 'run' | 'jump' | 'fall' | 'idle' | 'win';

export interface Player extends Body {
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
  x: number;
  y: number;
  vx: number;
  vy: number;
  gone: boolean;
}
