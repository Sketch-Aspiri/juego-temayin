import { SPRITES } from '../../../data/intro';
import { WORLD7_BRAZIER_FILE, WORLD7_BRAZIER_FRAME, WORLD7_EFFECTS, WORLD7_EFFECTS_FILE } from '../../../data/world7Art';
import { GROUND, T } from '../../constants';
import { beamRect } from '../../bosses/camazotz/hazards';
import { Camazotz } from '../../bosses/camazotz';
import type { World } from '../../World';
import { bakedFrame } from '../artCache';
import type { Ctx } from '../drawUtils';

const FLOOR = GROUND * T;

/** Cambia el decorado de la arena ficticia, sin pintar plataformas que no tengan colisión. */
export function drawThrone(c: Ctx, width: number, _now: number, world: World): void {
  const boss = world.boss;
  if (!(boss instanceof Camazotz)) return;
  if (boss.phase === 2) {
    drawShrine(c, boss.floor);
  }
  if (boss.phase === 3 && boss.st !== 'gone') {
    c.fillStyle = 'rgba(40,10,55,.22)'; c.fillRect(0, 0, width, FLOOR);
    drawSun(c, width / 2, 110, boss.motes.filter(mote => mote.collected).length);
  }
  drawCaptive(c, width - 105, boss.st === 'gone');
  if (boss.st === 'beamWarn' || boss.st === 'beam') {
    const rect = beamRect(boss, world);
    c.fillStyle = boss.st === 'beam' ? '#ffdf8d' : 'rgba(232,176,255,.28)';
    c.fillRect(rect.x - boss.left, rect.y, rect.w, rect.h);
    c.strokeStyle = '#c879ef'; c.lineWidth = 3;
    c.strokeRect(rect.x - boss.left, rect.y, rect.w, rect.h);
  }
}

function drawShrine(c: Ctx, floor: number): void {
  const brazier = bakedFrame(WORLD7_BRAZIER_FILE, WORLD7_BRAZIER_FRAME, 0.12);
  if (brazier) c.drawImage(brazier, T * 1.8 - 32, floor - 96, 64, 96);
  c.fillStyle = '#f8e7a1'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
  c.fillText('FUEGO', T * 1.8, floor - 102);
}

function drawSun(c: Ctx, x: number, y: number, charge: number): void {
  const image = bakedFrame(WORLD7_EFFECTS_FILE, WORLD7_EFFECTS.sun, 0.18);
  if (!image) return;
  c.save(); c.globalAlpha = 0.35 + charge / 3 * 0.65;
  c.drawImage(image, x - 42, y - 42, 84, 84); c.restore();
}

function drawCaptive(c: Ctx, x: number, freed: boolean): void {
  const sprite = freed ? SPRITES.temayinaSun : SPRITES.temayinaCaptive;
  const image = bakedFrame(sprite.file, sprite.frame, 0.19, true);
  if (image) c.drawImage(image, x - 32, 145, 64, 64 * image.height / image.width);
  if (freed) return;
  const cage = bakedFrame(SPRITES.shadowCage.file, SPRITES.shadowCage.frame, 0.2, true);
  if (cage) c.drawImage(cage, x - 52, 120, 104, 114);
}
