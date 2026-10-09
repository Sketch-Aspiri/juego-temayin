import { useEffect, useState, type PointerEvent } from 'react';
import { input, type Action } from '../../engine/input';
import type { TouchMode } from '../../store/settings';

interface PadButtonProps {
  action: Action;
  label: string;
  className: string;
  text: string;
}

function PadButton({ action, label, className, text }: PadButtonProps) {
  const down = (e: PointerEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    input.press(action);
  };
  const up = (e: PointerEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    input.release(action);
  };
  return (
    <button
      type="button"
      className={`pad ${className}`}
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      {text}
    </button>
  );
}

function useTouchVisible(mode: TouchMode): boolean {
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = (): void => setCoarse(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mode === 'on' || (mode === 'auto' && coarse);
}

interface TouchControlsProps {
  mode: TouchMode;
}

export function TouchControls({ mode }: TouchControlsProps) {
  const visible = useTouchVisible(mode);
  if (!visible) return null;
  return (
    <div className="touch" aria-label="Controles táctiles">
      <PadButton action="left" label="Izquierda" className="pad--left" text="◀" />
      <PadButton action="right" label="Derecha" className="pad--right" text="▶" />
      <PadButton action="run" label="Correr" className="pad--run" text="CORRER" />
      <PadButton action="fire" label="Fuego" className="pad--fire" text="FUEGO" />
      <PadButton action="jump" label="Saltar" className="pad--jump" text="▲" />
    </div>
  );
}
