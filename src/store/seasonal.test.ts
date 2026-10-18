import { afterEach, describe, expect, it } from 'vitest';
import { HANAL_PIXAN_LEVEL } from '../data/levels/seasonal/hanal-pixan';
import { useAppStore } from './appStore';
import { EMPTY_PROGRESS } from './progress';
import { DEFAULT_SETTINGS } from './settings';

const original = useAppStore.getState();
afterEach(() => useAppStore.setState(original));

describe('Partidas del especial', () => {
  it('entra sin boleto y conserva el prólogo pendiente', () => {
    useAppStore.setState({ progress: EMPTY_PROGRESS, settings: { ...DEFAULT_SETTINGS, introSeen: false } });
    useAppStore.getState().startLevel(HANAL_PIXAN_LEVEL.id);
    expect(useAppStore.getState().screen).toBe('game');
    expect(useAppStore.getState().run?.levelId).toBe(HANAL_PIXAN_LEVEL.id);
    expect(useAppStore.getState().settings.introSeen).toBe(false);
  });

  it('continúa tras el prólogo conservando los puntos y vidas del especial', () => {
    useAppStore.setState({ progress: EMPTY_PROGRESS, settings: { ...DEFAULT_SETTINGS, introSeen: false } });
    const session = { score: 1200, coins: 20, lives: 4 };
    useAppStore.getState().playIntro('1-1', session);
    session.lives = 1;
    useAppStore.getState().finishIntro();
    expect(useAppStore.getState().screen).toBe('game');
    expect(useAppStore.getState().run?.session.lives).toBe(4);
    expect(useAppStore.getState().run?.session.score).toBe(1200);
    expect(useAppStore.getState().introCarry).toBeNull();
  });
});
