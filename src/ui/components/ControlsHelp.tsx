import { CONTROL_LABELS, keyLabel } from '../../data/controlLabels';
import { CONTROL_ACTIONS, keysForAction } from '../../engine/controls';
import { useAppStore } from '../../store/appStore';

export function ControlsHelp() {
  const bindings = useAppStore(s => s.settings.keyBindings);
  return <ul className="controls-help">{CONTROL_ACTIONS.map(action => <li key={action}>
    {keysForAction(action, bindings).slice(0, 3).map(code => <kbd key={code}>{keyLabel(code)}</kbd>)}
    {action === 'pause' && <kbd>Esc</kbd>} {CONTROL_LABELS[action]}
  </li>)}</ul>;
}
