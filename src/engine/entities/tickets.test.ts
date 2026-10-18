import { describe, expect, it } from 'vitest';
import { getLevel } from '../../data/worlds';
import { AudioEngine } from '../audio';
import { STEP, T } from '../constants';
import { hudKey } from '../hud';
import { Input } from '../input';
import type { LevelDef } from '../level/types';
import { World } from '../World';

const def: LevelDef = { id: 'prueba', name: 'Boleto', theme: 'jungle', width: 80,
  ops: [['coins', 8, 10, 2], ['ticket', 12, 11], ['flag', 65]] };
const make = (level = def, ticketCollected = false) => new World({ def: level, input: new Input(),
  audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 }, ticketCollected });

describe('Boleto en el motor', () => {
  it('solo se recoge por contacto durante el juego y no altera el cacao ni las estrellas', () => {
    const w = make();
    w.update(STEP);
    expect(w.ticketCollected).toBe(false);
    const before = hudKey(w.hudState(1));
    w.player.x = 12 * T; w.update(STEP);
    expect(w.ticketCollected).toBe(true);
    expect(hudKey(w.hudState(1))).not.toBe(before);
    expect(w.session.coins).toBe(0);
    expect(w.coinsCollected).toBe(0);
    expect(w.level.totalCoins).toBe(2);
    w.update(STEP);
    expect(w.popups.filter(p => p.txt.includes('Boleto'))).toHaveLength(1);
  });

  it('no concede el boleto durante una muerte y no lo vuelve a conceder si ya estaba guardado', () => {
    const w = make(); w.player.x = 12 * T; w.die(); w.update(STEP);
    expect(w.ticketCollected).toBe(false);
    const known = make(def, true); known.player.x = 12 * T; known.update(STEP);
    expect(known.ticketCollected).toBe(true);
    expect(known.popups).toHaveLength(0);
  });

  it.each([
    ['1-3', 65.1, 3, true], ['2-2', 45, 7, true], ['3-3', 50, 3, true],
    ['4-3', 51, 8, false], ['5-4', 55, 8, false], ['6-4', 72, 8, true],
  ] as const)('%s permite llegar al boleto desde su plataforma o desde el agua', (id, x, feet, ground) => {
    const w = make(getLevel(id)!);
    const p = w.player;
    p.x = x * T; p.y = feet * T - p.h; p.onGround = ground; p.inv = 10;
    w.camX = Math.max(0, p.x - 400);
    const startY = p.y;
    for (let step = 0; step < 360 && !w.ticketCollected; step++) {
      if (step % 36 === 0) w.input.press('jump');
      if (step % 36 === 30) w.input.release('jump');
      if (id === '1-3') w.input.press('right');
      w.update(STEP);
    }
    expect(w.phase).toBe('play');
    expect(w.ticketCollected, `${id}: y inicial ${startY / T}, final ${p.y / T}`).toBe(true);
  });
});
