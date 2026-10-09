import { create } from 'zustand';
import { getLevel } from '../data/worlds';
import { START_LIVES } from '../engine/constants';
import type { LevelResult } from '../engine/scoring';
import type { Session } from '../engine/types';
import { loadSaved, save } from './persistence';
import { EMPTY_PROGRESS, isUnlocked, recordCompletion, type Progress } from './progress';
import type { Settings } from './settings';

export type Screen = 'loading' | 'title' | 'levels' | 'game' | 'settings';

/** Partida en curso: nivel + estado arrastrado. `attempt` fuerza a reiniciar el motor. */
export interface Run {
  levelId: string;
  session: Session;
  attempt: number;
}

interface AppState {
  screen: Screen;
  progress: Progress;
  settings: Settings;
  run: Run | null;
  go: (screen: Screen) => void;
  /** Empieza un nivel; `carry` arrastra puntos/vidas del nivel anterior. */
  startLevel: (levelId: string, carry?: Session) => void;
  retryLevel: () => void;
  finishLevel: (result: LevelResult) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

const newSession = (): Session => ({ score: 0, coins: 0, lives: START_LIVES });

const saved = loadSaved();

export const useAppStore = create<AppState>((set, get) => {
  const persist = (): void => {
    const { progress, settings } = get();
    save({ progress, settings });
  };

  return {
    screen: 'loading',
    progress: saved.progress,
    settings: saved.settings,
    run: null,

    go: (screen) => set({ screen }),

    startLevel: (levelId, carry) => {
      if (!getLevel(levelId) || !isUnlocked(get().progress, levelId)) return;
      set({ screen: 'game', run: { levelId, session: carry ? { ...carry } : newSession(), attempt: 0 } });
    },

    retryLevel: () => {
      const run = get().run;
      if (!run) return;
      set({ run: { levelId: run.levelId, session: newSession(), attempt: run.attempt + 1 } });
    },

    finishLevel: (result) => {
      set({ progress: recordCompletion(get().progress, result) });
      persist();
    },

    updateSettings: (patch) => {
      set({ settings: { ...get().settings, ...patch } });
      persist();
    },

    resetProgress: () => {
      set({ progress: EMPTY_PROGRESS });
      persist();
    },
  };
});
