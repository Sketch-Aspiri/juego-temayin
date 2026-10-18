import { OBJECTS_FILE, OBJECT_FRAMES, OBJECTS_SHEET_SIZE } from '../../data/objectSprites';
import { SpriteFrame } from './SpriteFrame';

const TICKET_SPRITE = { file: OBJECTS_FILE, frame: OBJECT_FRAMES.ticket,
  sheetW: OBJECTS_SHEET_SIZE, sheetH: OBJECTS_SHEET_SIZE };

export function TicketIcon() {
  return <SpriteFrame sprite={TICKET_SPRITE} className="ticket-icon" />;
}
