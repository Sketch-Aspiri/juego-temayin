import { describe, expect, it } from 'vitest';
import { HANAL_PIXAN_LEVEL } from '../../data/levels/seasonal/hanal-pixan';
import type { HanalMotionId } from '../../data/hanalPixanPlayer';
import { AudioEngine } from '../audio';
import { Input } from '../input';
import type { Player } from '../entities/types';
import { World } from '../World';
import { hanalMotionId } from './hanalPlayer';

const make = () => new World({ def: HANAL_PIXAN_LEVEL, input: new Input(),
  audio: new AudioEngine(), session: { score: 0, coins: 0, lives: 3 } });

describe('Selección de movimientos del alebrije', () => {
  it.each([
    ['idle1', { onGround: true, animT: 0 }], ['idle2', { onGround: true, animT: 0.6 }],
    ['run1', { onGround: true, vx: 260, runT: 0 }], ['run2', { onGround: true, vx: 260, runT: 2 }],
    ['run3', { onGround: true, vx: -400, runT: 4 }], ['run4', { onGround: true, vx: 400, runT: 6 }],
    ['jump', { vy: -500 }], ['fall', { vy: 400 }], ['land', { onGround: true, land: 0.1 }],
    ['throw', { throwT: 0.1 }], ['hang', { swinging: 0, vx: 0 }], ['swing', { swinging: 0, vx: 100 }],
    ['swim1', { swimming: true }], ['swim2', { swimming: true, strokeT: 0.2 }], ['win', { anim: 'win' }],
  ] satisfies [HanalMotionId, Partial<Player>][])('%s tiene su propio recorte', (pose, patch) => {
    const w = make();
    Object.assign(w.player, patch);
    const before = structuredClone(w.player);
    expect(hanalMotionId(w)).toBe(pose);
    expect(w.player).toEqual(before);
  });

  it('la muerte y la celebración prevalecen sobre poderes y estados anteriores', () => {
    const w = make();
    Object.assign(w.player, { swimming: true, swinging: 0, throwT: 1, inv: 1 });
    w.phase = 'dying';
    expect(hanalMotionId(w)).toBe('death');
    w.phase = 'done';
    expect(hanalMotionId(w)).toBe('win');
  });
});
