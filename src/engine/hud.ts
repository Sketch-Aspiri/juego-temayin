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
  boss: BossHud | null;
  /** Se incrementa cada vez que el jugador (re)aparece; reinicia el cartel de nivel. */
  spawnId: number;
}

export const hudKey = (h: HudState): string =>
  [
    h.score, h.coins, h.lives, h.time, h.levelId, h.shield ? 1 : 0, h.fire ? 1 : 0, h.spawnId,
    h.boss ? `${h.boss.hp}/${h.boss.maxHp}/${h.boss.intro ? 1 : 0}` : '-',
  ].join('|');
