import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlessingCard } from './OfferingScreen';

describe('Ofertas de Ek Chuah', () => {
  it('explica cuánto cacao falta y desactiva compras sin fondos', () => {
    const html = renderToStaticMarkup(<BlessingCard id="fire" balance={12} purchased={false} onBuy={() => undefined} />);
    expect(html).toContain('cacao insuficiente');
    expect(html).toContain('Te faltan 18 cacao');
    expect(html).toContain('disabled=""');
  });

  it('permite comprar con el saldo exacto y muestra el precio accesible', () => {
    const html = renderToStaticMarkup(<BlessingCard id="life" balance={50} purchased={false} onBuy={() => undefined} />);
    expect(html).toContain('Comprar Corazón de jade por 50 cacao');
    expect(html).not.toContain('disabled');
  });

  it('marca las bendiciones recibidas para que no se compren otra vez', () => {
    const html = renderToStaticMarkup(<BlessingCard id="shield" balance={120} purchased onBuy={() => undefined} />);
    expect(html).toContain('Escudo de jade: recibida');
    expect(html).toContain('disabled=""');
  });
});
