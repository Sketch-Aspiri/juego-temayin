import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotebookNumerals } from './NotebookNumerals';

describe('Ilustraciones del códice', () => {
  it('dibuja dos puntos arriba y tres abajo para representar 43, con su valor accesible', () => {
    const html = renderToStaticMarkup(<NotebookNumerals entryId="codice-cuarenta-tres" title="Dos veintenas y tres unidades" />);
    expect(html.match(/cy="25"/g)).toHaveLength(2);
    expect(html.match(/cy="79"/g)).toHaveLength(3);
    expect(html).toContain('>43</text>');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Ejemplo de numeración maya: Dos veintenas y tres unidades"');
  });

  it('representa el cero con una concha y cinco unidades con una raya', () => {
    const zero = renderToStaticMarkup(<NotebookNumerals entryId="codice-cero" title="La concha" />);
    expect(zero.match(/<ellipse/g)).toHaveLength(1);
    expect(zero).not.toContain('<circle');
    const five = renderToStaticMarkup(<NotebookNumerals entryId="codice-cinco" title="Cinco puntos, una raya" />);
    expect(five.match(/<rect/g)).toHaveLength(3);
    expect(five.match(/<circle/g)).toHaveLength(5);
  });

  it('no inventa una ilustración numérica para una página de campo', () => {
    expect(renderToStaticMarkup(<NotebookNumerals entryId="boca-farallones" title="El cañón" />)).toBe('');
  });
});
