import { getLevel } from '../data/worlds';
import { BLESSINGS } from '../data/offerings';
import type { BlessingId } from '../engine/blessings';

/** Las bendiciones pagadas esperan al jugador hasta que entre en su nivel. */
export interface Wallet {
  readonly cacao: number;
  readonly pending: Readonly<Record<string, readonly BlessingId[]>>;
}

export const EMPTY_WALLET: Wallet = { cacao: 0, pending: {} };

export const isCacao = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function sanitizeWallet(raw: unknown): Wallet {
  if (typeof raw !== 'object' || raw === null) return EMPTY_WALLET;
  const { cacao, pending } = raw as Record<string, unknown>;
  const clean: Record<string, readonly BlessingId[]> = {};
  if (typeof pending === 'object' && pending !== null && !Array.isArray(pending)) {
    for (const [id, values] of Object.entries(pending)) {
      const offers = getLevel(id)?.offering?.offers;
      if (!offers || !Array.isArray(values)) continue;
      const valid: BlessingId[] = [];
      for (const value of values) {
        const blessing = offers.find(offer => offer === value);
        if (blessing && (BLESSINGS[blessing].repeatable || !valid.includes(blessing))) valid.push(blessing);
      }
      if (valid.length) clean[id] = valid;
    }
  }
  return { cacao: isCacao(cacao) ? cacao : 0, pending: clean };
}
