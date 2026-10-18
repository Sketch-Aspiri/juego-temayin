import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORLDS } from '../../data/worlds';
import { EMPTY_PROGRESS, isUnlocked, recordTicket } from '../../store/progress';
import { LevelTile } from './LevelSelect';
import { LevelComplete } from '../components/Overlays';

describe('Desvíos en el selector', () => {
  it('oculta el destino y explica cómo abrirlo; muestra su nombre al encontrar el boleto', () => {
    const world = WORLDS[0];
    const locked = renderToStaticMarkup(<LevelTile level={world.bonus!} bonus unlocked={false} onPlay={() => undefined} />);
    expect(locked).toContain('disabled');
    expect(locked).toContain('Destino secreto');
    expect(locked).not.toContain(world.bonus!.name);
    expect(locked).toContain('Encuentra el boleto de este mundo');
    const progress = recordTicket(EMPTY_PROGRESS, world.id);
    const open = renderToStaticMarkup(<LevelTile level={world.bonus!} bonus unlocked={isUnlocked(progress, world.bonus!.id)} onPlay={() => undefined} />);
    expect(open).not.toContain('disabled');
    expect(open).toContain(world.bonus!.name);
    expect(open).toContain('Boleto encontrado');
  });

  it('terminar un secreto invita a volver al mapa y no anuncia el fin de la campaña', () => {
    const html = renderToStaticMarkup(<LevelComplete levelName="Secreto" hasNext={false} isBonus
      result={{ levelId: '1-extra', score: 100, stars: 1, coinRatio: 0.2, deaths: 0,
        session: { score: 100, coins: 1, lives: 3 } }}
      onNext={() => undefined} onRetry={() => undefined} onExit={() => undefined} />);
    expect(html).toContain('Volver al mapa');
    expect(html).not.toContain('toda la aventura');
    expect(html).not.toContain('Siguiente nivel');
  });
});
