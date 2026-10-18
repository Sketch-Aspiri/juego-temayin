import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlessingCard } from './OfferingScreen';

describe('Ofertas de Ek Chuah', () => {
  it('explica cuánto cacao falta y desactiva compras sin fondos', () => {
    const html = renderToStaticMarkup(<BlessingCard id="fire" balance={12} purchased={0} onBuy={() => undefined} />);
    expect(html).toContain('cacao insuficiente');
    expect(html).toContain('Te faltan 18 cacao');
    expect(html).toContain('disabled=""');
  });

  it('permite comprar con el saldo exacto y muestra el precio accesible', () => {
    const html = renderToStaticMarkup(<BlessingCard id="life" balance={50} purchased={0} onBuy={() => undefined} />);
    expect(html).toContain('Comprar Corazón de jade por 50 cacao');
    expect(html).not.toContain('disabled');
  });

  it('marca las bendiciones recibidas para que no se compren otra vez', () => {
    const html = renderToStaticMarkup(<BlessingCard id="shield" balance={120} purchased={1} onBuy={() => undefined} />);
    expect(html).toContain('Escudo de jade: recibida');
    expect(html).toContain('disabled=""');
  });

  it('permite seguir comprando vidas y muestra las que ya están pagadas', () => {
    const html = renderToStaticMarkup(<BlessingCard id="life" balance={150} purchased={2} onBuy={() => undefined} />);
    expect(html).toContain('Cantidad de vidas');
    expect(html).toContain('3 vidas</option>');
    expect(html).toContain('2 vidas listas para comenzar');
    expect(html).not.toContain('disabled');
  });

  it.each(['fire', 'shield', 'life'] as const)('muestra el sprite de %s del atlas de objetos', id => {
    const html = renderToStaticMarkup(<BlessingCard id={id} balance={150} purchased={0} onBuy={() => undefined} />);
    expect(html).toContain('objetos/objetos.webp');
    expect(html).toContain('blessing__sprite');
  });
});
