import { useState, type ReactNode } from 'react';
import type { StationPhoto as Photo } from '../../../data/stationInfo/photos';
import { assetUrl } from '../../../engine/assets';

interface PhotoProps {
  readonly photo: Photo;
  readonly children: ReactNode;
}

export function StationPhoto({ photo, children }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  return <figure className="station-photo">
    <div className={`station-photo__frame${failed ? ' station-photo__frame--missing' : ''}`}>
      {!failed && <img src={assetUrl(photo.file)} alt={photo.alt} width={photo.width} height={photo.height}
        decoding="async" onError={() => setFailed(true)} />}
      {children}
    </div>
    <figcaption>
      <p className="station-photo__caption">{photo.scope === 'surroundings' && <strong>Entorno real · </strong>}{photo.caption}</p>
      {failed && <p className="station-photo__missing" role="status">Fotografía no disponible. Puedes consultar el original.</p>}
      <p className="station-photo__credit" title="Imagen reducida y convertida a WebP; encuadre adaptado a la ficha.">
        Foto: <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.author}</a>{' · '}
        <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a>
      </p>
    </figcaption>
  </figure>;
}
