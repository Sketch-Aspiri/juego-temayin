export interface BossHud {
  name: string;
  hp: number;
  maxHp: number;
  /** El jefe está en su presentación. */
  intro: boolean;
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
  boss: BossHud | null;
  /** Se incrementa cada vez que el jugador (re)aparece; reinicia el cartel de nivel. */
  spawnId: number;
}

/** Pasos de la barra de oxígeno: redondear evita publicar el HUD en cada fotograma. */
const OXYGEN_HUD_STEPS = 20;

export const hudKey = (h: HudState): string =>
  [
    h.score, h.coins, h.lives, h.time, h.levelId, h.shield ? 1 : 0, h.fire ? 1 : 0, h.spawnId,
    h.oxygen === null ? '-' : Math.round(h.oxygen * OXYGEN_HUD_STEPS), h.snorkel ? 1 : 0, h.ball ? 1 : 0,
    h.boss ? `${h.boss.hp}/${h.boss.maxHp}/${h.boss.intro ? 1 : 0}` : '-',
  ].join('|');
