import { create } from 'zustand';
import { INTRO_LEVEL_ID } from '../data/intro';
import { BLESSINGS } from '../data/offerings';
import { getLevel } from '../data/worlds';
import { MAX_BLESSING_QUANTITY, type BlessingId } from '../engine/blessings';
import { START_LIVES } from '../engine/constants';
import type { LevelResult } from '../engine/scoring';
import type { Session } from '../engine/types';
import { loadSaved, save } from './persistence';
import { EMPTY_PROGRESS, isUnlocked, recordCompletion, type Progress } from './progress';
import type { Settings } from './settings';
import { EMPTY_WALLET, isCacao, type Wallet } from './wallet';

export type Screen = 'loading' | 'title' | 'intro' | 'history' | 'levels' | 'offering' | 'game' | 'settings';

/** Partida en curso: nivel + estado arrastrado. `attempt` fuerza a reiniciar el motor. */
export interface Run {
  levelId: string;
  session: Session;
  attempt: number;
  initialBlessings?: readonly BlessingId[];
}

interface AppState {
  screen: Screen;
  progress: Progress;
  settings: Settings;
  run: Run | null;
  wallet: Wallet;
  buyBlessing: (blessing: BlessingId, quantity?: number) => boolean;
  continueOffering: () => void;
  /** Solo se aceptan publicaciones del motor de la partida vigente. */
  syncCacao: (run: Run, cacao: number) => void;
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

const newSession = (coins: number): Session => ({ score: 0, coins, lives: START_LIVES });

const saved = loadSaved();

export const useAppStore = create<AppState>((set, get) => {
  const persist = (): void => {
    const { progress, settings, wallet } = get();
    save({ progress, settings, wallet });
  };

  return {
    screen: 'loading',
    progress: saved.progress,
    settings: saved.settings,
    run: null,
    wallet: saved.wallet,
    introNext: null,

    go: (screen) => set({ screen }),

    startLevel: (levelId, carry) => {
      if (!getLevel(levelId) || !isUnlocked(get().progress, levelId)) return;
      // La primera partida de la campaña empieza con la historia.
      if (levelId === INTRO_LEVEL_ID && !carry && !get().settings.introSeen) return get().playIntro(levelId);
      const coins = get().wallet.cacao;
      const session = carry ? { ...carry, coins } : newSession(coins);
      set({ screen: getLevel(levelId)?.offering ? 'offering' : 'game', run: { levelId, session, attempt: 0 } });
    },

    buyBlessing: (blessing, quantity = 1) => {
      const { run, screen, wallet } = get();
      const offers = run && getLevel(run.levelId)?.offering?.offers;
      if (!run || screen !== 'offering' || !offers?.includes(blessing)) return false;
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_BLESSING_QUANTITY) return false;
      const purchased = wallet.pending[run.levelId] ?? [];
      const { price, repeatable } = BLESSINGS[blessing];
      if ((!repeatable && (purchased.includes(blessing) || quantity !== 1)) || wallet.cacao < price * quantity) return false;
      const additions = Array.from({ length: quantity }, () => blessing);
      set({ wallet: { cacao: wallet.cacao - price * quantity,
        pending: { ...wallet.pending, [run.levelId]: [...purchased, ...additions] } } });
      persist();
      return true;
    },

    continueOffering: () => {
      const { run, screen, wallet } = get();
      if (!run || screen !== 'offering') return;
      const initialBlessings = wallet.pending[run.levelId] ?? [];
      const pending = { ...wallet.pending };
      delete pending[run.levelId];
      set({ screen: 'game', wallet: { ...wallet, pending },
        run: { ...run, session: { ...run.session, coins: wallet.cacao }, initialBlessings } });
      persist();
    },

    syncCacao: (run, cacao) => {
      if (get().run !== run || !isCacao(cacao) || get().wallet.cacao === cacao) return;
      set({ wallet: { ...get().wallet, cacao } });
      persist();
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
      set({ screen: getLevel(run.levelId)?.offering ? 'offering' : 'game',
        run: { levelId: run.levelId, session: newSession(get().wallet.cacao), attempt: run.attempt + 1 } });
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
      set({ progress: EMPTY_PROGRESS, wallet: EMPTY_WALLET, run: null });
      persist();
    },
  };
});
