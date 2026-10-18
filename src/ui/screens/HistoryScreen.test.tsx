import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_CINEMATICS, CINEMATICS } from '../../data/cinematics';
import { getLevel } from '../../data/worlds';
import { HistoryCard } from './HistoryScreen';

describe('Tarjetas de Historia', () => {
  it.each(ALL_CINEMATICS.filter(cinematic => cinematic.afterLevel))('$title muestra el requisito de su jefe y admite repetición', cinematic => {
    const locked = renderToStaticMarkup(<HistoryCard cinematic={cinematic} unlocked={false} onPlay={() => undefined} />);
    const available = renderToStaticMarkup(<HistoryCard cinematic={cinematic} unlocked onPlay={() => undefined} />);
    expect(locked).toContain(`Completa ${cinematic.afterLevel} · ${getLevel(cinematic.afterLevel!)?.name} para verla.`);
    expect(locked).toContain('disabled=""');
    expect(available).not.toContain('disabled');
    expect(available).toContain(`data-cinematic="${cinematic.id}"`);
    expect(available).toContain('4 escenas');
  });

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
