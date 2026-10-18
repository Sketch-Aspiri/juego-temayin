import { TAU, VW } from '../constants';
import type { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawObject } from './props';
import { TICKET_HEIGHT } from '../entities/tickets';

/** El brillo es decorativo: la colisión permanece fija y la recogida pertenece al motor. */
export function drawTickets(c: Ctx, world: World, now: number): void {
  if (world.ticketCollected) return;
  for (const ticket of world.level.tickets) {
    const x = ticket.x + ticket.w / 2 - world.camX;
    if (x < -ticket.w || x > VW + ticket.w) continue;
    const y = ticket.y + ticket.h / 2;
    c.save();
    c.strokeStyle = '#ffe092'; c.lineWidth = 2;
    c.globalAlpha = 0.55 + Math.sin(now / 350) * 0.2;
    c.beginPath(); c.ellipse(x, y, ticket.w * 0.7, ticket.h * 0.8, 0, 0, TAU); c.stroke();
    c.globalAlpha = 1;
    if (!drawObject(c, 'ticket', x, y, TICKET_HEIGHT)) {
      c.fillStyle = '#f8d478'; c.fillRect(x - ticket.w / 2, y - ticket.h / 2, ticket.w, ticket.h);
      c.fillStyle = '#185949'; c.fillRect(x - 10, y - 3, 20, 6);
    }
    c.restore();
  }
}
