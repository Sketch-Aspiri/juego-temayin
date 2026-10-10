import { useCallback, useEffect, useState } from 'react';
import { INTRO_SCENES, SPRITES, type IntroActor, type IntroEffect, type IntroScene } from '../../data/intro';
import { assetUrl } from '../../engine/assets';
import { useAppStore } from '../../store/appStore';
import { SpriteFrame } from '../components/SpriteFrame';

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

function Actor({ actor }: { actor: IntroActor }) {
  return (
    <div
      className={`intro-actor intro-actor--${actor.anim}`}
      style={{ left: `${actor.x}%`, bottom: `${actor.bottom}%`, height: `${actor.height}%` }}
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

function Scene({ scene }: { scene: IntroScene }) {
  return (
    <div className={`intro-scene intro-scene--${scene.tone}`}>
      <div className="intro-bg" style={{ backgroundImage: `url(${assetUrl(scene.background)})` }} />
      {scene.effects.map((e) => (
        <Effect key={e} effect={e} />
      ))}
      {scene.actors.map((a, i) => (
        <Actor key={`${scene.id}-${i}`} actor={a} />
      ))}
      <div className="intro-tint" />
    </div>
  );
}

/** Cinemática con la historia: escenas con texto, avance automático o manual, y opción de saltar. */
export function IntroScreen() {
  const finishIntro = useAppStore((s) => s.finishIntro);
  const [index, setIndex] = useState(0);
  const scene = INTRO_SCENES[index];
  const isLast = index === INTRO_SCENES.length - 1;
  const { shown, done, finish } = useTypewriter(scene.text);

  const next = useCallback(() => {
    if (isLast) finishIntro();
    else setIndex((i) => i + 1);
  }, [isLast, finishIntro]);

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
      if (e.key === 'Escape') finishIntro();
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, finishIntro]);

  return (
    <main className="intro" onClick={advance}>
      <div className="intro-stage">
        <Scene key={scene.id} scene={scene} />
        <div className="intro-caption" aria-live="polite">
          {scene.speaker && <span className="intro-caption__speaker">{scene.speaker}</span>}
          <p className="intro-caption__text">
            {shown}
            <span className="intro-caption__ghost">{scene.text.slice(shown.length)}</span>
          </p>
          <div className="intro-caption__footer">
            <span className="intro-dots" aria-label={`Escena ${index + 1} de ${INTRO_SCENES.length}`}>
              {INTRO_SCENES.map((s, i) => (
                <span key={s.id} className={`intro-dot${i === index ? ' intro-dot--on' : ''}`} />
              ))}
            </span>
            {isLast && done ? (
              <button type="button" className="btn btn--primary" onClick={(e) => { e.stopPropagation(); finishIntro(); }} autoFocus>
                ¡A la aventura!
              </button>
            ) : (
              <span className="intro-hint">{done ? 'Clic o Enter para seguir' : ''}</span>
            )}
          </div>
        </div>
        <button type="button" className="btn btn--ghost intro-skip" onClick={(e) => { e.stopPropagation(); finishIntro(); }}>
          Saltar ⏭
        </button>
      </div>
    </main>
  );
}
