import type { Ref } from 'react';
import { SPRITES } from '../../../data/intro';
import { STATION_INFO } from '../../../data/stationInfo';
import { STATION_PHOTOS } from '../../../data/stationInfo/photos';
import { GUIDE_TITLE, guideUrl, pageLabel, type GuideReference, type StationFact } from '../../../data/stationInfo/types';
import { STATIONS } from '../../../data/stations';
import type { LevelDef } from '../../../engine/level/types';
import { SpriteFrame } from '../SpriteFrame';
import { StationPhoto } from './StationPhoto';

interface StationInfoProps {
  readonly level: LevelDef;
  readonly headingRef?: Ref<HTMLHeadingElement>;
}

const DESTINATION_LABELS = { station: 'Estación', place: 'Lugar de referencia', fiction: 'Escenario de fantasía' } as const;

function SourceLink({ source }: { readonly source: GuideReference }) {
  return <a className="station-info__source" href={guideUrl(source)} target="_blank" rel="noopener noreferrer"
    aria-label={`${GUIDE_TITLE}: ${source.section}, ${pageLabel(source)}; página ${source.pdfPage} del PDF. Abre otra pestaña.`}
    title={`${source.section} · ${pageLabel(source)} · PDF ${source.pdfPage}`}>
    {pageLabel(source)} <span aria-hidden="true">↗</span>
  </a>;
}

function Fact({ fact }: { readonly fact: StationFact }) {
  return <div className="station-info__fact"><span className="station-info__category">{fact.category}</span>
    <p>{fact.text} <SourceLink source={fact.source} /></p></div>;
}

export function StationInfoCard({ level, headingRef }: StationInfoProps) {
  const info = STATION_INFO[level.id];
  const station = STATIONS[level.id];
  const photo = STATION_PHOTOS[level.id];
  if (!info || !station || !photo) return null;
  return <article className="station-info" aria-labelledby={`station-title-${level.id}`} data-station-info={level.id}>
    <StationPhoto key={level.id} photo={photo}><header className="station-info__heading"><p className="station-info__eyebrow">FICHA DE VIAJE · {level.id}</p>
      <h3 id={`station-title-${level.id}`} ref={headingRef} tabIndex={-1}>{level.name}</h3>
      <p className="station-info__location">{info.location}</p>
      <span className={`station-info__kind station-info__kind--${station.kind}`}>{DESTINATION_LABELS[station.kind]}</span>
      {info.relation === 'regional' && <span className="station-info__scope">Contexto regional</span>}
    </header></StationPhoto>
    <div className="station-info__body">
    {info.note && <p className="station-info__note">{info.note}</p>}
    <section className="station-info__toh" aria-label="Dato curioso de Toh">
      <div className="station-info__toh-heading"><SpriteFrame sprite={SPRITES.tohPerch} className="station-info__bird" />
        <h4><small>TOH TE CUENTA</small>¿Sabías que…?</h4></div>
      <Fact fact={info.facts[0]} />
    </section>
    <p className="station-info__description">{info.description.text}{' '}
      {info.description.source !== 'game' && <SourceLink source={info.description.source} />}</p>
    <details className="station-info__more"><summary>Descubre más <span aria-hidden="true">＋</span></summary>
      {info.facts.slice(1).map(fact => <Fact key={fact.text} fact={fact} />)}
      <p className="station-info__coordinates">Referencia del mapa: {station.latitude.toFixed(3)}° N · {Math.abs(station.longitude).toFixed(3)}° O</p>
    </details>
    <p className="station-info__credit">Datos culturales: {GUIDE_TITLE}. Los enlaces indican las páginas impresas de la guía.</p>
    </div>
  </article>;
}
