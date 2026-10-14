import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CINEMATICS } from '../../data/cinematics';
import { HistoryCard } from './HistoryScreen';

describe('Tarjetas de Historia', () => {
  it('explica el requisito y desactiva la reproducción de capítulos bloqueados', () => {
    const html = renderToStaticMarkup(<HistoryCard cinematic={CINEMATICS['puas-victory']} unlocked={false} onPlay={() => undefined} />);
    expect(html).toContain('Completa 1-6 · Escárcega para verla.');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Bloqueada: El primer tramo libre"');
  });

  it('permite reproducir un capítulo disponible con un nombre accesible único', () => {
    const html = renderToStaticMarkup(<HistoryCard cinematic={CINEMATICS['puas-victory']} unlocked onPlay={() => undefined} />);
    expect(html).toContain('aria-label="Ver: El primer tramo libre"');
    expect(html).toContain('4 escenas');
    expect(html).not.toContain('disabled');
  });
});
