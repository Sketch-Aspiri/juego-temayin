import { describe, expect, it } from 'vitest';
import { getLevel, nextLevelId } from '../../../data/worlds';
import { AudioEngine } from '../../audio';
import { START_LIVES, STEP, T } from '../../constants';
import { Input } from '../../input';
import { World } from '../../World';
import { Lorencillo } from './index';

/** Segundos máximos de la partida guionizada (el nivel dura 400 s). */
const MAX_SECONDS = 300;
/** Bloques tras la entrada de la arena donde empieza la pelea (pasada la columna que despierta al jefe). */
const WAIT_OFFSET = 2;
/** Píxeles que los pies se hunden en la espalda al caer: dentro del margen del pisotón. */
const STOMP_SINK = 8;
const STOMP_FALL_SPEED = 300;

function make(): World {
  const audio = new AudioEngine();
  audio.muted = true;
  const def = getLevel('6-6');
  if (!def) throw new Error('Falta el nivel 6-6');
  return new World({ def, input: new Input(), audio, fromCheckpoint: true, session: { score: 0, coins: 0, lives: START_LIVES } });
}

/**
 * Solo pisotones (el jugador no tiene chile ni pelota): cuando la espalda queda expuesta, cae sobre ella. Tras vencerlo corre a la bandera. El contacto está
 * protegido: se mide el recorrido y las ventanas, no la puntería.
 */
function steer(world: World, boss: Lorencillo): void {
  const p = world.player;
  const input = world.input;
  p.inv = 1;
  if (boss.hp <= 0 && boss.st === 'gone') {
    input.press('right');
    input.press('run');
    return;
  }
  if (!boss.hittable) return;
  p.x = boss.x + boss.w / 2 - p.w / 2;
  p.y = boss.y - p.h + STOMP_SINK;
  p.vy = STOMP_FALL_SPEED;
}

describe('Chetumal (6-6): victoria guionizada sin poderes', () => {
  it('el punto de control queda fuera de la arena, seco y sin poderes', () => {
    const w = make();
    const boss = w.boss as Lorencillo;
    expect(w.player.x).toBeLessThan(boss.arena[0] * T);
    expect(w.solid(Math.floor(w.player.x / T), 12)).toBe(true);
    expect(w.level.water.some((z) => w.player.x / T >= z.x0 && w.player.x / T <= z.x1)).toBe(false);
    expect(w.player.fire).toBe(false);
    expect(w.player.ball).toBe(false);
  });

  it('vence a Lorencillo solo con pisotones, abre el muro y llega a la meta', () => {
    const w = make();
    const boss = w.boss as Lorencillo;
    w.player.x = (boss.arena[0] + WAIT_OFFSET + 1) * T;
    w.camX = w.player.x - T * 4;
    const phases = new Set<number>();
    let elapsed = 0;
    for (; elapsed < MAX_SECONDS && w.phase === 'play'; elapsed += STEP) {
      steer(w, boss);
      w.update(STEP);
      phases.add(boss.stage);
    }
    expect(boss.hp).toBe(0);
    expect([...phases]).toEqual([1, 2]);
    expect(w.solid(boss.arena[1] + 1, 0)).toBe(false);
    expect(['flag', 'done']).toContain(w.phase);
    expect(w.player.fire).toBe(false);
    expect(w.player.ball).toBe(false);
    expect(w.session.lives).toBe(START_LIVES);
    expect(w.session.coins).toBeGreaterThan(0);
  });

  it('Chetumal cierra el Mundo 6 y abre la ruta de Calakmul', () => {
    expect(nextLevelId('6-5')).toBe('6-6');
    expect(nextLevelId('6-6')).toBe('7-1');
  });
});
