import type { CSSProperties } from 'react';
import type { SpriteRef } from '../../data/intro';
import { assetUrl } from '../../engine/assets';

interface SpriteFrameProps {
  sprite: SpriteRef;
  className?: string;
  style?: CSSProperties;
}

/** Porcentaje de `background-position` que alinea el recorte (0..100). */
const offsetPct = (pos: number, sheet: number, size: number): number => (sheet === size ? 0 : (pos / (sheet - size)) * 100);

/**
 * Muestra un recorte de una hoja de sprites como fondo CSS. El tamaño lo marca
 * el contenedor (alto en %); el ancho sale de la proporción del recorte.
 */
export function SpriteFrame({ sprite, className, style }: SpriteFrameProps) {
  const [x, y, w, h] = sprite.frame;
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        ...style,
        aspectRatio: `${w} / ${h}`,
        backgroundImage: `url(${assetUrl(sprite.file)})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${(sprite.sheetW / w) * 100}% ${(sprite.sheetH / h) * 100}%`,
        backgroundPosition: `${offsetPct(x, sprite.sheetW, w)}% ${offsetPct(y, sprite.sheetH, h)}%`,
      }}
    />
  );
}
