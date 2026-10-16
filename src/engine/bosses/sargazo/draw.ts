import { SARGAZO_ACTION_FILE, SARGAZO_POSES, SARGAZO_SCALE } from '../../../data/sargazoArt';
import { TAU } from '../../constants';
import { bakedFrame } from '../../render/artCache';
import { outlined, type Ctx } from '../../render/drawUtils';
import type { Sargazo, SargazoState } from './index';
import type { SeaAttack } from './choose';
import { cueScale, drawSeaHazards, drawSeaWarning, drawTurtleHelp } from './drawHazards';
import { SURFACE } from './tuning';

const FRAME_OF: Readonly<Record<SargazoState, keyof typeof SARGAZO_POSES>> = {
  sleep: 'swim', intro: 'swim', idle: 'swim', warn: 'net', attack: 'swim',
  exposed: 'core', hurt: 'hurt', shed: 'rage', dead: 'dead', gone: 'dead',
};
const ATTACK_POSE: Readonly<Record<SeaAttack, keyof typeof SARGAZO_POSES>> = {
  salvo: 'net', tide: 'whirlpool', surge: 'surge', whirlpool: 'whirlpool', rain: 'rage', net: 'net',
};

/** Pose submarina centrada en su cuerpo; no cambia la escala al extender los brazos. */
function drawBody(c: Ctx, b: Sargazo, camX: number): void {
  c.save(); c.translate(b.x + b.w / 2 - camX, b.y + b.h / 2); c.scale(b.face, 1);
  if (b.st === 'hurt' && Math.floor(b.t * 14) % 2 === 0) c.globalAlpha = 0.4;
  const pose = b.st === 'warn' || b.st === 'attack' ? ATTACK_POSE[b.attack] : FRAME_OF[b.st];
  const frame = SARGAZO_POSES[pose];
  const image = bakedFrame(SARGAZO_ACTION_FILE, frame, SARGAZO_SCALE, true);
  if (image) c.drawImage(image, -Math.round(frame[2] * SARGAZO_SCALE / 2), -Math.round(frame[3] * SARGAZO_SCALE / 2));
  else {
    c.fillStyle = '#97732c'; c.beginPath(); c.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, TAU); c.fill();
    c.fillStyle = b.hittable ? '#9bfff0' : '#3f5e3b'; c.fillRect(-18, -20, 36, 36);
  }
  c.restore();
}

export function drawSargazo(c: Ctx, b: Sargazo, camX: number): void {
  if (b.st === 'gone') return;
  drawSeaHazards(c, b, camX);
  drawTurtleHelp(c, b, camX);
  if (b.st === 'warn') drawSeaWarning(c, b, camX);
  drawBody(c, b, camX);
  if (b.hittable) {
    c.save();
    c.strokeStyle = '#a6ffeb'; c.lineWidth = 3;
    c.beginPath(); c.arc(b.x + b.w / 2 - camX, b.y + b.h / 2, 62, 0, TAU); c.stroke();
    const scale = cueScale(c), compact = scale > 1;
    const x = compact ? (b.left + b.right) / 2 : b.x + b.w / 2;
    c.font = `bold ${20 * scale}px "Trebuchet MS", sans-serif`; c.textAlign = 'center';
    outlined(c, '¡NÚCLEO: TÓCALO!', x - camX, compact ? SURFACE + 60 : b.y - 30, '#adffef', 4);
    c.restore();
  }
}
