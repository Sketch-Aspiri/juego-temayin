import type { LevelDef } from '../../engine/level/types';
import type { LevelRecord } from '../../store/progress';
import { Stars } from './Stars';
import { TicketIcon } from './TicketIcon';

interface LevelTileProps {
  level: LevelDef;
  bonus?: boolean;
  unlocked: boolean;
  record?: LevelRecord;
  onPlay: () => void;
}

export function LevelTile({ level, bonus = false, unlocked, record, onPlay }: LevelTileProps) {
  return <button type="button"
    className={`level-tile${unlocked ? '' : ' level-tile--locked'}${record ? ' level-tile--done' : ''}${bonus ? ' level-tile--secret' : ''}`}
    disabled={!unlocked} onClick={onPlay}>
    <span className="level-tile__id">{bonus ? 'DESVÍO SECRETO' : level.id}</span>
    {bonus && <TicketIcon />}
    <span className="level-tile__name">{bonus && !unlocked ? 'Destino secreto' : level.name}</span>
    {bonus && <span className="level-tile__secret">{unlocked ? 'Boleto encontrado · ¡A explorar!' : 'Encuentra el boleto de este mundo'}</span>}
    {level.boss && <span className="level-tile__badge">JEFE</span>}
    {unlocked ? <Stars value={record?.stars ?? 0} /> : <span className="level-tile__lock" aria-label="Bloqueado">🔒</span>}
    {record && <span className="level-tile__best">Mejor: {record.bestScore}</span>}
  </button>;
}
