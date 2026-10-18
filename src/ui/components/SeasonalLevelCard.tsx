import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import { assetUrl } from '../../engine/assets';
import { useAppStore } from '../../store/appStore';
import { Stars } from './Stars';
import '../seasonal.css';

/** Destino opcional anterior a Palenque para partidas nuevas y antiguas. */
export function SeasonalLevelCard() {
  const startLevel = useAppStore(s => s.startLevel);
  const record = useAppStore(s => s.progress.levels[HANAL_PIXAN_LEVEL.id]);
  return <section className="seasonal" aria-labelledby="seasonal-title">
    <img className="seasonal__backdrop" src={assetUrl('portada/palenque-hanal-pixan.webp')} alt="" />
    <div className="seasonal__copy">
      <p className="seasonal__eyebrow">Nivel especial de temporada</p>
      <h3 id="seasonal-title">Hanal Pixán</h3>
      <p>Un camino de luz y memoria, con cinemática y personajes alebrije. Una aventura extra antes de Palenque.</p>
      <button type="button" className="btn btn--primary" onClick={() => startLevel(HANAL_PIXAN_LEVEL.id)}>Jugar Hanal Pixán <span aria-hidden="true">→</span></button>
      {record && <div className="seasonal__record"><Stars value={record.stars} /><span>Mejor: {record.bestScore}</span></div>}
    </div>
    <img className="seasonal__jaguar" src={assetUrl('portada/temayin-alebrije.webp')} alt="Temayin con colores y flores de alebrije" />
  </section>;
}
