import type { Action, Input } from '../../engine/input';

/** Cada dedo conserva su acción; soltar uno no cancela los demás. */
export class TouchInput {
  private readonly pointers = new Map<number, Action | null>();
  private running = false;

  constructor(private readonly input: Input) {}

  get actions(): readonly Action[] {
    const held = [...this.pointers.values()].filter((action): action is Action => action !== null);
    return [...new Set([...held, ...(this.running ? ['run' as const] : [])])];
  }

  has(pointer: number): boolean { return this.pointers.has(pointer); }

  start(pointer: number, action: Action): void {
    if (action === 'run') this.toggleRun();
    else this.move(pointer, action);
  }

  move(pointer: number, action: Action | null): void {
    const previous = this.pointers.get(pointer);
    if (previous === action) return;
    if (previous) this.input.release(previous, `touch:${pointer}`);
    // Conservamos el dedo fuera del botón para que pueda volver sin levantarlo.
    if (action && action !== 'run') {
      this.pointers.set(pointer, action);
      this.input.press(action, `touch:${pointer}`);
    } else this.pointers.set(pointer, null);
  }

  end(pointer: number): void {
    const action = this.pointers.get(pointer);
    if (action) this.input.release(action, `touch:${pointer}`);
    this.pointers.delete(pointer);
  }

  toggleRun(): void {
    this.running = !this.running;
    if (this.running) this.input.press('run', 'touch:run');
    else this.input.release('run', 'touch:run');
  }

  reset(): void {
    for (const pointer of this.pointers.keys()) this.end(pointer);
    this.running = false;
    this.input.release('run', 'touch:run');
  }
}
