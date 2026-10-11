export type Action = 'left' | 'right' | 'jump' | 'run' | 'fire';

export const KEYMAP: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  KeyZ: 'jump',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyX: 'run',
  KeyC: 'fire',
  KeyF: 'fire',
  KeyJ: 'fire',
};

const emptyHeld = (): Record<Action, boolean> => ({ left: false, right: false, jump: false, run: false, fire: false });

/** Estado de entrada unificado: teclado y botones táctiles escriben aquí. */
export class Input {
  held: Record<Action, boolean> = emptyHeld();
  private jumpEdge = false;
  private fireEdge = false;
  private target: Window | null = null;
  private readonly sources = new Map<Action, Set<string>>();

  press(action: Action, source = 'manual'): void {
    if (action === 'jump' && !this.held.jump) this.jumpEdge = true;
    if (action === 'fire' && !this.held.fire) this.fireEdge = true;
    this.held[action] = true;
    const sources = this.sources.get(action) ?? new Set<string>();
    sources.add(source);
    this.sources.set(action, sources);
  }

  release(action: Action, source = 'manual'): void {
    const sources = this.sources.get(action);
    sources?.delete(source);
    this.held[action] = (sources?.size ?? 0) > 0;
  }

  /** Devuelve true una sola vez por cada pulsación nueva de salto. */
  consumeJump(): boolean {
    const v = this.jumpEdge;
    this.jumpEdge = false;
    return v;
  }

  consumeFire(): boolean {
    const v = this.fireEdge;
    this.fireEdge = false;
    return v;
  }

  reset(): void {
    this.held = emptyHeld();
    this.sources.clear();
    this.jumpEdge = false;
    this.fireEdge = false;
  }

  attach(target: Window = window): void {
    this.detach();
    this.target = target;
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    if (!this.target) return;
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
    this.target = null;
    this.reset();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    if (!action) return;
    this.press(action, e.code);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = KEYMAP[e.code];
    if (action) this.release(action, e.code);
  };

  private onBlur = (): void => this.reset();
}

/** Instancia compartida por el motor y los controles táctiles de React. */
export const input = new Input();
