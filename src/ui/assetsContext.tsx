import { createContext, useContext } from 'react';
import type { Assets } from '../engine/assets';

export const AssetsContext = createContext<Assets | null>(null);

export function useAssets(): Assets {
  const assets = useContext(AssetsContext);
  if (!assets) throw new Error('useAssets debe usarse dentro de <AssetsContext.Provider>');
  return assets;
}
