import { WORLD7_EFFECTS, WORLD7_EFFECTS_FILE } from '../../../data/world7Art';
import { SPRITES } from '../../../data/intro';
import { BOSS_PRESENTATIONS } from '../../../data/bossPresentation';
import { bakedFrame, lazyImage } from '../../render/artCache';
import type { Ctx } from '../../render/drawUtils';
import type { Camazotz } from './index';
import { ECHO_IDS, ECHO_NAMES, WARN_TIME } from './tuning';

import { CAMAZOTZ_COMBAT_FILE, CAMAZOTZ_POSES, CAMAZOTZ_SCALE, CAMAZOTZ_FX, CAMAZOTZ_FX_FILE } from '../../../data/camazotzArt';
import { drawNewGameplaySprite } from '../../render/gameplaySprites';
import type { EclipseHazard } from './hazards';
const EFFECT_FRAME: Readonly<Record<string, keyof typeof WORLD7_EFFECTS>> = {
  bolt: 'bolt', shard: 'shard', wave: 'wave', bat: 'bolt', shell: 'bolt', wisp: 'bolt', seed: 'shard', quill: 'shard',
};

export function drawEffect(c: Ctx, id: keyof typeof WORLD7_EFFECTS, x: number, y: number, width: number, height: number): void {
  const image = bakedFrame(WORLD7_EFFECTS_FILE, WORLD7_EFFECTS[id], width / WORLD7_EFFECTS[id][2]);
  if (image) c.drawImage(image, x, y, width, height);
  else { c.fillStyle = id === 'mote' || id === 'sun' ? '#ffe68e' : '#ad68df'; c.fillRect(x, y, width, height); }
}

function poseFor(boss: Camazotz): keyof typeof CAMAZOTZ_POSES {
  if (boss.hittable || ['hurt', 'dead'].includes(boss.st)) return 'exposed';
  if (boss.st === 'dive') return 'dive';
  if (boss.st === 'diveWarn') return 'charge';
  if (boss.st === 'diveRecover') return 'land';
  if (boss.st === 'beam' || boss.st === 'beamWarn') return 'beam';
  if (boss.phase === 2 || boss.st === 'echo' || boss.st === 'echoWarn') return 'cast';
  return Math.floor(boss.clock * 5) % 2 ? 'up' : 'down';
}

function drawBody(c: Ctx, boss: Camazotz, cam: number): void {
  const pose = CAMAZOTZ_POSES[poseFor(boss)];
  const image = bakedFrame(CAMAZOTZ_COMBAT_FILE, pose.frame, CAMAZOTZ_SCALE, true);
  const hover = boss.y < boss.floor - boss.h && !['dive', 'exposeWarn', 'diveRecover'].includes(boss.st);
  c.save(); c.translate(boss.x + boss.w / 2 - cam, boss.y + boss.h + (hover ? Math.sin(boss.clock * 5) * 5 : 0));
  if (boss.face < 0) c.scale(-1, 1);
  if (boss.st === 'hurt') c.globalAlpha = Math.floor(boss.t * 16) % 2 ? 0.55 : 1;
  if (boss.st === 'dead') c.globalAlpha = Math.max(0, 1 - boss.t / 2.6);
  const x = (pose.frame[0] - pose.anchor[0]) * CAMAZOTZ_SCALE;
  const y = (pose.frame[1] - pose.anchor[1]) * CAMAZOTZ_SCALE;
  if (image) {
    if (boss.st === 'dive') {
      c.save(); c.globalAlpha = 0.18;
      c.drawImage(image, x - 24, y - 18); c.drawImage(image, x - 48, y - 36); c.restore();
    }
    c.drawImage(image, x, y);
  } else { c.fillStyle = '#4b255f'; c.fillRect(-boss.w / 2, -boss.h, boss.w, boss.h); }
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
    const caption = boss.st === 'beamWarn' ? `RAYO ${boss.beamCount + 1}/${boss.beamTotal} · ¡SALTA!` : boss.st === 'gustWarn' ? '¡VIENTO!' : boss.st === 'echoWarn' ? `ECO DE ${ECHO_NAMES[boss.echo].toUpperCase()}` : boss.st === 'swarmWarn' ? '¡ENJAMBRE!' : boss.st === 'exposeWarn' ? '¡PREPARA EL CONTRAATAQUE!' : `PICADA ${boss.diveCount + 1}/${boss.comboSize}`;
    c.fillText(caption, boss.left + (boss.right - boss.left) / 2 - cam, 70);
    c.fillRect(boss.left + 100 - cam, 86, (boss.right - boss.left - 200) * Math.min(1, boss.t / WARN_TIME), 4);
  }
  if (boss.hittable) {
    c.fillText('¡PÍSALO!', boss.x + boss.w / 2 - cam, boss.y - 80);
    c.fillRect(boss.x - cam, boss.y - 12, boss.w * Math.max(0, 1 - boss.t / boss.exposedTime), 4);
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
  for (const hazard of boss.hazards) drawHazard(c, boss, hazard, cam);
  for (const mote of boss.motes) if (!mote.collected) drawEffect(c, 'mote', mote.x - cam - 21, mote.y - 23 + Math.sin(boss.clock * 3) * 3, 42, 46);
  drawEcho(c, boss, cam);
  drawWarning(c, boss, cam);
  if (boss.st === 'gust') for (let i = 0; i < 3; i++) drawEffect(c, 'gust', boss.left + (boss.clock * 180 + i * 240) % (boss.right - boss.left) - cam, 300 + i * 42, 100, 45);
  drawBody(c, boss, cam);
}

/** Las marcas aparecen antes de que los proyectiles se muevan o puedan hacer daño. */
function drawHazard(c: Ctx, boss: Camazotz, hazard: EclipseHazard, cam: number): void {
  const pending = hazard.age < hazard.delay;
  c.save();
  if (pending) {
    c.strokeStyle = '#ffe4a6'; c.lineWidth = 2; c.setLineDash([4, 5]);
    c.beginPath();
    if (hazard.gravity) c.ellipse(hazard.x + hazard.w / 2 - cam, boss.floor - 5, 24, 7, 0, 0, Math.PI * 2);
    else { c.moveTo(hazard.x - cam, hazard.y + 11); c.lineTo(hazard.x - cam + hazard.vx * 0.45, hazard.y + 11 + hazard.vy * 0.45); }
    c.stroke(); c.globalAlpha = 0.35 + hazard.age / hazard.delay * 0.4;
  }
  drawProjectile(c, boss, hazard, cam);
  c.restore();
}

function drawProjectile(c: Ctx, boss: Camazotz, hazard: EclipseHazard, cam: number): void {
  const x = hazard.x + hazard.w / 2 - cam, y = hazard.y + hazard.h / 2;
  if (hazard.kind === 'bat') {
    const image = bakedFrame(SPRITES.bat.file, SPRITES.bat.frame, 0.07, true);
    if (image) { c.drawImage(image, x - 19, y - 19 + Math.sin(hazard.age * 18) * 2, 38, 38); return; }
  }
  if (hazard.kind === 'wisp' && boss.phase === 2) {
    const image = bakedFrame(CAMAZOTZ_FX_FILE, CAMAZOTZ_FX.orb, 0.08);
    if (image) { c.drawImage(image, x - 26, y - 26, 52, 52); return; }
  }
  if (hazard.kind === 'wave') {
    if (boss.phase === 3) {
      if (drawNewGameplaySprite(c, boss.echo === 1 ? 'waterWave' : 'spectralWave', x, hazard.y + hazard.h, 48, 38)) return;
    } else {
      const image = bakedFrame(CAMAZOTZ_FX_FILE, CAMAZOTZ_FX.wave, 0.08);
      if (image) { c.drawImage(image, x - 32, hazard.y - 14, 64, 50); return; }
    }
  }
  const sprite = hazard.kind === 'shell' ? 'cannonball' : hazard.kind === 'seed' ? 'algaeBall' : hazard.kind === 'wisp' ? 'wisp' : null;
  if (sprite && drawNewGameplaySprite(c, sprite, x, y, 34, 34)) return;
  if (hazard.kind === 'quill') {
    c.save(); c.translate(x, y); c.rotate(Math.PI / 2);
    const drawn = drawNewGameplaySprite(c, 'quill', 0, 0, 40, 12); c.restore();
    if (drawn) return;
  }
  drawEffect(c, EFFECT_FRAME[hazard.kind], hazard.x - cam - 5, hazard.y - 5, hazard.w + 10, hazard.h + 10);
}
