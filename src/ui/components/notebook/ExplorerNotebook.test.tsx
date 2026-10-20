import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NOTEBOOK_ENTRIES } from '../../../data/explorerNotebook';
import { EMPTY_PROGRESS } from '../../../store/progress';
import { NotebookCollection } from './ExplorerNotebook';
import { NotebookPage } from './NotebookPage';
import { recordDiscoveries } from '../../../store/explorerNotebook';

describe('Lectura del cuaderno', () => {
  it('las páginas pendientes indican el nivel sin revelar el título', () => {
    const html = renderToStaticMarkup(<NotebookCollection progress={EMPTY_PROGRESS} entries={NOTEBOOK_ENTRIES} onSelect={() => undefined} />);
    expect(html.match(/disabled/g)).toHaveLength(NOTEBOOK_ENTRIES.length);
    expect(html).toContain('Explora el nivel 1-1');
    expect(html).not.toContain('El Palacio de Palenque');
  });

  it('distingue páginas encontradas, nuevas y seleccionadas', () => {
    const progress = recordDiscoveries(EMPTY_PROGRESS, ['palenque-palacio', 'palenque-orquideas']);
    const html = renderToStaticMarkup(<NotebookCollection progress={{ ...progress, readDiscoveries: ['palenque-palacio'] }}
      selected="palenque-palacio" entries={NOTEBOOK_ENTRIES} onSelect={() => undefined} />);
    expect(html.match(/disabled/g)).toHaveLength(NOTEBOOK_ENTRIES.length - 2);
    expect(html.match(/<em>Nueva<\/em>/g)).toHaveLength(1);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('El Palacio de Palenque');
  });

  it.each(NOTEBOOK_ENTRIES.filter(entry => entry.place !== 'Códice maya'))('$id conserva fuentes, créditos y su propia fotografía real', entry => {
    const html = renderToStaticMarkup(<NotebookPage entry={entry} />);
    expect(html).toContain('Fuentes para seguir explorando');
    expect(html).toContain(`/assets/cuaderno/fotos/${entry.id}.webp`);
    expect(html).toContain('Foto:');
    expect(html).toContain('creativecommons.org');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Fotografía real.');
  });

  it.each(NOTEBOOK_ENTRIES.filter(entry => entry.place === 'Códice maya'))('$id muestra el códice con fuentes y sin fotografía', entry => {
    const html = renderToStaticMarkup(<NotebookPage entry={entry} />);
    expect(html).toContain('Fuentes para seguir explorando');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('Lo que descubriste');
  });
});
