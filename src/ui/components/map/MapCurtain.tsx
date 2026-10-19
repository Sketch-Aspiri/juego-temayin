import { useId } from 'react';

export const MAP_REVEAL_MS = 1500;
export const MAP_COVER_MS = 900;

/** Dos bancos opacos cubren todo el visor antes de descubrir la carta. */
export function MapCurtain() {
  const id = useId().replace(/:/g, '');
  return <div className="map-curtain" aria-hidden="true">
    {['north', 'south'].map((side, sideIndex) => <div key={side} className={`map-curtain__bank map-curtain__bank--${side}`}>
      <svg viewBox="0 0 1600 700" preserveAspectRatio="none">
        <defs><linearGradient id={`curtain-${id}-${side}`} x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#eff1e6" /><stop offset=".62" stopColor="#d8e3df" /><stop offset="1" stopColor="#acc5c7" />
        </linearGradient></defs>
        <path d="M0 0H1600V510H0Z" fill={`url(#curtain-${id}-${side})`} />
        {Array.from({ length: 12 }, (_, index) => <ellipse key={index}
          cx={index * 150 - 25} cy={510 + (index % 3) * 16} rx={133 + index % 2 * 18} ry={92 + index % 3 * 14}
          fill={`url(#curtain-${id}-${side})`} />)}
        {Array.from({ length: 10 }, (_, index) => <ellipse key={index}
          cx={index * 190 + sideIndex * 45} cy={415 + index % 2 * 28} rx="155" ry="72" fill="#edf1e8" opacity=".32" />)}
      </svg>
    </div>)}
  </div>;
}
