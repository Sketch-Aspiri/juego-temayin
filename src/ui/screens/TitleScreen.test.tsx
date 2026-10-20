import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TitleScreen } from './TitleScreen';

describe('Menú principal', () => {
  it('ofrece Cómo jugar como cuarto botón y deja las notas fuera del flujo del menú', () => {
    const html = renderToStaticMarkup(<TitleScreen />);
    const menu = html.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
    const buttons = [...menu.matchAll(/<button[^>]*>(.*?)<\/button>/gs)].map(match => match[1]);
    expect(buttons).toEqual(['Jugar', 'Historia', 'Cuaderno de Toh', 'Cómo jugar', 'Ajustes']);
    expect(html).not.toContain('title__controls');
    expect(html).toContain('title__version-popover');
  });
});
