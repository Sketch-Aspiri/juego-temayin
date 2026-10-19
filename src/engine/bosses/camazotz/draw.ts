import { CAMAZOTZ_FRAMES, WORLD7_EFFECTS, WORLD7_EFFECTS_FILE } from '../../../data/world7Art';
import { SPRITES } from '../../../data/intro';
import { BOSS_PRESENTATIONS } from '../../../data/bossPresentation';
import { bakedFrame, lazyImage, type Frame } from '../../render/artCache';
import type { Ctx } from '../../render/drawUtils';
import type { Camazotz } from './index';
import { ECHO_IDS, ECHO_NAMES, EXPOSED_TIME, WARN_TIME } from './tuning';

const BODY_WIDTH = 155;
const EFFECT_FRAME: Readonly<Record<string, keyof typeof WORLD7_EFFECTS>> = {
  bolt: 'bolt', shard: 'shard', wave: 'wave', bat: 'bolt', shell: 'bolt', wisp: 'bolt', seed: 'shard', quill: 'shard',
};

export function drawEffect(c: Ctx, id: keyof typeof WORLD7_EFFECTS, x: number, y: number, width: number, height: number): void {
  const image = bakedFrame(WORLD7_EFFECTS_FILE, WORLD7_EFFECTS[id], width / WORLD7_EFFECTS[id][2]);
  if (image) c.drawImage(image, x, y, width, height);
  else { c.fillStyle = id === 'mote' || id === 'sun' ? '#ffe68e' : '#ad68df'; c.fillRect(x, y, width, height); }
}

function poseFor(boss: Camazotz): Frame {
  if (boss.st === 'dead') return CAMAZOTZ_FRAMES.defeated;
  if (boss.hittable || boss.st === 'hurt') return CAMAZOTZ_FRAMES.dazed;
  if (boss.st === 'dive') return CAMAZOTZ_FRAMES.dive;
  if (boss.phase === 2) return boss.st === 'chamber' ? CAMAZOTZ_FRAMES.invoke : CAMAZOTZ_FRAMES.stalk;
  if (boss.phase === 3) return boss.st === 'beam' ? CAMAZOTZ_FRAMES.beam : CAMAZOTZ_FRAMES.eclipse;
  return boss.st === 'sleep' ? CAMAZOTZ_FRAMES.rest : CAMAZOTZ_FRAMES.fly;
}

function drawBody(c: Ctx, boss: Camazotz, cam: number): void {
  const frame = poseFor(boss);
  const image = bakedFrame('bosses/camazotz.webp', frame, BODY_WIDTH / frame[2], true);
  c.save(); c.translate(boss.x + boss.w / 2 - cam, boss.y + boss.h);
  if (boss.face < 0) c.scale(-1, 1);
  if (boss.st === 'hurt') c.globalAlpha = Math.floor(boss.t * 16) % 2 ? 0.4 : 1;
  if (boss.st === 'dead') c.globalAlpha = Math.max(0, 1 - boss.t / 2.6);
  if (image) c.drawImage(image, -BODY_WIDTH / 2, -image.height);
  else { c.fillStyle = '#4b255f'; c.fillRect(-boss.w / 2, -boss.h, boss.w, boss.h); }
  c.restore();
}

function drawWarning(c: Ctx, boss: Camazotz, cam: number): void {
  c.save(); c.strokeStyle = '#ffe68c'; c.fillStyle = '#fff0b6'; c.lineWidth = 3;
  c.font = 'bold 18px "Trebuchet MS", sans-serif'; c.textAlign = 'center';
  if (boss.st === 'diveWarn') {
    c.setLineDash([8, 8]); c.beginPath();
    c.moveTo(boss.targetX + boss.w / 2 - cam, 150); c.lineTo(boss.targetX + boss.w / 2 - cam, boss.floor); c.stroke();
    c.beginPath(); c.ellipse(boss.targetX + boss.w / 2 - cam, boss.floor - 5, boss.w / 2, 8, 0, 0, Math.PI * 2); c.stroke();
  }
  if (boss.st.endsWith('Warn')) {
    const caption = boss.st === 'beamWarn' ? 'RAYO · ¡SALTA O USA UN PILAR!' : boss.st === 'gustWarn' ? '¡VIENTO!' : boss.st === 'echoWarn' ? `ECO DE ${ECHO_NAMES[boss.echo].toUpperCase()}` : boss.st === 'swarmWarn' ? '¡ENJAMBRE!' : '¡PICADA!';
    c.fillText(caption, boss.left + (boss.right - boss.left) / 2 - cam, 70);
    c.fillRect(boss.left + 100 - cam, 86, (boss.right - boss.left - 200) * Math.min(1, boss.t / WARN_TIME), 4);
  }
  if (boss.hittable) {
    c.fillText('¡PÍSALO!', boss.x + boss.w / 2 - cam, boss.y - 80);
    c.fillRect(boss.x - cam, boss.y - 12, boss.w * Math.max(0, 1 - boss.t / EXPOSED_TIME), 4);
  }
  c.restore();
}

function drawEcho(c: Ctx, boss: Camazotz, cam: number): void {
  if (!['echoWarn', 'echo'].includes(boss.st)) return;
  const presentation = BOSS_PRESENTATIONS[ECHO_IDS[boss.echo]];
  const image = presentation.frame ? bakedFrame(presentation.image, presentation.frame, 0.2, true) : lazyImage(presentation.image);
  if (!image) return;
  c.save(); c.globalAlpha = 0.45;
  c.drawImage(image, boss.left + 75 - cam, 110, 105, 105 * image.height / image.width);
  c.restore();
}

export function drawCamazotz(c: Ctx, boss: Camazotz, cam: number): void {
  if (boss.st === 'gone') return;
  for (const hazard of boss.hazards) {
    if (hazard.kind === 'shard' && hazard.age < WARN_TIME) {
      c.save(); c.strokeStyle = '#ffe4a6'; c.lineWidth = 2; c.setLineDash([4, 5]);
      c.beginPath(); c.ellipse(hazard.x + hazard.w / 2 - cam, boss.floor - 5, 24, 7, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    if (hazard.kind === 'bat') {
      const image = bakedFrame(SPRITES.bat.file, SPRITES.bat.frame, 0.07, true);
      if (image) { c.drawImage(image, hazard.x - cam - 6, hazard.y - 6, hazard.w + 12, hazard.h + 12); continue; }
    }
    drawEffect(c, EFFECT_FRAME[hazard.kind], hazard.x - cam - 5, hazard.y - 5, hazard.w + 10, hazard.h + 10);
  }
  for (const mote of boss.motes) if (!mote.collected) drawEffect(c, 'mote', mote.x - cam - 21, mote.y - 23 + Math.sin(boss.clock * 3) * 3, 42, 46);
  drawEcho(c, boss, cam);
  drawWarning(c, boss, cam);
  if (boss.st === 'gust') for (let i = 0; i < 3; i++) drawEffect(c, 'gust', boss.left + (boss.clock * 180 + i * 240) % (boss.right - boss.left) - cam, 300 + i * 42, 100, 45);
  drawBody(c, boss, cam);
}
