import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../../data/worlds';
import { BOSS_PRESENTATIONS } from '../../data/bossPresentation';
import { AudioEngine } from '../../engine/audio';
import { T } from '../../engine/constants';
import { hudKey } from '../../engine/hud';
import { Input } from '../../engine/input';
import { World } from '../../engine/World';
import { BossBanner } from './BossBanner';

const bossLevels = ALL_LEVELS.filter(level => level.boss);

describe('Presentación de jefes', () => {
  it.each(bossLevels)('$id anuncia al jefe del nivel con su propio retrato y consejo', def => {
    const audio = new AudioEngine(); audio.muted = true;
    const world = new World({ def, audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
    const config = def.boss!;
    world.player.x = (config.arena[0] + 2) * T;
    world.update(1 / 120);
    const hud = world.hudState(0);
    expect(hud.boss?.id).toBe(config.id);
    expect(hud.boss?.intro).toBe(true);
    const presentation = BOSS_PRESENTATIONS[config.id];
    const markup = renderToStaticMarkup(<BossBanner boss={hud.boss!} />);
    expect(markup).toContain(presentation.image);
    expect(markup).toContain(presentation.hint);
    expect(markup).toContain(presentation.arena);
    if (config.id !== 'puas') expect(markup).not.toContain('jefe_grande.webp');
    if (presentation.frame) expect(markup).toContain(`viewBox="${presentation.frame.join(' ')}"`);
  });

  it('publica el cambio de identidad aunque coincidan vida y estado', () => {
    const audio = new AudioEngine(); audio.muted = true;
    const world = new World({ def: bossLevels[0], audio, input: new Input(), session: { score: 0, coins: 0, lives: 3 } });
    const hud = world.hudState(0);
    const boss = { id: 'puas', name: 'Púas', hp: 6, maxHp: 6, intro: true } as const;
    expect(hudKey({ ...hud, boss })).not.toBe(hudKey({ ...hud, boss: { ...boss, id: 'kaiman' } }));
  });

  it('mantiene la barra de vida accesible después del anuncio', () => {
    const markup = renderToStaticMarkup(<BossBanner boss={{ id: 'huayPek', name: 'Huay Pek', hp: 3, maxHp: 6, intro: false }} />);
    expect(markup).toContain('aria-valuenow="3"');
    expect(markup).toContain('width:50%');
    expect(markup).not.toContain('boss-intro__img');
  });
});
