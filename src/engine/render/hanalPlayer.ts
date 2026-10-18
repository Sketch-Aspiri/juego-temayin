import { HANAL_MOTION_FILE, HANAL_MOTION_FRAMES, type HanalMotionId } from '../../data/hanalPixanPlayer';
import { PLAYER_HEAD_WIDTH } from '../../data/playerScale';
import type { World } from '../World';
import type { Ctx } from './drawUtils';
import { drawLazyFrame } from './enemies/atlas';

const RUN_FRAMES = ['run1', 'run2', 'run3', 'run4'] as const;
const LEGACY_RUN_FRAMES = 7;
const SWING_SPEED = 65;
const IDLE_RATE = 2;
const BLINK_RATE = 12;
const POWER_GLOW = 14;

/** La pose depende de la simulación: pausar congela también la animación. */
export function hanalMotionId(world: World): HanalMotionId {
  const p = world.player;
  if (world.phase === 'dying') return 'death';
  if (p.anim === 'win' || world.phase === 'done') return 'win';
  if (p.swinging !== null) return Math.abs(p.vx) > SWING_SPEED ? 'swing' : 'hang';
  if (p.throwT > 0) return 'throw';
  if (p.swimming) return p.strokeT > 0 ? 'swim2' : 'swim1';
  if (p.onGround && p.land > 0) return 'land';
  if (!p.onGround) return p.vy < 0 ? 'jump' : 'fall';
  if (Math.abs(p.vx) > 20) return RUN_FRAMES[Math.floor(p.runT * RUN_FRAMES.length / LEGACY_RUN_FRAMES) % RUN_FRAMES.length];
  return Math.floor(p.animT * IDLE_RATE) % 2 === 0 ? 'idle1' : 'idle2';
}

/** Cabeza de tamaño estable; pies al suelo, manos a la cuerda y centro del cuerpo al nadar. */
export function drawHanalPlayer(c: Ctx, world: World, _now: number): boolean {
  const p = world.player;
  if (world.phase !== 'dying' && p.inv > 0 && Math.floor(p.inv * BLINK_RATE) % 2 === 0) return true;
  const id = hanalMotionId(world), frame = HANAL_MOTION_FRAMES[id];
  const centered = id === 'hang' || id === 'swing' || id === 'swim1' || id === 'swim2';
  c.save();
  c.translate(p.x + p.w / 2 - world.camX, p.y + (centered ? p.h / 2 : p.h));
  if (p.face < 0) c.scale(-1, 1);
  if (p.fire || p.shield) {
    c.shadowColor = p.shield ? '#72fff0' : '#ffab32';
    c.shadowBlur = POWER_GLOW;
  }
  const drawn = drawLazyFrame(c, HANAL_MOTION_FILE, frame, PLAYER_HEAD_WIDTH / frame.headWidth, 0, 0, true);
  c.restore();
  return drawn;
}
