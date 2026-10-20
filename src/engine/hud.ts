import type { BossId } from './types';

export interface BossHud {
  id: BossId;
  name: string;
  hp: number;
  maxHp: number;
  /** El jefe está en su presentación. */
  intro: boolean;
  /** Objetivo de la fase actual del jefe, si tiene varias mecánicas. */
  objective?: string;
}

/** Datos que el motor publica a la interfaz React (solo cuando cambian). */
export interface HudState {
  score: number;
  coins: number;
  lives: number;
  time: number;
  levelId: string;
  levelName: string;
  shield: boolean;
  fire: boolean;
  /** Oxígeno restante 0..1; `null` fuera del agua (barra oculta). */
  oxygen: number | null;
  /** El snorkel está congelando el consumo de oxígeno. */
  snorkel: boolean;
  /** Lleva la pelota de pok ta pok. */
  ball: boolean;
  /** Boleto del mundo encontrado, incluso después de perder una vida. */
  ticket: boolean;
  /** Instantánea completa: no se pierden recogidas entre dos publicaciones. */
  discoveries: readonly string[];
  boss: BossHud | null;
  /** Se incrementa cada vez que el jugador (re)aparece; reinicia el cartel de nivel. */
  spawnId: number;
}

/** Pasos de la barra de oxígeno: redondear evita publicar el HUD en cada fotograma. */
const OXYGEN_HUD_STEPS = 20;

export const hudKey = (h: HudState): string =>
  [
    h.score, h.coins, h.lives, h.time, h.levelId, h.shield ? 1 : 0, h.fire ? 1 : 0, h.spawnId, h.ticket ? 1 : 0,
    JSON.stringify(h.discoveries),
    h.oxygen === null ? '-' : Math.round(h.oxygen * OXYGEN_HUD_STEPS), h.snorkel ? 1 : 0, h.ball ? 1 : 0,
    h.boss ? `${h.boss.id}/${h.boss.name}/${h.boss.hp}/${h.boss.maxHp}/${h.boss.intro ? 1 : 0}/${h.boss.objective ?? ''}` : '-',
  ].join('|');
