export interface Assets {
  player: HTMLImageElement;
  boss: HTMLImageElement;
  bossBig: HTMLImageElement;
  urchin: HTMLImageElement;
  coati: HTMLImageElement;
  title: HTMLImageElement;
}

const MANIFEST: Readonly<Record<keyof Assets, string>> = {
  player: 'guepardo.png',
  boss: 'jefe.png',
  bossBig: 'jefe_grande.png',
  urchin: 'erizo.png',
  coati: 'coati.png',
  title: 'jaguar_titulo.png',
};

/** URL pública de una imagen del juego (respeta la ruta base de Vite). */
export const assetUrl = (file: string): string => `${import.meta.env.BASE_URL}assets/${file}`;

export const isReady = (img: HTMLImageElement): boolean => img.complete && img.naturalWidth > 0;

function loadImage(file: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    // Si una imagen falla el juego sigue; el renderer omite los sprites no listos.
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`No se pudo cargar ${file}`);
      resolve(img);
    };
    img.src = assetUrl(file);
  });
}

export async function loadAssets(): Promise<Assets> {
  const entries = await Promise.all(
    (Object.entries(MANIFEST) as Array<[keyof Assets, string]>).map(async ([key, file]) => [key, await loadImage(file)] as const),
  );
  return Object.fromEntries(entries) as unknown as Assets;
}
