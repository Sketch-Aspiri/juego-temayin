export type Action = 'left' | 'right' | 'jump' | 'run' | 'fire';
export type ControlAction = Action | 'pause' | 'mute';
export type KeyBindings = Readonly<Record<ControlAction, string>>;

export const CONTROL_ACTIONS: readonly ControlAction[] = ['left', 'right', 'jump', 'run', 'fire', 'pause', 'mute'];
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space', run: 'ShiftLeft', fire: 'KeyF', pause: 'KeyP', mute: 'KeyM',
};
export const KEYMAP: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run', KeyC: 'fire', KeyF: 'fire', KeyJ: 'fire',
};

export function isBindableKey(code: unknown): code is string {
  return typeof code === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal|Backquote)$/.test(code);
}

/** Los atajos clásicos siguen activos mientras la acción mantenga su tecla original. */
export function keysForAction(action: ControlAction, bindings: KeyBindings): readonly string[] {
  if (bindings[action] !== DEFAULT_KEY_BINDINGS[action]) return [bindings[action]];
  return [bindings[action], ...Object.keys(KEYMAP).filter(code => KEYMAP[code] === action && code !== bindings[action])];
}

export function actionForKey(code: string, bindings: KeyBindings): ControlAction | undefined {
  if (code === 'Escape') return 'pause';
  return CONTROL_ACTIONS.find(action => keysForAction(action, bindings).includes(code));
}

export function bindingConflict(action: ControlAction, code: string, bindings: KeyBindings): ControlAction | undefined {
  return CONTROL_ACTIONS.find(other => other !== action && keysForAction(other, bindings).includes(code));
}

export function sanitizeKeyBindings(raw: unknown): KeyBindings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_KEY_BINDINGS;
  const values = raw as Record<string, unknown>;
  const bindings = { ...DEFAULT_KEY_BINDINGS };
  for (const action of CONTROL_ACTIONS) {
    if (isBindableKey(values[action])) bindings[action] = values[action];
  }
  const conflict = CONTROL_ACTIONS.some(action => keysForAction(action, bindings).some(code => bindingConflict(action, code, bindings)));
  return conflict ? DEFAULT_KEY_BINDINGS : bindings;
}
