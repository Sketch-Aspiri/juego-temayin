import { useCallback, useEffect, useRef, useState } from 'react';
import { getLevel, getWorldForLevel, isSeasonalLevel, nextLevelId } from '../../data/worlds';
import { hasTicket } from '../../store/progress';
import { cinematicAfterLevel, cinematicBeforeLevel, type CinematicDef } from '../../data/cinematics';
import { audio } from '../../engine/audio';
import { Game } from '../../engine/Game';
import type { HudState } from '../../engine/hud';
import { input } from '../../engine/input';
import { actionForKey } from '../../engine/controls';
import { VH, VW } from '../../engine/constants';
import type { LevelResult } from '../../engine/scoring';
import { useAppStore, type Run } from '../../store/appStore';
import { useAssets } from '../assetsContext';
import { BossBanner } from '../components/BossBanner';
import { Hud } from '../components/Hud';
import { GameOver, LevelComplete, PauseMenu } from '../components/Overlays';
import { TouchControls } from '../components/TouchControls';
import { PORTRAIT_VIEW_WIDTH } from '../../engine/render/viewport';
import { usePortrait } from '../usePortrait';
import { CinematicPlayer } from '../components/CinematicPlayer';
import { LoadingScreen } from './LoadingScreen';
import { artReady } from '../../engine/render/artCache';

/** Tiempo mínimo de la pantalla de carga antes de cada nivel, para que no parpadee. */
const LEVEL_LOADING_MIN_MS = 900;

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
  const [loading, setLoading] = useState(true);
  const [openingDone, setOpeningDone] = useState<Run | null>(null);
  const opening = run && openingDone !== run ? cinematicBeforeLevel(run.levelId) : undefined;
  const activeCinematic = opening ?? cinematic;
  const finishCinematic = useCallback(() => {
    if (opening && run) setOpeningDone(run);
    else setCinematic(null);
  }, [opening, run]);

  // Crea y destruye el motor cada vez que empieza una partida (nivel o reintento).
  useEffect(() => {
    const level = run && getLevel(run.levelId);
    const canvas = canvasRef.current;
    if (!run || !level || !canvas || opening) return;
    setHud(null);
    setOutcome(null);
    setCinematic(null);
    setPaused(false);
    setLoading(true);
    let cancelled = false;
    let game: Game | null = null;
    const minimumShown = new Promise<void>((resolve) => setTimeout(resolve, LEVEL_LOADING_MIN_MS));
    // El nivel arranca cuando enemigos, jefes y decorados ya están cargados.
    void Promise.all([artReady(), minimumShown]).then(() => {
      if (cancelled) return;
      setLoading(false);
      game = new Game({
        canvas,
        assets,
        audio,
        input,
        level,
        // La simulación recibe su propia copia; publicar el cacao no sustituye ni muta Run.
        session: { ...run.session },
        initialBlessings: run.initialBlessings,
        ticketCollected: hasTicket(useAppStore.getState().progress, getWorldForLevel(level.id)?.id ?? ''),
        callbacks: {
          onHud: (state) => {
            useAppStore.getState().syncCacao(run, state.coins);
            useAppStore.getState().syncTicket(run, state.ticket);
            setHud(state);
          },
          onComplete: (result) => {
            useAppStore.getState().syncCacao(run, result.session.coins);
            finishLevel(result);
            setOutcome({ kind: 'complete', result });
            setCinematic(cinematicAfterLevel(result.levelId) ?? null);
          },
          onGameOver: (score) => setOutcome({ kind: 'gameover', score }),
        },
      });

      gameRef.current = game;
      game.start();
    });
    return () => {
      cancelled = true;
      game?.stop();
      gameRef.current = null;
    };
  }, [run, assets, finishLevel, opening]);

  useEffect(() => {
    gameRef.current?.setPaused(paused || !!activeCinematic);
  }, [paused, activeCinematic]);

  const togglePause = useCallback(() => {
    if (!outcome) setPaused((p) => !p);
  }, [outcome]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (activeCinematic || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
      const settings = useAppStore.getState().settings;
      const action = actionForKey(e.code, settings.keyBindings);
      if (action === 'pause') { e.preventDefault(); togglePause(); }
      if (action === 'mute') { e.preventDefault(); updateSettings({ muted: !settings.muted }); }
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
  }, [togglePause, updateSettings, outcome, activeCinematic]);

  if (!run) return null;
  const level = getLevel(run.levelId);
  if (!level) return null;
  const nextId = nextLevelId(level.id);
  const isBonus = getWorldForLevel(level.id)?.bonus?.id === level.id;

  const goNext = (result: LevelResult): void => {
    if (!nextId) return;
    const state = useAppStore.getState();
    if (isSeasonalLevel(level.id) && !state.settings.introSeen) state.playIntro(nextId, result.session);
    else startLevel(nextId, result.session);
  };

  const status = <>
    {hud && <Hud hud={hud} />}
    <button type="button" className="pause-btn" onClick={togglePause} aria-label="Pausa">❚❚</button>
  </>;

  return (
    <>
      {loading && !opening && <div className="level-loading"><LoadingScreen /></div>}
      <div className={`game${portrait ? ' game--portrait' : ''}`} inert={!!activeCinematic} aria-hidden={!!activeCinematic}>
        {portrait && <div className="game__status">{status}</div>}
        <div className="game__field">
          <div className="stage">
            <canvas ref={canvasRef} className="stage__canvas" width={portrait ? PORTRAIT_VIEW_WIDTH : VW} height={VH} />
            {!portrait && status}
            {hud && (
              <>
                {hud.boss && <BossBanner boss={hud.boss} />}
                <div className="level-card" key={hud.spawnId} aria-hidden="true" style={hud.boss ? { visibility: 'hidden' } : undefined}>
                  <span className="level-card__world">{isSeasonalLevel(level.id) ? 'ESPECIAL DE TEMPORADA' : isBonus ? 'NIVEL SECRETO' : `MUNDO ${level.id}`}</span>
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
            isBonus={isBonus}
            isSeasonal={isSeasonalLevel(level.id)}
            onNext={() => goNext(outcome.result)}
            onRetry={retryLevel}
            onExit={() => go('levels')}
          />
        )}
        {outcome?.kind === 'gameover' && <GameOver score={outcome.score} onRetry={retryLevel} onExit={() => go('levels')} />}
        {!paused && !outcome && <TouchControls mode={touchMode} />}
      </div>
      {activeCinematic && <div className="cinematic-overlay">
        <CinematicPlayer key={`${run.attempt}-${activeCinematic.id}`} cinematic={activeCinematic} onFinish={finishCinematic}
          finishLabel={opening ? '¡Jugar Hanal Pixán!' : 'Ver resultados'} />
      </div>}
    </>
  );
}
