export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
}

export type EnemyId =
  | 'coati'
  | 'urchin'
  | 'bat'
  // Mundo 1 · Selva de Palenque (AGENTS.md §4.5)
  | 'howler'
  | 'tarantula'
  | 'nauyaca'
  | 'ants'
  | 'blueCrab'
  | 'barracuda'
  // Mundo 2 · Golfo de Campeche
  | 'wheel';
export type BossId = 'puas';
export type ThemeId = 'jungle' | 'beach' | 'lair' | 'cave' | 'river' | 'swamp' | 'palenque'
  | 'hacienda';

/** Estado de una partida que se arrastra de un nivel al siguiente. */
export interface Session {
  score: number;
  coins: number;
  lives: number;
}
