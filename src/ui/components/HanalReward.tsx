import { HANAL_REWARD } from '../../data/hanalReward';
import '../hanalReward.css';

export function HanalReward() {
  return <div className="hanal-reward">
    <svg className="hanal-reward__icon" viewBox="0 0 64 76" aria-hidden="true">
      <path d="M20 5Q32 30 44 5" fill="none" stroke="#b89257" strokeWidth="4" />
      <path d="M32 18 55 30 50 55 32 70 14 55 9 30Z" fill="#153e37" stroke="#e8bd68" strokeWidth="3" />
      <path d="M32 26 46 34 43 51 32 61 21 51 18 34Z" fill="#398d78" />
      <path d="M32 31Q20 47 32 52Q44 47 32 31Z" fill="#ffe6a3" />
      <path d="M32 40Q27 48 32 49Q37 48 32 40Z" fill="#fff9e6" />
    </svg>
    <div><p className="hanal-reward__eyebrow">Recompensa permanente obtenida</p>
      <h3>{HANAL_REWARD.name}</h3><p>{HANAL_REWARD.description}</p>
      <small>{HANAL_REWARD.detail}</small></div>
  </div>;
}
