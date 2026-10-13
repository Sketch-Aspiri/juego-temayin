import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { SpriteRef } from '../../data/intro';
import { assetUrl } from '../../engine/assets';
import { isolatedFrameUrl } from '../../engine/render/artCache';

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
  const [cleanFrame, setCleanFrame] = useState<{ sprite: SpriteRef; url: string } | null>(null);
  useEffect(() => {
    if (!sprite.isolated) return;
    let active = true;
    void isolatedFrameUrl(sprite.file, sprite.frame).then(url => {
      if (active && url) setCleanFrame({ sprite, url });
    });
    return () => { active = false; };
  }, [sprite]);
  const url = sprite.isolated ? cleanFrame?.sprite === sprite ? cleanFrame.url : null : assetUrl(sprite.file);
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        ...style,
        aspectRatio: `${w} / ${h}`,
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundSize: sprite.isolated ? '100% 100%' : `${(sprite.sheetW / w) * 100}% ${(sprite.sheetH / h) * 100}%`,
        backgroundPosition: sprite.isolated ? 'center' : `${offsetPct(x, sprite.sheetW, w)}% ${offsetPct(y, sprite.sheetH, h)}%`,
      }}
    />
  );
}
