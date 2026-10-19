import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMPTY_PROGRESS } from '../../../store/progress';
import { fitMapView, FULL_MAP, type MapView } from './mapModel';
import { MapChart } from './MapChart';

const VIEWPORT = { width: 1440, height: 900 };

function render(base: MapView, closeView = false, zoomHidden = false): string {
  return renderToStaticMarkup(createElement(MapChart, {
    progress: EMPTY_PROGRESS, base, frameKey: 0, selected: '1-1', closeView,
    viewport: VIEWPORT, sidePanel: 0, zoomHidden, onSelect: () => undefined,
  }));
}

describe('MapChart', () => {
  it('pinta el encuadre base como viewBox del dibujo', () => {
    const base = fitMapView(FULL_MAP, VIEWPORT.width, VIEWPORT.height);
    const html = render(base);
    expect(html).toContain(`viewBox="${base.x} ${base.y} ${base.width} ${base.height}"`);
    expect(html).toContain('data-map-view="peninsula"');
  });

  it('declara la carta como región enfocable con instrucciones en español', () => {
    const html = render(fitMapView(FULL_MAP, VIEWPORT.width, VIEWPORT.height));
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Carta de la península"');
    expect(html).toContain('data-map-camera="encuadre"');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('Arrastra o usa las flechas para desplazarte; rueda, pellizco o + y − para acercar; 0 reencuadra');
    expect(html).not.toContain('data-gesture');
  });

  it('incluye los controles de acercamiento fuera del atlas', () => {
    const html = render(fitMapView(FULL_MAP, VIEWPORT.width, VIEWPORT.height));
    expect(html.indexOf('map-zoom')).toBeGreaterThan(html.indexOf('atlas__scale'));
    expect(html).toContain('aria-label="Acercar el mapa"');
  });

  it('muestra una ayuda de teclado breve que solo aparece con el foco', () => {
    const html = render(fitMapView(FULL_MAP, VIEWPORT.width, VIEWPORT.height));
    expect(html).toContain('Flechas: mover · + −: zoom · 0: reencuadrar');
  });

  it('no monta los controles de zoom cuando el panel los tapa', () => {
    const html = render(fitMapView(FULL_MAP, VIEWPORT.width, VIEWPORT.height), false, true);
    expect(html).not.toContain('map-zoom');
  });
});
