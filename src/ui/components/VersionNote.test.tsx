import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VersionNote } from './VersionNote';

const info = {
  commit: 'e4e120e76da41ae44ba5dafedc33cd2fdf7fb88a',
  summary: 'Mejora el suelo de pantanos y manglares',
  changes: ['Añade 24 sprites de pasto y tierra.', 'Conserva las orillas.'],
} as const;

describe('Nota de versión del menú principal', () => {
  it('identifica la compilación publicada y permite consultar sus cambios', () => {
    const markup = renderToStaticMarkup(<VersionNote info={info} production />);
    expect(markup).toContain('Versión desplegada');
    expect(markup).toContain('commit e4e120e');
    expect(markup).toContain(`title="Commit ${info.commit}"`);
    expect(markup).toContain(info.summary);
    expect(markup).toContain('<details');
    expect(markup).toContain(info.changes[0]);
    expect(markup).toContain(info.changes[1]);
  });

  it('distingue una versión local de una publicación', () => {
    const markup = renderToStaticMarkup(<VersionNote info={info} production={false} />);
    expect(markup).toContain('Versión local');
    expect(markup).not.toContain('Versión desplegada');
  });

  it('muestra el estado desconocido sin un commit ficticio ni detalles vacíos', () => {
    const markup = renderToStaticMarkup(<VersionNote info={{ commit: null, summary: 'Información de versión no disponible.', changes: [] }} production />);
    expect(markup).toContain('Información de versión no disponible.');
    expect(markup).not.toContain('<code');
    expect(markup).not.toContain('<details');
  });

  it('trata el texto del commit como contenido y no como HTML ejecutable', () => {
    const markup = renderToStaticMarkup(<VersionNote info={{ ...info, summary: '<script>texto</script>' }} />);
    expect(markup).toContain('&lt;script&gt;texto&lt;/script&gt;');
    expect(markup).not.toContain('<script>');
  });
});
