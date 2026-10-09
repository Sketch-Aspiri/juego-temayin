import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { TouchMode } from '../../store/settings';

const TOUCH_OPTIONS: ReadonlyArray<{ value: TouchMode; label: string }> = [
  { value: 'auto', label: 'Automático' },
  { value: 'on', label: 'Siempre' },
  { value: 'off', label: 'Nunca' },
];

export function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const { go, updateSettings, resetProgress } = useAppStore.getState();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <main className="menu">
      <header className="menu__header">
        <button type="button" className="btn btn--ghost" onClick={() => go('title')}>← Volver</button>
        <h2>Ajustes</h2>
        <span />
      </header>
      <div className="menu__body settings">
        <label className="field">
          <span>Volumen</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) / 100 })}
          />
        </label>
        <label className="field field--row">
          <input type="checkbox" checked={settings.muted} onChange={(e) => updateSettings({ muted: e.target.checked })} />
          <span>Silenciar sonido (tecla M)</span>
        </label>
        <fieldset className="field">
          <legend>Controles táctiles</legend>
          <div className="segmented">
            {TOUCH_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={settings.touchControls === o.value ? 'btn btn--primary' : 'btn'}
                aria-pressed={settings.touchControls === o.value}
                onClick={() => updateSettings({ touchControls: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <span>Progreso guardado</span>
          {confirmReset ? (
            <div className="segmented">
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
              >
                Sí, borrar todo
              </button>
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>Cancelar</button>
            </div>
          ) : (
            <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>Borrar progreso</button>
          )}
        </div>
      </div>
    </main>
  );
}
