import { assetUrl } from '../../engine/assets';
import type { BossHud } from '../../engine/hud';
import { BOSS_PRESENTATIONS } from '../../data/bossPresentation';

interface BossBannerProps {
  boss: BossHud;
}

const rectanglePath = ([x, y, w, h]: readonly [number, number, number, number]): string => `M${x} ${y}h${w}v${h}h${-w}z`;

/** Cartel de presentación mientras el jefe despierta, y barra de vida durante la pelea. */
export function BossBanner({ boss }: BossBannerProps) {
  const presentation = BOSS_PRESENTATIONS[boss.id];
  const clipId = `boss-portrait-${boss.id}`;
  if (boss.intro) {
    return (
      <div className={`boss-intro boss-intro--${boss.id}`} role="alert" style={{ borderColor: presentation.color }}>
        {presentation.frame ? (
          <svg className="boss-intro__img" viewBox={presentation.frame.join(' ')} aria-hidden="true">
            {presentation.cutout && <defs><clipPath id={clipId}>
              <path d={`${rectanglePath(presentation.frame)} ${rectanglePath(presentation.cutout)}`} clipRule="evenodd" />
            </clipPath></defs>}
            <image href={assetUrl(presentation.image)} width="1536" height="1024"
              clipPath={presentation.cutout ? `url(#${clipId})` : undefined} />
          </svg>
        ) : <img src={assetUrl(presentation.image)} alt="" className="boss-intro__img" />}
        <div className="boss-intro__text">
          <p className="boss-intro__warn">¡CUIDADO!</p>
          <p className="boss-intro__arena" style={{ color: presentation.color }}>{presentation.arena}</p>
          <h2 className="boss-intro__name">{boss.name}</h2>
          <p>{presentation.hint}</p>
        </div>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const angry = boss.hp <= boss.maxHp / 2;
  return (
    <div className="boss-bar" role="progressbar" aria-label={boss.name} aria-valuemin={0} aria-valuemax={boss.maxHp} aria-valuenow={boss.hp}>
      <span className="boss-bar__name">{boss.name}</span>
      <div className="boss-bar__track">
        <div className={angry ? 'boss-bar__fill boss-bar__fill--angry' : 'boss-bar__fill'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
