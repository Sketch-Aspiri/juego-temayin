import { describe, expect, it } from 'vitest';
import { AudioEngine } from '../../../engine/audio';
import { START_LIVES, STEP, T } from '../../../engine/constants';
import { Input } from '../../../engine/input';
import { buildLevel } from '../../../engine/level/build';
import { World } from '../../../engine/World';
import { getLevel } from '../../worlds';

/** Fila de los granos sueltos del último vagón. */
const COIN_ROW = 9;
/** Columna desde la que arranca la carrera: justo antes del primer grano del último vagón. */
const RUN_START_COLUMN = 227;
const MAX_SECONDS = 10;

describe('Tulum Aeropuerto (6-2): cacao del último vagón', () => {
  it('quien corre por el último vagón recoge todo el cacao hasta la bandera antes de terminar', () => {
    // Organizar: sin enemigos, con el cuerpo fijo en la fila del cacao.
    const def = getLevel('6-2');
    if (!def) throw Error('Falta el nivel 6-2');
    const lvl = buildLevel(def);
    const expected = lvl.grid[COIN_ROW].filter((c, tx) => c === 'o' && tx >= RUN_START_COLUMN && tx <= lvl.flagX).length;
    const audio = new AudioEngine();
    audio.muted = true;
    const w = new World({ def, input: new Input(), audio, fromCheckpoint: false, session: { score: 0, coins: 0, lives: START_LIVES } });
    w.enemies = [];
    w.player.x = RUN_START_COLUMN * T;
    w.player.inv = Infinity;
    w.camX = w.player.x - 300;
    w.input.press('right');
    w.input.press('run');
    // Actuar
    for (let t = 0; t < MAX_SECONDS && w.phase === 'play'; t += STEP) {
      w.player.y = COIN_ROW * T;
      w.player.vy = 0;
      w.update(STEP);
    }
    // Comprobar
    expect(expected).toBeGreaterThan(0);
    expect(w.phase).not.toBe('play');
    expect(w.coinsCollected).toBe(expected);
  });
});
