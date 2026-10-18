import { useCallback, useEffect, useRef, useState } from 'react';
import { SPRITES, type IntroActor, type IntroEffect, type IntroScene } from '../../data/intro';
import type { CinematicDef } from '../../data/cinematics';
import { assetUrl } from '../../engine/assets';
import { SpriteFrame } from './SpriteFrame';
import { usePortrait } from '../usePortrait';

/** Letras por segundo del efecto máquina de escribir. */
const TYPE_RATE = 45;
/** Pausa (ms) con el texto completo antes de pasar sola a la siguiente escena. */
const HOLD_MS = 3800;
const BAT_COUNT = 7;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** Revela el texto letra a letra; devuelve lo visible, si terminó y cómo completarlo. */
function useTypewriter(text: string): { shown: string; done: boolean; finish: () => void } {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    setCount(prefersReducedMotion() ? text.length : 0);
  }, [text]);
  useEffect(() => {
    if (count >= text.length) return undefined;
    const id = window.setTimeout(() => setCount((c) => c + 1), 1000 / TYPE_RATE);
    return () => window.clearTimeout(id);
  }, [count, text]);
  return { shown: text.slice(0, count), done: count >= text.length, finish: () => setCount(text.length) };
}

function Actor({ actor, portrait }: { actor: IntroActor; portrait: boolean }) {
  const placement = portrait ? actor.portrait ?? actor : actor;
  return (
    <div
      className={`intro-actor intro-actor--${actor.anim}`}
      style={{ left: `${placement.x}%`, bottom: `${placement.bottom}%`, height: `${placement.height}%` }}
    >
      {actor.glow && <div className="intro-glow" />}
      <SpriteFrame sprite={actor.sprite} className={`intro-sprite${actor.flip ? ' intro-sprite--flip' : ''}`} />
    </div>
  );
}

function Effect({ effect }: { effect: IntroEffect }) {
  switch (effect) {
    case 'sunrise':
      return <div className="intro-sun" aria-hidden="true" />;
    case 'eclipse':
      return (
        <div className="intro-sun intro-sun--eclipse" aria-hidden="true">
          <div className="intro-moon" />
        </div>
      );
    case 'bats':
      return (
        <div className="intro-bats" aria-hidden="true">
          {Array.from({ length: BAT_COUNT }, (_, i) => (
            <SpriteFrame
              key={i}
              sprite={SPRITES.bat}
              className="intro-bat"
              style={{ top: `${8 + ((i * 37) % 45)}%`, animationDelay: `${i * 0.45}s`, height: `${5 + (i % 3) * 2}%` }}
            />
          ))}
        </div>
      );
    case 'train':
      return (
        <div className="intro-train" aria-hidden="true">
          <div className="intro-rails" />
          <SpriteFrame sprite={SPRITES.train} className="intro-train__cars" />
        </div>
      );
  }
}

function Scene({ scene, portrait }: { scene: IntroScene; portrait: boolean }) {
  return (
    <div className={`intro-scene intro-scene--${scene.tone}${scene.effects.includes('train') ? ' intro-scene--train' : ''}`}>
      <div className="intro-bg" style={{ backgroundImage: `url(${assetUrl(scene.background)})` }} />
      {scene.effects.map((e) => (
        <Effect key={e} effect={e} />
      ))}
      <div className="intro-cast">
        {scene.actors.map((a, i) => <Actor key={`${scene.id}-${i}`} actor={a} portrait={portrait} />)}
      </div>
      <div className="intro-tint" />
    </div>
  );
}

function usePlayback(scenes: readonly IntroScene[], onFinish: () => void) {
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  const isLast = index === scenes.length - 1;
  const { shown, done, finish } = useTypewriter(scene.text);

  const next = useCallback(() => {
    if (isLast) onFinish();
    else setIndex((i) => Math.min(i + 1, scenes.length - 1));
  }, [isLast, onFinish, scenes.length]);

  const advance = useCallback(() => {
    if (done) next();
    else finish();
  }, [done, next, finish]);

  useEffect(() => {
    if (!done || isLast) return undefined;
    const id = window.setTimeout(next, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [done, isLast, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (e.key === 'Escape') { e.preventDefault(); onFinish(); }
      else if (e.key === 'Enter' || e.key === ' ') {
        // Los botones enfocados ya responden con su clic nativo, una sola vez.
        if (e.target instanceof HTMLElement && e.target.closest('button')) return;
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onFinish]);

  return { index, scene, isLast, shown, done, advance };
}

interface CinematicPlayerProps {
  cinematic: CinematicDef;
  onFinish: () => void;
  finishLabel: string;
}

function Caption({ cinematic, playback, onFinish, finishLabel }: CinematicPlayerProps & { playback: ReturnType<typeof usePlayback> }) {
  const { index, scene, shown, done, isLast, advance } = playback;
  return (
    <div className="intro-caption" aria-live="polite">
      {scene.speaker && <span className="intro-caption__speaker">{scene.speaker}</span>}
      <p className="intro-caption__text">
        {shown}<span className="intro-caption__ghost">{scene.text.slice(shown.length)}</span>
      </p>
      <div className="intro-caption__footer">
        <span className="intro-dots" aria-label={`Escena ${index + 1} de ${cinematic.scenes.length}`}>
          {cinematic.scenes.map((s, i) => <span key={s.id} className={`intro-dot${i === index ? ' intro-dot--on' : ''}`} />)}
        </span>
        {isLast && done ? (
          <button type="button" className="btn btn--primary" onClick={e => { e.stopPropagation(); onFinish(); }} autoFocus>
            {finishLabel}
          </button>
        ) : (
          <button type="button" className="btn intro-next" onClick={e => { e.stopPropagation(); advance(); }}>
            {done ? 'Continuar →' : 'Mostrar texto'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Reproductor compartido por el prólogo, las victorias y el archivo de Historia. */
export function CinematicPlayer({ cinematic, onFinish, finishLabel }: CinematicPlayerProps) {
  const portrait = usePortrait();
  const ref = useRef<HTMLElement>(null);
  const playback = usePlayback(cinematic.scenes, onFinish);
  useEffect(() => { ref.current?.querySelector<HTMLButtonElement>('.intro-next')?.focus(); }, []);

  return (
    <main className="intro" aria-label={cinematic.title} ref={ref} onClick={playback.advance}>
      <div className={`intro-stage${cinematic.afterLevel || cinematic.beforeLevel ? ' intro-stage--chapter' : ''}`}>
        <Scene key={playback.scene.id} scene={playback.scene} portrait={portrait} />
        <Caption cinematic={cinematic} playback={playback} onFinish={onFinish} finishLabel={finishLabel} />
        <button type="button" className="btn btn--ghost intro-skip" onClick={(e) => { e.stopPropagation(); onFinish(); }}>
          Saltar ⏭
        </button>
      </div>
    </main>
  );
}
