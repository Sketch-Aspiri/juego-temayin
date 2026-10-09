import { useCallback, useEffect, useRef, useState } from 'react';
import { getLevel, nextLevelId } from '../../data/worlds';
import { audio } from '../../engine/audio';
import { Game } from '../../engine/Game';
import type { HudState } from '../../engine/hud';
import { input } from '../../engine/input';
import { VH, VW } from '../../engine/constants';
import type { LevelResult } from '../../engine/scoring';
import { useAppStore } from '../../store/appStore';
import { useAssets } from '../assetsContext';
import { BossBanner } from '../components/BossBanner';
import { Hud } from '../components/Hud';
import { GameOver, LevelComplete, PauseMenu } from '../components/Overlays';
import { TouchControls } from '../components/TouchControls';

type Outcome = { kind: 'complete'; result: LevelResult } | { kind: 'gameover'; score: number };

export function GameScreen() {
  const run = useAppStore((s) => s.run);
  const touchMode = useAppStore((s) => s.settings.touchControls);
  const { go, startLevel, retryLevel, finishLevel, updateSettings } = useAppStore.getState();
  const assets = useAssets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  // Crea y destruye el motor cada vez que empieza una partida (nivel o reintento).
  useEffect(() => {
    const level = run && getLevel(run.levelId);
    const canvas = canvasRef.current;
    if (!run || !level || !canvas) return;
    setHud(null);
    setOutcome(null);
    setPaused(false);
    const game = new Game({
      canvas,
      assets,
      audio,
      input,
      level,
      session: run.session,
      callbacks: {
        onHud: setHud,
        onComplete: (result) => {
          finishLevel(result);
          setOutcome({ kind: 'complete', result });
        },
        onGameOver: (score) => setOutcome({ kind: 'gameover', score }),
      },
    });
    gameRef.current = game;
    game.start();
    return () => {
      game.stop();
      gameRef.current = null;
    };
  }, [run, assets, finishLevel]);

  useEffect(() => {
    gameRef.current?.setPaused(paused);
  }, [paused]);

  const togglePause = useCallback(() => {
    if (!outcome) setPaused((p) => !p);
  }, [outcome]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      if (e.code === 'KeyM') updateSettings({ muted: !useAppStore.getState().settings.muted });
    };
    const onHidden = (): void => {
      if (document.hidden && !outcome) setPaused(true);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [togglePause, updateSettings, outcome]);

  if (!run) return null;
  const level = getLevel(run.levelId);
  if (!level) return null;
  const nextId = nextLevelId(level.id);

  const goNext = (result: LevelResult): void => {
    if (nextId) startLevel(nextId, result.session);
  };

  return (
    <div className="game">
      <div className="stage">
        <canvas ref={canvasRef} className="stage__canvas" width={VW} height={VH} />
        {hud && (
          <>
            <Hud hud={hud} />
            {hud.boss && <BossBanner boss={hud.boss} />}
            <div className="level-card" key={hud.spawnId} aria-hidden="true">
              <span className="level-card__world">MUNDO {level.id}</span>
              <span className="level-card__name">{level.name}</span>
            </div>
          </>
        )}
        <button type="button" className="pause-btn" onClick={togglePause} aria-label="Pausa">❚❚</button>
        {paused && (
          <PauseMenu
            onResume={() => setPaused(false)}
            onRestart={() => {
              setPaused(false);
              retryLevel();
            }}
            onExit={() => go('levels')}
          />
        )}
        {outcome?.kind === 'complete' && (
          <LevelComplete
            result={outcome.result}
            levelName={level.name}
            hasNext={!!nextId}
            onNext={() => goNext(outcome.result)}
            onRetry={retryLevel}
            onExit={() => go('levels')}
          />
        )}
        {outcome?.kind === 'gameover' && <GameOver score={outcome.score} onRetry={retryLevel} onExit={() => go('levels')} />}
      </div>
      {!paused && !outcome && <TouchControls mode={touchMode} />}
    </div>
  );
}
