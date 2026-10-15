import { useEffect, useRef, useState } from 'react';
import { BLESSINGS, EK_CHUAH } from '../../data/offerings';
import { getLevel } from '../../data/worlds';
import type { BlessingId } from '../../engine/blessings';
import { VH } from '../../engine/constants';
import type { LevelDef } from '../../engine/level/types';
import { OfferingScene } from '../../engine/OfferingScene';
import { PORTRAIT_VIEW_WIDTH } from '../../engine/render/viewport';
import { useAppStore } from '../../store/appStore';
import { useAssets } from '../assetsContext';
import '../offering.css';

function OfferingStage({ level }: { level: LevelDef }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const assets = useAssets();
  useEffect(() => {
    if (!canvas.current) return;
    const scene = new OfferingScene(canvas.current, assets, level);
    let frame = 0;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (now: number): void => { scene.render(motion.matches ? 0 : now); frame = requestAnimationFrame(draw); };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [assets, level]);
  return <div className="offering__scene">
    <div className="offering__station">{level.id} · {level.name}</div>
    <canvas ref={canvas} width={PORTRAIT_VIEW_WIDTH} height={VH} role="img" aria-label="Ek Chuah ofrece cacao junto a Temayin en un altar de jade" />
    <p className="offering__caption">Una ayuda antes del siguiente tramo</p>
  </div>;
}

interface BlessingCardProps {
  id: BlessingId;
  balance: number;
  purchased: boolean;
  onBuy: (id: BlessingId) => void;
}

export function BlessingCard({ id, balance, purchased, onBuy }: BlessingCardProps) {
  const blessing = BLESSINGS[id];
  const affordable = balance >= blessing.price;
  return <article className={`blessing blessing--${id}${purchased ? ' blessing--bought' : ''}`}>
    <span className="blessing__symbol" aria-hidden="true">{blessing.symbol}</span>
    <div className="blessing__text"><h2>{blessing.name}</h2><p>{blessing.description}</p></div>
    <button type="button" disabled={purchased || !affordable} onClick={() => onBuy(id)}
      aria-label={purchased ? `${blessing.name}: recibida` : `Comprar ${blessing.name} por ${blessing.price} cacao${affordable ? '' : ': cacao insuficiente'}`}>
      {purchased ? '✓ Recibida' : <><strong>{blessing.price}</strong><span>cacao</span></>}
    </button>
    {!affordable && !purchased && <span className="blessing__shortage">Te faltan {blessing.price - balance} cacao</span>}
  </article>;
}

export function OfferingScreen() {
  const run = useAppStore(s => s.run);
  const wallet = useAppStore(s => s.wallet);
  const { buyBlessing, continueOffering, go } = useAppStore.getState();
  const [message, setMessage] = useState('Tu cacao se guarda entre niveles, incluso si pierdes una vida.');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.code === 'Escape') { event.preventDefault(); continueOffering(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [continueOffering]);
  const level = run && getLevel(run.levelId);
  if (!level?.offering) return null;
  const purchased = wallet.pending[level.id] ?? [];
  const buy = (id: BlessingId): void => {
    if (buyBlessing(id)) setMessage(`${BLESSINGS[id].name} recibida. La llevarás al comenzar el nivel.`);
  };
  return <main className="offering" aria-labelledby="offering-title">
    <div className="offering__layout">
      <OfferingStage level={level} />
      <section className="offering__panel">
        <header className="offering__header">
          <div><p className="offering__eyebrow">{EK_CHUAH.title}</p><h1 id="offering-title" ref={heading} tabIndex={-1}>{EK_CHUAH.name}</h1></div>
          <div className="offering__wallet" aria-label={`Bolsa: ${wallet.cacao} cacao`}><span>Tu bolsa</span><strong>{wallet.cacao}</strong><span>cacao</span></div>
        </header>
        <p className="offering__greeting">«{EK_CHUAH.greeting}»</p>
        <div className="offering__offers">{level.offering.offers.map(id =>
          <BlessingCard key={id} id={id} balance={wallet.cacao} purchased={purchased.includes(id)} onBuy={buy} />)}</div>
        <p className="offering__message" role="status">{message}</p>
        <p className="offering__note">{EK_CHUAH.note}</p>
        <button type="button" className="btn btn--primary offering__continue" onClick={continueOffering}>Continuar la aventura <span aria-hidden="true">→</span></button>
        <button type="button" className="offering__back" onClick={() => go('levels')}>Volver al mapa</button>
        <p className="offering__fiction">Personaje inspirado en la tradición maya. Las bendiciones son fantasía de esta aventura.</p>
      </section>
    </div>
  </main>;
}
