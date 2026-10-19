import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapZoomControls } from './MapZoomControls';

const noop = () => undefined;

function render(overrides: Partial<Parameters<typeof MapZoomControls>[0]> = {}): string {
  return renderToStaticMarkup(createElement(MapZoomControls, {
    canZoomIn: true, canZoomOut: true, customized: true, onZoomIn: noop, onZoomOut: noop, onReset: noop, ...overrides,
  }));
}

/** Devuelve la etiqueta de apertura del botón con esa etiqueta accesible. */
function buttonTag(html: string, label: string): string {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0] ?? '';
}

describe('MapZoomControls', () => {
  it('agrupa tres botones con etiquetas en español', () => {
    const html = render();
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Acercamiento del mapa"');
    expect(html.match(/<button/g)).toHaveLength(3);
    for (const label of ['Acercar el mapa', 'Alejar el mapa', 'Reencuadrar el mapa']) expect(buttonTag(html, label)).not.toBe('');
    expect(buttonTag(html, 'Acercar el mapa')).not.toContain('aria-disabled');
  });

  it('añade un título que desambigua cada botón', () => {
    const html = render();
    expect(buttonTag(html, 'Acercar el mapa')).toContain('title="Acercar"');
    expect(buttonTag(html, 'Alejar el mapa')).toContain('title="Alejar"');
    expect(buttonTag(html, 'Reencuadrar el mapa')).toContain('title="Volver al encuadre"');
  });

  it('deshabilita acercar al llegar al tope de acercamiento', () => {
    const html = render({ canZoomIn: false });
    expect(buttonTag(html, 'Acercar el mapa')).toContain('aria-disabled="true"');
    expect(buttonTag(html, 'Alejar el mapa')).not.toContain('aria-disabled="true"');
  });

  it('deshabilita alejar al llegar al tope de alejamiento', () => {
    expect(buttonTag(render({ canZoomOut: false }), 'Alejar el mapa')).toContain('aria-disabled="true"');
  });

  it('deshabilita reencuadrar mientras la cámara sigue el encuadre', () => {
    expect(buttonTag(render({ customized: false }), 'Reencuadrar el mapa')).toContain('aria-disabled="true"');
    expect(buttonTag(render({ customized: true }), 'Reencuadrar el mapa')).not.toContain('aria-disabled="true"');
  });
});
