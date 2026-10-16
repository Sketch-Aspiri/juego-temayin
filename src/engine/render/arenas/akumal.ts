import { SARGAZO_ARENA_FILE } from '../../../data/sargazoArt';
import { GROUND, T, TAU } from '../../constants';
import type { World } from '../../World';
import { lazyImage } from '../artCache';
import type { Ctx } from '../drawUtils';

const SURFACE = 3 * T;
const FLOOR = GROUND * T;
const TINT = ['', 'rgba(20,97,94,.08)', 'rgba(16,54,83,.15)', 'rgba(9,29,65,.22)'];

/** Bahía abierta: el decorado nunca parece una plataforma donde esconderse. */
export function drawAkumal(c: Ctx, width: number, now: number, world: World): void {
  const stage = world.boss && world.boss.hp > 0 ? world.boss.stage ?? 1 : 1;
  const image = lazyImage(SARGAZO_ARENA_FILE);
  if (image) c.drawImage(image, 0, SURFACE, width, FLOOR - SURFACE);
  else { c.fillStyle = '#177d95'; c.fillRect(0, SURFACE, width, FLOOR - SURFACE); }
  if (stage > 1) { c.fillStyle = TINT[stage - 1]; c.fillRect(0, SURFACE, width, FLOOR - SURFACE); }
  c.strokeStyle = 'rgba(186,255,243,.3)'; c.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    const x = (i + 0.5) * width / 14 + Math.sin(now / 1700 + i) * 9;
    const y = FLOOR - ((now / 45 + i * 41) % (FLOOR - SURFACE));
    c.beginPath(); c.arc(x, y, 2 + i % 3, 0, TAU); c.stroke();
  }
}
