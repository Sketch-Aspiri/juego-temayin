import { T } from '../constants';
import { overlap } from '../physics';
import type { Rect } from '../types';
import type { World } from '../World';

export type Ticket = Readonly<Rect>;
export const TICKET_WIDTH = 36;
export const TICKET_HEIGHT = 24;

/** El centro del boleto coincide con el centro del bloque, sin alterar el terreno. */
export function createTicket(tx: number, ty: number): Ticket {
  return { x: (tx + 0.5) * T - TICKET_WIDTH / 2, y: (ty + 0.5) * T - TICKET_HEIGHT / 2,
    w: TICKET_WIDTH, h: TICKET_HEIGHT };
}

export function collectTicket(world: World): void {
  if (world.phase !== 'play' || world.ticketCollected) return;
  const ticket = world.level.tickets.find(t => overlap(world.player, t));
  if (!ticket) return;
  world.ticketCollected = true;
  world.audio.play('power');
  world.popups.push({ x: ticket.x, y: ticket.y, t: 0, txt: '¡Boleto! Nivel secreto desbloqueado' });
}
