import { useAppStore } from '../../store/appStore';
import { DEFAULT_TOUCH_APPEARANCE, TOUCH_OPACITY_MIN, TOUCH_SCALE_MAX, TOUCH_SCALE_MIN } from '../../store/settings';
import { TouchButtonGroups, touchStyle } from './TouchLayout';

export function TouchSettings() {
  const appearance = useAppStore(s => s.settings.touchAppearance);
  const updateSettings = useAppStore(s => s.updateSettings);
  const change = (patch: Partial<typeof appearance>): void => updateSettings({ touchAppearance: { ...appearance, ...patch } });
  return <fieldset className="field control-settings">
    <legend>Personalizar botones táctiles</legend>
    <p className="control-settings__hint">La vista previa cambia al instante. Se aplica al mando durante la partida, también al girar la pantalla.</p>
    <label className="field"><span>Tamaño de botones: {Math.round(appearance.scale * 100)} %</span>
      <input type="range" aria-label="Tamaño de botones" min={TOUCH_SCALE_MIN * 100} max={TOUCH_SCALE_MAX * 100} step={5}
        value={Math.round(appearance.scale * 100)} onChange={event => change({ scale: Number(event.target.value) / 100 })} />
    </label>
    <label className="field"><span>Opacidad de botones: {Math.round(appearance.opacity * 100)} %</span>
      <input type="range" aria-label="Opacidad de botones" min={TOUCH_OPACITY_MIN * 100} max={100} step={5}
        value={Math.round(appearance.opacity * 100)} onChange={event => change({ opacity: Number(event.target.value) / 100 })} />
    </label>
    <div className="field"><span>Distribución</span><div className="segmented" role="group" aria-label="Distribución de botones">
      <button type="button" className={`btn${appearance.layout === 'standard' ? ' btn--primary' : ''}`}
        aria-pressed={appearance.layout === 'standard'} onClick={() => change({ layout: 'standard' })}>Movimiento a la izquierda</button>
      <button type="button" className={`btn${appearance.layout === 'mirrored' ? ' btn--primary' : ''}`}
        aria-pressed={appearance.layout === 'mirrored'} onClick={() => change({ layout: 'mirrored' })}>Movimiento a la derecha</button>
    </div></div>
    <div className="touch-preview" aria-label="Vista previa de botones táctiles" role="img">
      <div className={`touch touch--custom touch--preview touch--${appearance.layout}`} style={touchStyle(appearance)} aria-hidden="true">
        <TouchButtonGroups preview />
      </div>
    </div>
    <button type="button" className="btn btn--ghost" onClick={() => updateSettings({ touchAppearance: DEFAULT_TOUCH_APPEARANCE })}>Restaurar botones táctiles</button>
  </fieldset>;
}
