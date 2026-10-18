import { useEffect, useState } from 'react';
import { CONTROL_LABELS, keyLabel } from '../../data/controlLabels';
import { bindingConflict, CONTROL_ACTIONS, DEFAULT_KEY_BINDINGS, isBindableKey, type ControlAction } from '../../engine/controls';
import { useAppStore } from '../../store/appStore';

export function KeyboardSettings() {
  const bindings = useAppStore(s => s.settings.keyBindings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const [listening, setListening] = useState<ControlAction | null>(null);
  const [message, setMessage] = useState('Elige una acción y pulsa la tecla que quieras usar.');
  useEffect(() => {
    if (!listening) return;
    const capture = (event: KeyboardEvent): void => {
      if (event.code === 'Tab') { setListening(null); return; }
      event.preventDefault(); event.stopPropagation();
      if (event.code === 'Escape') { setListening(null); setMessage('Cambio cancelado.'); return; }
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || !isBindableKey(event.code)) {
        setMessage('Usa una letra, número, flecha, Espacio, Shift o signo, sin Ctrl, Alt ni la tecla del sistema.'); return;
      }
      const conflict = bindingConflict(listening, event.code, bindings);
      if (conflict) { setMessage(`${keyLabel(event.code)} ya se usa para ${CONTROL_LABELS[conflict]}. Cambia primero esa acción.`); return; }
      updateSettings({ keyBindings: { ...bindings, [listening]: event.code } });
      setMessage(`${CONTROL_LABELS[listening]}: tecla ${keyLabel(event.code)} guardada.`);
      setListening(null);
    };
    const cancel = (): void => setListening(null);
    window.addEventListener('keydown', capture, true);
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('keydown', capture, true); window.removeEventListener('blur', cancel); };
  }, [listening, bindings, updateSettings]);
  return <fieldset className="field control-settings">
    <legend>Teclado</legend>
    <p className="control-settings__hint">Elige una acción y pulsa su nueva tecla. Los atajos clásicos se conservan mientras mantengas la tecla original. Esc siempre pausa y cancela la asignación.</p>
    <div className="key-bindings">{CONTROL_ACTIONS.map(action => <div className="key-binding" key={action}>
      <span>{CONTROL_LABELS[action]}</span>
      <button type="button" className={`btn${listening === action ? ' btn--primary' : ''}`}
        aria-label={`Cambiar tecla de ${CONTROL_LABELS[action]}: ${keyLabel(bindings[action])}`} aria-pressed={listening === action}
        aria-describedby="keyboard-status" onClick={() => { setListening(action); setMessage(`Pulsa una tecla para ${CONTROL_LABELS[action]}. Esc cancela.`); }}>
        {listening === action ? 'Pulsa una tecla…' : <kbd>{keyLabel(bindings[action])}</kbd>}
      </button>
    </div>)}</div>
    <p id="keyboard-status" className="control-settings__status" role="status">{message}</p>
    <button type="button" className="btn btn--ghost" onClick={() => {
      updateSettings({ keyBindings: DEFAULT_KEY_BINDINGS }); setListening(null); setMessage('Teclas originales restauradas.');
    }}>Restaurar teclado</button>
  </fieldset>;
}
