import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLevel } from '../../data/worlds';
import { AudioEngine } from '../audio';
import { HuayChivo } from '../bosses/huayChivo';
import { Lorencillo } from '../bosses/lorencillo';
import { TEST_LEVEL } from '../bosses/lorencillo/lorencillo.fixture';
import { T } from '../constants';
import { Input } from '../input';
import { World } from '../World';
import { drawBossArena } from './bossArena';
import type { Ctx } from './drawUtils';

const mock = vi.hoisted(() => ({ frame: vi.fn<typeof import('./artCache').bakedFrame>() }));
vi.mock('./artCache', () => ({ bakedFrame: mock.frame }));
const image = { width: 800, height: 300 } as HTMLCanvasElement;
const audio = new AudioEngine();
audio.muted = true;

/** Contexto que anota cada llamada y cada asignación de estilo, en orden. */
function recorder(): { c: Ctx; log: string[] } {
  const log: string[] = [];
  const state: Record<string | symbol, unknown> = {};
  const gradient = { addColorStop: (...args: unknown[]) => log.push(`stop(${args.join(',')})`) };
  const c = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args: unknown[]) => {
        log.push(`${String(key)}(${args.map((a) => (typeof a === 'number' ? a.toFixed(1) : String(a))).join(',')})`);
        return String(key).startsWith('create') ? gradient : undefined;
      };
    },
    set(target, key, value) {
      log.push(`${String(key)}=${String(value)}`);
      target[key] = value;
      return true;
    },
  });
  return { c: c as unknown as Ctx, log };
}

function izamal(): { world: World; boss: HuayChivo } {
  const def = getLevel('3-5');
  if (!def) throw new Error('falta el nivel 3-5');
  const world = new World({ def, input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
  const boss = world.boss;
  if (!(boss instanceof HuayChivo)) throw new Error('el jefe de 3-5 debe ser Huay Chivo');
  world.camX = 62 * T;
  return { world, boss };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('Atrio de Izamal según la etapa del Huay Chivo', () => {
  it.each([
    ['con el atlas', image],
    ['con el respaldo procedural', null],
  ] as const)('cada etapa dibuja un cielo distinto %s sin mutar el mundo', (_label, art) => {
    // Organizar
    mock.frame.mockReturnValue(art);
    const { world, boss } = izamal();
    const grid = JSON.stringify(world.grid);
    const logs: string[] = [];
    // Actuar
    for (const phase of [1, 2, 3] as const) {
      boss.phase = phase;
      const before = JSON.stringify(boss);
      const { c, log } = recorder();
      drawBossArena(c, world, 1000);
      logs.push(log.join('|'));
      // Comprobar
      expect(JSON.stringify(boss)).toBe(before);
    }
    expect(new Set(logs).size).toBe(3);
    expect(JSON.stringify(world.grid)).toBe(grid);
    expect(world.darkness).toBeNull();
  });

  it('devuelve amanecer sin luna cuando el jefe ya fue vencido', () => {
    mock.frame.mockReturnValue(null);
    const { world, boss } = izamal();
    const draw = (): string => {
      const { c, log } = recorder();
      drawBossArena(c, world, 1000);
      return log.join('|');
    };
    boss.phase = 1;
    const dusk = draw();
    boss.phase = 3;
    boss.hp = 0;
    const dawn = draw();
    expect(dawn).not.toBe(dusk);
    expect(dawn).toContain('fillStyle=rgba(255,232,174,.3)');
    expect(dawn).not.toContain('fillStyle=#f4f0d8');
    expect(dawn).not.toContain('createLinearGradient');
  });
});

describe('Cubierta del barco según la etapa de Lorencillo', () => {
  function ship(): { world: World; boss: Lorencillo } {
    const world = new World({ def: TEST_LEVEL, input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
    const boss = world.boss;
    if (!(boss instanceof Lorencillo)) throw new Error('el jefe debe ser Lorencillo');
    world.camX = 29 * T;
    return { world, boss };
  }

  it.each([
    ['con el atlas', image],
    ['con el respaldo procedural', null],
  ] as const)('el horizonte cambia en la fase 2 %s, sin gradientes ni mutar el mundo', (_label, art) => {
    // Organizar
    mock.frame.mockReturnValue(art);
    const { world, boss } = ship();
    const grid = JSON.stringify(world.grid);
    const logs: string[] = [];
    // Actuar
    for (const phase of [1, 2] as const) {
      boss.phase = phase;
      const before = JSON.stringify(boss);
      const { c, log } = recorder();
      drawBossArena(c, world, 1000);
      logs.push(log.join('|'));
      expect(JSON.stringify(boss)).toBe(before);
    }
    // Comprobar
    expect(logs[0]).not.toBe(logs[1]);
    for (const log of logs) {
      expect(log).not.toContain('createLinearGradient');
      expect(log).not.toContain('createRadialGradient');
    }
    expect(JSON.stringify(world.grid)).toBe(grid);
  });

  it('con el atlas dibuja barriles y cañones de utilería', () => {
    mock.frame.mockReturnValue(image);
    const { world } = ship();
    const { c } = recorder();
    drawBossArena(c, world, 1000);
    const files = mock.frame.mock.calls.map((call) => call[0]);
    expect(files).toContain('complementos/utileria.webp');
    expect(mock.frame.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
