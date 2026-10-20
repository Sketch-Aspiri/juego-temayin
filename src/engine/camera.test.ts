import { describe, expect, it } from 'vitest';
import { AudioEngine } from './audio';
import { followCamera } from './camera';
import { GROUND, START_LIVES, STEP, T, VW } from './constants';
import { Input } from './input';
import type { LevelDef } from './level/types';
import { World } from './World';

const ANCHO_NIVEL = 4000;

describe('followCamera con retroceso (niveles con acertijos)', () => {
  it('sigue al jugador hacia la izquierda sin pasar del inicio', () => {
    expect(followCamera(2000, 1000, ANCHO_NIVEL, false, 0, true)).toBe(1000 - VW * 0.4);
    expect(followCamera(300, 100, ANCHO_NIVEL, false, 0, true)).toBe(0);
  });

  it('sin retroceso la cámara nunca vuelve atrás', () => {
    expect(followCamera(2000, 1000, ANCHO_NIVEL, false)).toBe(2000);
  });
});

describe('followCamera', () => {
  it('avanza hacia el jugador', () => {
    // Organizar / Actuar
    const cam = followCamera(0, 1000, ANCHO_NIVEL, false);
    // Comprobar
    expect(cam).toBeGreaterThan(0);
  });

  it('nunca retrocede aunque el jugador vuelva atrás', () => {
    expect(followCamera(800, 100, ANCHO_NIVEL, false)).toBe(800);
  });

  it('no pasa del borde derecho del nivel', () => {
    expect(followCamera(0, ANCHO_NIVEL * 2, ANCHO_NIVEL, false)).toBe(ANCHO_NIVEL - VW);
  });

  it('se queda fija con lockCamera', () => {
    expect(followCamera(300, 2000, ANCHO_NIVEL, true)).toBe(300);
  });
});

describe('followCamera con desplazamiento automático', () => {
  const AUTO_PX = 3;

  it('avanza al menos el desplazamiento aunque el jugador no se mueva', () => {
    expect(followCamera(100, 0, ANCHO_NIVEL, false, AUTO_PX)).toBe(100 + AUTO_PX);
  });

  it('sigue al jugador si va más rápido que el empuje', () => {
    expect(followCamera(0, 2000, ANCHO_NIVEL, false, AUTO_PX)).toBe(2000 - VW * 0.4);
  });

  it('se detiene en el borde derecho del nivel', () => {
    expect(followCamera(ANCHO_NIVEL - VW - 1, 0, ANCHO_NIVEL, false, AUTO_PX)).toBe(ANCHO_NIVEL - VW);
  });

  it('no avanza con la cámara bloqueada por un jefe', () => {
    expect(followCamera(300, 0, ANCHO_NIVEL, true, AUTO_PX)).toBe(300);
  });
});

const AUTO_BLOCKS_PER_SECOND = 4;

const levelWith = (extra: LevelDef['ops'], autoScroll?: number): LevelDef => ({
  id: 'prueba-autoscroll', name: 'Prueba', width: 120, theme: 'jungleTrain', autoScroll,
  ops: [...extra, ['flag', 110]],
});

const make = (def: LevelDef) => {
  const audio = new AudioEngine();
  audio.muted = true;
  const world = new World({ def, session: { score: 0, coins: 0, lives: START_LIVES }, input: new Input(), audio });
  world.enemies = [];
  return world;
};

const run = (world: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += STEP) world.update(STEP);
};

describe('cámara automática en el mundo', () => {
  it('con autoScroll la cámara avanza a esa velocidad con el jugador quieto', () => {
    const world = make(levelWith([], AUTO_BLOCKS_PER_SECOND));
    run(world, 1);
    expect(Math.abs(world.camX - AUTO_BLOCKS_PER_SECOND * T)).toBeLessThan(2); // un paso de más por el redondeo del bucle
  });

  it('sin autoScroll el jugador quieto no mueve la cámara', () => {
    const world = make(levelWith([]));
    run(world, 1);
    expect(world.camX).toBe(0);
  });

  it('empuja al jugador por el borde izquierdo en terreno libre sin matarlo', () => {
    const world = make(levelWith([], AUTO_BLOCKS_PER_SECOND));
    run(world, 4);
    expect(world.phase).toBe('play');
    expect(world.player.x).toBeGreaterThanOrEqual(world.camX);
  });

  it('aplasta al jugador si el borde lo empuja contra un bloque sólido', () => {
    // Un muro justo a la derecha del jugador: no puede ceder.
    const world = make(levelWith([['col', 8, 4]], AUTO_BLOCKS_PER_SECOND));
    world.player.x = 8 * T - world.player.w;
    world.player.y = GROUND * T - world.player.h;
    run(world, 4);
    expect(world.phase).toBe('dying');
  });

  it('se queda quieta al final del nivel', () => {
    const world = make(levelWith([], AUTO_BLOCKS_PER_SECOND));
    world.camX = world.width * T - VW - 1;
    world.player.x = world.camX + 100;
    run(world, 1);
    expect(world.camX).toBe(world.width * T - VW);
  });

  it('durante la meta no aplica el desplazamiento automático', () => {
    const world = make(levelWith([['temple', 20]], AUTO_BLOCKS_PER_SECOND));
    world.camX = 3000; // por delante del encuadre de la meta: el panorama no la mueve
    world.phase = 'flag';
    run(world, 1);
    expect(world.camX).toBe(3000);
  });
});
