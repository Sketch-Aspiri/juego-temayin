import { describe, expect, it } from 'vitest';
import { getLevel } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { Sargazo } from './index';

/** Solo entradas reales; se protege el contacto para medir recorrido, aire y ventanas. */
function steer(world: World, boss: Sargazo): void {
  const p = world.player, input = world.input;
  p.inv = 1;
  input.release('right'); input.release('left'); input.release('run');
  let x: number, y: number;
  if (!boss.lockCamera || boss.hp <= 0) {
    x = world.level.flagX * T; y = 80;
  } else if (boss.hittable) {
    x = boss.x + boss.w / 2; y = boss.y + boss.h / 2;
  } else {
    const ally = boss.turtles.find(t => t.netted) ?? boss.turtles[boss.team.target(boss)];
    x = ally.platform.x + ally.platform.w / 2; y = ally.platform.y - 10;
  }
  const dx = x - (p.x + p.w / 2), dy = p.y + p.h / 2 - y;
  if (Math.abs(dx) > 12) input.press(dx > 0 ? 'right' : 'left');
  const stroke = p.swimming ? dy > 30 && p.vy >= 0 : p.onGround || p.coyote > 0;
  if (stroke && !input.held.jump) input.press('jump');
  else if (p.vy >= 0 || (!stroke && p.onGround)) input.release('jump');
}

describe('Recorrido submarino sin poderes', () => {
  it('devuelve victoria y salida usando rescates, contacto con el núcleo y oxígeno real', () => {
    const audio = new AudioEngine(); audio.muted = true;
    const w = new World({ def: getLevel('5-6')!, audio, input: new Input(), fromCheckpoint: true,
      session: { score: 0, coins: 0, lives: 3 } });
    const b = w.boss as Sargazo;
    const phases = new Set<number>();
    let minAir = 10, elapsed = 0;
    for (; elapsed < 400 && w.phase !== 'done' && w.phase !== 'dying'; elapsed += STEP) {
      steer(w, b); w.update(STEP);
      phases.add(b.stage); minAir = Math.min(minAir, w.player.oxygen);
    }
    expect({ phase: w.phase, hp: b.hp, state: b.st, rescues: b.rescues, x: w.player.x / T,
      y: w.player.y, air: w.player.oxygen, elapsed }, 'Recorrido: ' + JSON.stringify({
        x: w.player.x / T, y: w.player.y, air: w.player.oxygen, hp: b.hp, state: b.st, rescues: b.rescues,
      })).toMatchObject({ phase: 'done', hp: 0 });
    expect([...phases]).toEqual([1, 2, 3, 4]);
    expect(b.rescues).toBeGreaterThanOrEqual(12);
    expect(minAir).toBeGreaterThan(0);
    expect(w.solid(101, 0)).toBe(false);
    expect(w.player.fire).toBe(false); expect(w.player.ball).toBe(false);
    expect(b.turtles.every(t => !t.netted && !t.platform.submerged)).toBe(true);
  });
});
