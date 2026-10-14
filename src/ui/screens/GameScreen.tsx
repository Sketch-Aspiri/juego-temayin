import { useCallback, useEffect, useRef, useState } from 'react';
import { getLevel, nextLevelId } from '../../data/worlds';
import { cinematicAfterLevel, type CinematicDef } from '../../data/cinematics';
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
import { PORTRAIT_VIEW_WIDTH } from '../../engine/render/viewport';
import { usePortrait } from '../usePortrait';
import { CinematicPlayer } from '../components/CinematicPlayer';

type Outcome = { kind: 'complete'; result: LevelResult } | { kind: 'gameover'; score: number };

export function GameScreen() {
  const portrait = usePortrait();
  const run = useAppStore((s) => s.run);
  const touchMode = useAppStore((s) => s.settings.touchControls);
  const { go, startLevel, retryLevel, finishLevel, updateSettings } = useAppStore.getState();
  const assets = useAssets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [cinematic, setCinematic] = useState<CinematicDef | null>(null);
  const finishCinematic = useCallback(() => setCinematic(null), []);

  // Crea y destruye el motor cada vez que empieza una partida (nivel o reintento).
  useEffect(() => {
    const level = run && getLevel(run.levelId);
    const canvas = canvasRef.current;
    if (!run || !level || !canvas) return;
    setHud(null);
    setOutcome(null);
    setCinematic(null);
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
          setCinematic(cinematicAfterLevel(result.levelId) ?? null);
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
    gameRef.current?.setPaused(paused || cinematic !== null);
  }, [paused, cinematic]);

  const togglePause = useCallback(() => {
    if (!outcome) setPaused((p) => !p);
  }, [outcome]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (cinematic) return;
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
  }, [togglePause, updateSettings, outcome, cinematic]);

  if (!run) return null;
  const level = getLevel(run.levelId);
  if (!level) return null;
  const nextId = nextLevelId(level.id);

  const goNext = (result: LevelResult): void => {
    if (nextId) startLevel(nextId, result.session);
  };

  const status = <>
    {hud && <Hud hud={hud} />}
    <button type="button" className="pause-btn" onClick={togglePause} aria-label="Pausa">❚❚</button>
  </>;

  return (
    <>
      <div className={`game${portrait ? ' game--portrait' : ''}`} inert={cinematic !== null} aria-hidden={cinematic !== null}>
        {portrait && <div className="game__status">{status}</div>}
        <div className="game__field">
          <div className="stage">
            <canvas ref={canvasRef} className="stage__canvas" width={portrait ? PORTRAIT_VIEW_WIDTH : VW} height={VH} />
            {!portrait && status}
            {hud && (
              <>
                {hud.boss && <BossBanner boss={hud.boss} />}
                <div className="level-card" key={hud.spawnId} aria-hidden="true" style={hud.boss ? { visibility: 'hidden' } : undefined}>
                  <span className="level-card__world">MUNDO {level.id}</span>
                  <span className="level-card__name">{level.name}</span>
                </div>
              </>
            )}
          </div>
          {portrait && hud && !hud.boss && !outcome && level.hint &&
            <p className="game__hint" key={hud.spawnId}><strong>Toh:</strong> {level.hint}</p>}
        </div>
        {paused && (
          <PauseMenu
            onResume={() => setPaused(false)}
            onRestart={() => { setPaused(false); retryLevel(); }}
            onExit={() => go('levels')}
          />
        )}
        {outcome?.kind === 'complete' && !cinematic && (
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
        {!paused && !outcome && <TouchControls mode={touchMode} />}
      </div>
      {cinematic && <div className="cinematic-overlay">
        <CinematicPlayer key={cinematic.id} cinematic={cinematic} onFinish={finishCinematic} finishLabel="Ver resultados" />
      </div>}
    </>
  );
}
