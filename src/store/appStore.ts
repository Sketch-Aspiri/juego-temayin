import { create } from 'zustand';
import { INTRO_LEVEL_ID } from '../data/intro';
import { getLevel } from '../data/worlds';
import { START_LIVES } from '../engine/constants';
import type { LevelResult } from '../engine/scoring';
import type { Session } from '../engine/types';
import { loadSaved, save } from './persistence';
import { EMPTY_PROGRESS, isUnlocked, recordCompletion, type Progress } from './progress';
import type { Settings } from './settings';

export type Screen = 'loading' | 'title' | 'intro' | 'levels' | 'game' | 'settings';

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
  /** Nivel que empieza al terminar la cinemática (`null`: volver al título). */
  introNext: string | null;
  go: (screen: Screen) => void;
  /** Empieza un nivel; `carry` arrastra puntos/vidas del nivel anterior. */
  startLevel: (levelId: string, carry?: Session) => void;
  /** Reproduce la cinemática; al terminar va a `next` o al título. */
  playIntro: (next: string | null) => void;
  /** Marca la cinemática como vista y continúa. */
  finishIntro: () => void;
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
    introNext: null,

    go: (screen) => set({ screen }),

    startLevel: (levelId, carry) => {
      if (!getLevel(levelId) || !isUnlocked(get().progress, levelId)) return;
      // La primera partida de la campaña empieza con la historia.
      if (levelId === INTRO_LEVEL_ID && !carry && !get().settings.introSeen) return get().playIntro(levelId);
      set({ screen: 'game', run: { levelId, session: carry ? { ...carry } : newSession(), attempt: 0 } });
    },

    playIntro: (next) => set({ screen: 'intro', introNext: next }),

    finishIntro: () => {
      const next = get().introNext;
      set({ settings: { ...get().settings, introSeen: true }, introNext: null });
      persist();
      if (next) get().startLevel(next);
      else set({ screen: 'title' });
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
