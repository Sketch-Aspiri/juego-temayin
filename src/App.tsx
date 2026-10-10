import { useEffect, useState } from 'react';
import { audio } from './engine/audio';
import { loadAssets, type Assets } from './engine/assets';
import { warmArt } from './engine/render/artCache';
import { useAppStore } from './store/appStore';
import { AssetsContext } from './ui/assetsContext';
import { GameScreen } from './ui/screens/GameScreen';
import { LevelSelect } from './ui/screens/LevelSelect';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { TitleScreen } from './ui/screens/TitleScreen';

export function App() {
  const screen = useAppStore((s) => s.screen);
  const settings = useAppStore((s) => s.settings);
  const [assets, setAssets] = useState<Assets | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAssets().then((a) => {
      if (cancelled) return;
      setAssets(a);
      warmArt();
      useAppStore.getState().go('title');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // El motor de audio es un singleton: se sincroniza con los ajustes guardados.
  useEffect(() => {
    audio.muted = settings.muted;
    audio.volume = settings.volume;
  }, [settings.muted, settings.volume]);

  if (!assets || screen === 'loading') {
    return (
      <div className="loading" role="status">
        <div className="loading__spinner" />
        <p>Cargando la selva…</p>
      </div>
    );
  }

  return (
    <AssetsContext.Provider value={assets}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'levels' && <LevelSelect />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'game' && <GameScreen />}
    </AssetsContext.Provider>
  );
}
