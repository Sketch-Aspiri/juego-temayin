import { describe, expect, it, vi } from 'vitest';
import { getLevel } from '../../data/worlds';
import { AudioEngine } from '../audio';
import type { Boss } from '../bosses/types';
import { HuayPek } from '../bosses/huayPek';
import { Input } from '../input';
import { World } from '../World';
import type { LightSource } from './lighting';
import { LightBuffer, lightSources } from './lighting';
import { HuayChivo } from '../bosses/huayChivo';

const audio = new AudioEngine();
audio.muted = true;

function campaign(id: string): World {
  const def = getLevel(id);
  if (!def) throw new Error(`Falta ${id}`);
  return new World({ def, input: new Input(), audio, session: { score: 0, coins: 0, lives: 3 } });
}

const DARK = { radius: 170, alpha: 0.8 } as const;
const EYE = 80;

describe('fuentes de luz de los jefes', () => {
  it('devuelve instantáneas independientes cuando se consultan las luces públicas', () => {
    const world = campaign('3-5');
    const boss = world.boss as HuayChivo;
    world.darkness = DARK; boss.st = 'paw';
    const first = world.lightSources();
    const snapshot = structuredClone(first);
    boss.x += 100;
    const next = world.lightSources();
    expect(first).toEqual(snapshot);
    expect(next).not.toEqual(first);
  });

  it('reutiliza lista y objetos cuando el renderer aporta un buffer', () => {
    const world = campaign('3-5');
    world.darkness = DARK;
    const buffer = new LightBuffer();
    const first = lightSources(world, buffer), player = first[0];
    world.player.x += 10;
    const next = lightSources(world, buffer);
    expect(next).toBe(first);
    expect(next[0]).toBe(player);
    expect(player.x).toBe(world.player.x + world.player.w / 2);
  });

  it('añade las luces que aporta el jefe solo cuando hay oscuridad', () => {
    // Organizar
    const world = campaign('3-5');
    const boss = world.boss as Boss;
    const lights = vi.fn((out: LightSource[]) => { out.push({ x: 123, y: 45, radius: 67 }); });
    Object.assign(boss, { lights });
    world.darkness = null;
    // Actuar
    const lit = world.lightSources();
    world.darkness = DARK;
    const dark = world.lightSources();
    // Comprobar
    expect(lit).toHaveLength(0);
    expect(lights).toHaveBeenCalledTimes(1);
    expect(dark).toContainEqual({ x: 123, y: 45, radius: 67 });
  });

  it('Huay Pek solo enciende los ojos en la ventana vulnerable', () => {
    // Organizar
    const world = campaign('4-5');
    const boss = world.boss;
    if (!(boss instanceof HuayPek)) throw new Error('el jefe de 4-5 debe ser Huay Pek');
    world.darkness = DARK;
    const eyes = { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, radius: EYE };
    // Actuar
    boss.st = 'prowl';
    const calm = world.lightSources();
    boss.st = 'vulnerable';
    const lit = world.lightSources();
    // Comprobar
    expect(calm).not.toContainEqual(eyes);
    expect(lit).toContainEqual(eyes);
    expect(lit).toHaveLength(calm.length + 1);
  });
});
