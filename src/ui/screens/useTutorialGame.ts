import { useEffect, useRef, useState } from 'react';
import { TUTORIAL_LEVEL } from '../../data/tutorial';
import { audio } from '../../engine/audio';
import { Game } from '../../engine/Game';
import { START_LIVES } from '../../engine/constants';
import type { HudState } from '../../engine/hud';
import { input } from '../../engine/input';
import { actionForKey } from '../../engine/controls';
import { artReady } from '../../engine/render/artCache';
import { useAppStore } from '../../store/appStore';
import { useAssets } from '../assetsContext';

/** Sesión local: ningún callback escribe resultados, cacao ni descubrimientos al store. */
export function useTutorialGame(attempt: number, playing: boolean) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const assets = useAssets();
  const [hud, setHud] = useState<HudState | null>(null);
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    if (!playing || !canvas.current) return;
    const target = canvas.current;
    let cancelled = false;
    setHud(null); setComplete(false); setFailed(false); setPaused(false); setReady(false);
    pauseRef.current = false;
    void artReady().then(() => {
      if (cancelled) return;
      const instance = new Game({ canvas: target, assets, audio, input, level: TUTORIAL_LEVEL,
        session: { score: 0, coins: 0, lives: START_LIVES }, callbacks: {
          onHud: state => { if (!cancelled) setHud(state); },
          onComplete: () => setComplete(true), onGameOver: () => setFailed(true),
        } });
      game.current = instance;
      instance.start(); instance.setPaused(pauseRef.current);
      setReady(true);
      target.focus({ preventScroll: true });
    });
    return () => { cancelled = true; game.current?.stop(); game.current = null; };
  }, [playing, attempt, assets]);

  useEffect(() => {
    pauseRef.current = paused;
    game.current?.setPaused(paused);
  }, [paused]);
  useTutorialShortcuts(playing && !complete && !failed, setPaused);
  return { canvas, hud, complete, failed, paused, setPaused, ready };
}

function useTutorialShortcuts(enabled: boolean, setPaused: (next: boolean | ((previous: boolean) => boolean)) => void) {
  useEffect(() => {
    if (!enabled) return;
    const key = (event: KeyboardEvent): void => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
      const state = useAppStore.getState();
      const action = actionForKey(event.code, state.settings.keyBindings);
      if (action === 'pause') { event.preventDefault(); setPaused(value => !value); }
      if (action === 'mute') { event.preventDefault(); state.updateSettings({ muted: !state.settings.muted }); }
    };
    const hidden = (): void => { if (document.hidden) setPaused(true); };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', hidden); };
  }, [enabled, setPaused]);
}
