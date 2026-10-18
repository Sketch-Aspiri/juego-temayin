import { useState } from 'react';
import { BLESSINGS } from '../../data/offerings';
import { MAX_BLESSING_QUANTITY, type BlessingId } from '../../engine/blessings';
import { SpriteFrame } from './SpriteFrame';

interface BlessingCardProps {
  id: BlessingId;
  balance: number;
  purchased: number;
  onBuy: (id: BlessingId, quantity: number) => void;
}

export function BlessingCard({ id, balance, purchased, onBuy }: BlessingCardProps) {
  const blessing = BLESSINGS[id];
  const [selected, setSelected] = useState(1);
  const maximum = Math.max(1, Math.min(MAX_BLESSING_QUANTITY, Math.floor(balance / blessing.price)));
  const quantity = blessing.repeatable ? Math.min(selected, maximum) : 1;
  const total = blessing.price * quantity;
  const affordable = balance >= total;
  const received = purchased > 0 && !blessing.repeatable;
  const label = quantity > 1 ? `${quantity} vidas extra` : blessing.name;
  return <article className={`blessing blessing--${id}${purchased > 0 ? ' blessing--bought' : ''}`}>
    <div className="blessing__symbol" aria-hidden="true"><SpriteFrame sprite={blessing.sprite} className="blessing__sprite" /></div>
    <div className="blessing__text">
      <h2>{blessing.name}</h2><p>{blessing.description}</p>
      {blessing.repeatable && <label className="blessing__quantity">Cantidad de vidas
        <select aria-label="Cantidad de vidas" value={quantity} disabled={!affordable}
          onChange={event => setSelected(Number(event.target.value))}>
          {Array.from({ length: maximum }, (_, index) => index + 1).map(count =>
            <option key={count} value={count}>{count} {count === 1 ? 'vida' : 'vidas'}</option>)}
        </select>
      </label>}
      {blessing.repeatable && purchased > 0 && <p className="blessing__received">{purchased} {purchased === 1 ? 'vida lista' : 'vidas listas'} para comenzar</p>}
    </div>
    <button type="button" disabled={received || !affordable} onClick={() => onBuy(id, quantity)}
      aria-label={received ? `${blessing.name}: recibida` : `Comprar ${label} por ${total} cacao${affordable ? '' : ': cacao insuficiente'}`}>
      {received ? '✓ Recibida' : <><strong>{total}</strong><span>cacao</span></>}
    </button>
    {!affordable && !received && <span className="blessing__shortage">Te faltan {total - balance} cacao</span>}
  </article>;
}
