import { TAU } from '../../constants';
import { drawLazyFrame, footFrame } from '../../render/enemies/atlas';
import type { Ctx } from '../../render/drawUtils';
import type { HuayChivo } from './index';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';

const FRAMES = [footFrame(42, 64, 427, 466), footFrame(517, 139, 488, 390), footFrame(1035, 142, 494, 389), footFrame(36, 539, 474, 420), footFrame(556, 571, 441, 385), footFrame(1006, 718, 527, 238)] as const;
const SCALE = 0.27;
const WISP_WIDTH = 22;
const WISP_HEIGHT = 38;

export function drawHuayChivo(c: Ctx, b: HuayChivo, camX: number): void {
  if (b.st === 'gone') return;
  c.save(); c.translate(b.x + b.w / 2 - camX, b.y + b.h);
  if (b.face < 0) c.scale(-1, 1);
  if (b.st === 'teleport') c.globalAlpha = 0.35 + Math.sin(b.t * 25) * 0.2;
  if (b.st === 'hurt') c.globalAlpha = Math.floor(b.t * 16) % 2 ? 0.35 : 1;
  const index = b.st === 'dead' ? 5 : b.st === 'dazed' ? 4 : b.st === 'teleport' ? 3 : b.st === 'charge' ? 2 : b.st === 'warn' ? 1 : 0;
  if (!drawLazyFrame(c, 'bosses/huayChivo.webp', FRAMES[index], SCALE)) {
    c.fillStyle = '#663b85'; c.fillRect(-b.w / 2, -b.h, b.w, b.h);
    c.fillStyle = '#ffda74'; c.fillRect(8, -65, 12, 8);
  }
  c.restore();
  for (const f of b.wisps) {
    if (drawNewGameplaySprite(c, 'wisp', f.x - camX, f.y, WISP_WIDTH, WISP_HEIGHT)) continue;
    c.save(); c.translate(f.x - camX, f.y);
    c.fillStyle = '#c4ffcf'; c.shadowColor = '#51d881'; c.shadowBlur = 15;
    c.beginPath(); c.arc(0, 0, 12 + Math.sin(f.age * 10), 0, TAU); c.fill(); c.restore();
  }
  if (b.st === 'dazed') {
    c.fillStyle = '#ffdc54'; c.font = 'bold 24px sans-serif';
    c.fillText('★', b.x + b.w / 2 - camX, b.y - 12);
  }
}
