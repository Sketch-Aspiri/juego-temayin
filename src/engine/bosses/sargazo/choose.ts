import { pickWeighted } from '../shared/pickWeighted';
import { MAX_WITHOUT_RESCUE, NEAR_DISTANCE, type SeaPhase } from './tuning';

export type SeaAttack = 'salvo' | 'tide' | 'surge' | 'whirlpool' | 'rain' | 'net';
const ATTACKS: Readonly<Record<SeaPhase, readonly SeaAttack[]>> = {
  1: ['salvo', 'tide'],
  2: ['salvo', 'tide', 'surge', 'whirlpool'],
  3: ['salvo', 'tide', 'surge', 'whirlpool', 'rain'],
  4: ['salvo', 'tide', 'surge', 'whirlpool', 'rain'],
};
const NEAR: Readonly<Record<SeaAttack, number>> = { salvo: 1, tide: 0.8, surge: 1.6, whirlpool: 1.5, rain: 0.8, net: 1 };
const FAR: Readonly<Record<SeaAttack, number>> = { salvo: 1.7, tide: 1.4, surge: 0.8, whirlpool: 0.7, rain: 1.2, net: 1 };

export function chooseAttack(phase: SeaPhase, last: SeaAttack | null, sinceRescue: number, distance: number, rng: () => number): SeaAttack {
  if (sinceRescue >= MAX_WITHOUT_RESCUE && last !== 'net') return 'net';
  return pickWeighted(ATTACKS[phase], distance < NEAR_DISTANCE ? NEAR : FAR, last, rng);
}
