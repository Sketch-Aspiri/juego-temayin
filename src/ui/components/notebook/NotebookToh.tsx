import { useState } from 'react';
import { NOTEBOOK_ART } from '../../../data/explorerNotebook/art';
import { SPRITES } from '../../../data/intro';
import { assetUrl } from '../../../engine/assets';
import { SpriteFrame } from '../SpriteFrame';

interface NotebookTohProps {
  portrait?: boolean;
  decorative?: boolean;
}

/** El retrato nuevo conserva el sprite del juego como respaldo si falla su imagen. */
export function NotebookToh({ portrait = false, decorative = false }: NotebookTohProps) {
  const [failed, setFailed] = useState(false);
  const label = 'Toh, el pájaro reloj, con su plumaje turquesa y pecho anaranjado';
  return <span className={`notebook-toh${portrait ? ' notebook-toh--portrait' : ''}`} aria-hidden={decorative || undefined}
    role={failed && !decorative ? 'img' : undefined} aria-label={failed && !decorative ? label : undefined}>
    {failed ? <SpriteFrame sprite={SPRITES.tohPerch} className="notebook-toh__fallback" />
      : <img className="notebook-toh__image" src={assetUrl(NOTEBOOK_ART.toh)} alt={decorative ? '' : label}
        width="1254" height="1254" decoding="async" onError={() => setFailed(true)} />}
  </span>;
}
