import { describe, expect, it } from 'vitest';
import { LEVEL_1_1 } from '../data/levels/world1/1-1-palenque';
import { AudioEngine } from './audio';
import { GROUND, SAFE_RESPAWN_GAP, START_LIVES, STEP, T } from './constants';
import { Input } from './input';
import { World } from './World';

/** Columna de destino al volver atrás desde el checkpoint de Palenque (102): tramo con coatíes en 84 y 86. */
const BACKTRACK_TILE = 80;
const MAX_STEPS = Math.ceil(8 / STEP);

function make(fromCheckpoint: boolean): World {
  const audio = new AudioEngine();
  audio.muted = true;
  return new World({
    def: LEVEL_1_1, input: new Input(), audio, fromCheckpoint,
    session: { score: 0, coins: 0, lives: START_LIVES },
  });
}

/** Enemigos vivos cuyo cuerpo queda a la izquierda de la columna dada. */
function aliveBefore(world: World, tile: number): number {
  return world.enemies.filter(e => e.alive && !e.dead && e.x < tile * T).length;
}

/** Columna izquierda de la columna tallada 28-29 de Palenque; el coatí de 22 no la cruza. */
const PIPE_TILE = 28;
/** Columna a la que avanza el jugador: la cámara deja el coatí de 22 a más de 200 px por la izquierda. */
const AHEAD_TILE = 40;
const RETURN_TILE = 14;

/** Camina hacia la izquierda con entradas reales, saltando hoyos y columnas, hasta la columna dada. */
function walkBack(world: World, tile: number): void {
  const p = world.player, input = world.input;
  input.press('left');
  let lastX = p.x;
  for (let step = 0; step < MAX_STEPS && world.phase === 'play' && p.x > tile * T; step++) {
    const nearPit = p.x > 97 * T && p.x < 100 * T;
    const blocked = Math.abs(p.x - lastX) < 0.01;
    if ((nearPit || blocked) && p.onGround && !input.held.jump) input.press('jump');
    if (p.vy > 0) input.release('jump');
    lastX = p.x;
    world.update(STEP);
  }
  input.reset();
}

describe('reaparición y enemigos al volver atrás', () => {
  it('al reaparecer en el checkpoint conserva los enemigos del tramo anterior a una distancia segura', () => {
    // Organizar
    const world = make(true);
    const playerX = world.player.x;
    const before = world.level.enemies.filter(s => s.tx * T < playerX - SAFE_RESPAWN_GAP).length;

    // Actuar: nada; el constructor es la reaparición (Game.handleDeath -> spawn(true)).

    // Comprobar: los datos tienen coatíes detrás del checkpoint y ninguno nace encima del jugador.
    expect(before).toBeGreaterThan(0);
    expect(world.enemies.every(e => Math.abs(e.x - playerX) > SAFE_RESPAWN_GAP)).toBe(true);
    expect(aliveBefore(world, world.checkpointTile)).toBe(before);
  });

  it('tras reaparecer en el checkpoint, caminar hacia atrás encuentra los coatíes de 84 y 86', () => {
    // Organizar
    const world = make(true);
    world.player.inv = 999; // contacto protegido: solo interesa qué enemigos existen

    // Actuar
    walkBack(world, BACKTRACK_TILE);

    // Comprobar
    expect(world.phase).toBe('play');
    expect(world.player.x).toBeLessThanOrEqual(BACKTRACK_TILE * T);
    expect(world.camX).toBeLessThan(BACKTRACK_TILE * T);
    expect(aliveBefore(world, 95)).toBeGreaterThan(0);
  });

  it('un enemigo que la cámara deja atrás sigue existiendo al volver a por él', () => {
    // Organizar: primera vida; el coatí de 22 (encerrado entre el inicio y la columna 28) está activo.
    const world = make(false);
    world.player.inv = 999;
    world.update(STEP);
    expect(aliveBefore(world, PIPE_TILE)).toBe(1);

    // Actuar: el jugador lo deja atrás (como al saltarlo y seguir) y luego regresa caminando.
    world.player.x = AHEAD_TILE * T + 4;
    world.player.y = GROUND * T - world.player.h;
    for (let i = 0; i < 60; i++) world.update(STEP);
    walkBack(world, RETURN_TILE);

    // Comprobar: la cámara ha vuelto al tramo, y el coatí, que solo se desactivó al salir por la izquierda, despierta al volver.
    expect(world.phase).toBe('play');
    expect(world.camX).toBeLessThan(RETURN_TILE * T);
    expect(aliveBefore(world, PIPE_TILE)).toBe(1);
  });
});
