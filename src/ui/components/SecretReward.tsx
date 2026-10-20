import { JADE_HEART_REWARD, SECRET_LEVEL_IDS } from '../../data/secretRewards';
import '../hanalReward.css';

interface SecretRewardProps {
  /** Cacao de la primera vez; 0 al repetir el secreto. */
  cacao: number;
  /** Con este secreto se completan los siete sellos. */
  allSeals: boolean;
}

export function SecretReward({ cacao, allSeals }: SecretRewardProps) {
  if (cacao <= 0 && !allSeals) return null;
  return <div className="hanal-reward" role="status">
    <svg className="hanal-reward__icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 56 8 30C0 20 8 6 20 8c6 1 10 5 12 9 2-4 6-8 12-9 12-2 20 12 12 22Z" fill="#153e37" stroke="#e8bd68" strokeWidth="3" />
      <path d="M32 46 17 29c-4-6 0-13 6-12 4 1 7 4 9 8 2-4 5-7 9-8 6-1 10 6 6 12Z" fill="#398d78" />
    </svg>
    <div>
      <p className="hanal-reward__eyebrow">Recompensa del secreto</p>
      {cacao > 0 && <h3>+{cacao} de cacao</h3>}
      {cacao > 0 && <p>Sello de jade conseguido. Tu bolsa ya lo incluye.</p>}
      {allSeals && <>
        <h3>{JADE_HEART_REWARD.name}</h3>
        <p>{`¡Los ${SECRET_LEVEL_IDS.length} sellos de jade! ${JADE_HEART_REWARD.description}`}</p>
        <small>{JADE_HEART_REWARD.detail}</small>
      </>}
    </div>
  </div>;
}
