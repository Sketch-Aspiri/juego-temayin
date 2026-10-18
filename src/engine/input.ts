import { actionForKey, DEFAULT_KEY_BINDINGS, type Action, type KeyBindings } from './controls';
export { KEYMAP, type Action } from './controls';

const emptyHeld = (): Record<Action, boolean> => ({ left: false, right: false, jump: false, run: false, fire: false });

/** Estado de entrada unificado: teclado y botones táctiles escriben aquí. */
export class Input {
  held: Record<Action, boolean> = emptyHeld();
  private jumpEdge = false;
  private fireEdge = false;
  private target: Window | null = null;
  private bindings: KeyBindings = DEFAULT_KEY_BINDINGS;
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

  setBindings(bindings: KeyBindings): void {
    this.reset();
    this.bindings = bindings;
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
    const action = actionForKey(e.code, this.bindings);
    if (!action || action === 'pause' || action === 'mute' || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
    this.press(action, e.code);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = actionForKey(e.code, this.bindings);
    if (action && action !== 'pause' && action !== 'mute') this.release(action, e.code);
  };

  private onBlur = (): void => this.reset();
}

/** Instancia compartida por el motor y los controles táctiles de React. */
export const input = new Input();
