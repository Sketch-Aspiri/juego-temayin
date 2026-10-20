import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from './appStore';
import { readDiscovery, recordDiscoveries } from './explorerNotebook';
import { EMPTY_PROGRESS, recordCompletion, sanitizeProgress } from './progress';
import { LEGACY_KEY, loadSaved, STORAGE_KEY } from './persistence';
import { DEFAULT_SETTINGS } from './settings';
import { EMPTY_WALLET } from './wallet';
import { NOTEBOOK_ENTRIES } from '../data/explorerNotebook';
import { BONUS_LEVELS, WORLDS } from '../data/worlds';

const id = 'palenque-palacio';
const record = { bestScore: 700, stars: 2 as const, completions: 1 };

describe('Cuaderno persistente', () => {
  const original = useAppStore.getState();
  let storage: Map<string, string>;
  let write: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    storage = new Map();
    write = vi.fn((key: string, value: string) => storage.set(key, value));
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: write });
    useAppStore.setState({ ...original, progress: EMPTY_PROGRESS, wallet: EMPTY_WALLET, run: null,
      settings: { ...DEFAULT_SETTINGS, introSeen: true }, screen: 'title' });
  });
  afterEach(() => { useAppStore.setState(original); vi.unstubAllGlobals(); });

  it('registra sin mutar, no duplica y solo marca como leídas las páginas encontradas', () => {
    const progress = recordDiscoveries(EMPTY_PROGRESS, [id, id, 'inventado']);
    expect(progress.discoveries).toEqual([id]);
    expect(EMPTY_PROGRESS.discoveries).toEqual([]);
    expect(recordDiscoveries(progress, [id])).toBe(progress);
    expect(readDiscovery(progress, 'bacalar-laguna')).toBe(progress);
    const read = readDiscovery(progress, id);
    expect(read.readDiscoveries).toEqual([id]);
    expect(readDiscovery(read, id)).toBe(read);
    expect(recordCompletion(read, { levelId: '1-1', score: 70, stars: 1, deaths: 0, coinRatio: 0,
      session: { score: 70, coins: 0, lives: 3 } }).discoveries).toEqual([id]);
  });

  it('carga v3 y v2 anteriores sin inventar descubrimientos ni perder datos', () => {
    storage.set(STORAGE_KEY, JSON.stringify({ progress: { levels: { '1-1': record }, tickets: ['selva-palenque'] },
      wallet: { cacao: 60, pending: { '1-3': ['life'] } }, settings: { ...DEFAULT_SETTINGS, muted: true } }));
    const saved = loadSaved();
    expect(saved.progress.discoveries).toEqual([]);
    expect(saved.progress.levels['1-1']).toEqual(record);
    expect(saved.progress.tickets).toEqual(['selva-palenque']);
    expect(saved.wallet.cacao).toBe(60);
    expect(saved.wallet.pending['1-3']).toEqual(['life']);
    expect(saved.settings.muted).toBe(true);
    storage.delete(STORAGE_KEY);
    storage.set(LEGACY_KEY, JSON.stringify({ progress: { levels: { '1-3': record } } }));
    expect(loadSaved().progress).toEqual({ ...EMPTY_PROGRESS, levels: { '1-6': record } });
    expect(storage.has(LEGACY_KEY)).toBe(true);
  });

  it('conserva las 29 páginas publicadas, sus lecturas y los récords al ampliar a cien', () => {
    const published = ['palenque-palacio', 'palenque-saraguatos', 'palenque-orquideas',
      'campeche-muralla', 'campeche-baluartes', 'campeche-puertas', 'bacalar-laguna', 'bacalar-estromatolitos',
      'bacalar-fuerte', 'edzna-cinco-pisos', 'petenes-manglares', 'izamal-convento', 'chichen-castillo',
      'valladolid-cacao', 'nuevo-xcan-mono-arana', 'morelos-arrecife', 'akumal-yalku', 'tulum-castillo',
      'limones-chacchoben', 'xpujil-tres-torres', 'calakmul-estructura-2', 'codice-cuenta', 'codice-suma',
      'codice-serie', 'codice-cero', 'codice-posicion', 'codice-uinal', 'codice-tzolkin', 'codice-haab'];
    storage.set(STORAGE_KEY, JSON.stringify({ progress: { levels: { '1-1': record },
      tickets: ['selva-palenque'], discoveries: published, readDiscoveries: published },
      wallet: { cacao: 75, pending: {} }, settings: DEFAULT_SETTINGS }));
    const saved = loadSaved();
    expect(saved.progress.discoveries).toEqual(published);
    expect(saved.progress.readDiscoveries).toEqual(published);
    expect(saved.progress.levels['1-1']).toEqual(record);
    expect(saved.progress.tickets).toEqual(['selva-palenque']);
    expect(saved.wallet.cacao).toBe(75);
    expect(NOTEBOOK_ENTRIES.length - saved.progress.discoveries.length).toBe(71);
  });

  it('permite guardar y leer la colección completa de cien páginas sin duplicados', () => {
    const ids = NOTEBOOK_ENTRIES.map(entry => entry.id);
    let progress = recordDiscoveries(EMPTY_PROGRESS, [...ids, ...ids]);
    for (const entryId of ids) progress = readDiscovery(progress, entryId);
    storage.set(STORAGE_KEY, JSON.stringify({ progress, settings: DEFAULT_SETTINGS }));
    expect(loadSaved().progress.discoveries).toEqual(ids);
    expect(loadSaved().progress.readDiscoveries).toEqual(ids);
    expect(ids).toHaveLength(100);
  });

  it.each(BONUS_LEVELS)('$id guarda sus páginas nuevas por contacto publicado y conserva las lecturas al recargar', level => {
    const entries = NOTEBOOK_ENTRIES.filter(entry => entry.levelId === level.id);
    useAppStore.setState({ progress: { ...EMPTY_PROGRESS, tickets: WORLDS.map(world => world.id) } });
    useAppStore.getState().startLevel(level.id);
    const run = useAppStore.getState().run!;
    expect(run.levelId).toBe(level.id);
    useAppStore.getState().syncDiscoveries(run, [...entries.map(entry => entry.id), id]);
    for (const entry of entries) useAppStore.getState().readDiscovery(entry.id);
    expect(loadSaved().progress.discoveries).toEqual(entries.map(entry => entry.id));
    expect(loadSaved().progress.readDiscoveries).toEqual(entries.map(entry => entry.id));
  });

  it('sanea listas corruptas independientemente y conserva lecturas válidas', () => {
    const progress = sanitizeProgress({ levels: { '1-1': record }, discoveries: [id, id, 2, {}, 'desconocido'],
      readDiscoveries: [id, id, 'bacalar-laguna', null] });
    expect(progress.discoveries).toEqual([id]);
    expect(progress.readDiscoveries).toEqual([id]);
    expect(progress.levels['1-1']).toEqual(record);
    expect(sanitizeProgress({ levels: { '1-1': record }, discoveries: {}, readDiscoveries: true }).levels['1-1']).toEqual(record);
  });

  it('guarda al recoger, conserva al salir y reintentar, e ignora partidas antiguas o marcas de otro nivel', () => {
    const store = useAppStore;
    store.getState().startLevel('1-1');
    const run = store.getState().run!;
    store.getState().syncDiscoveries(run, [id, 'bacalar-laguna', 'inventado']);
    expect(loadSaved().progress.discoveries).toEqual([id]);
    const writes = write.mock.calls.length;
    store.getState().syncDiscoveries(run, [id]);
    expect(write).toHaveBeenCalledTimes(writes);
    store.getState().go('levels');
    expect(loadSaved().progress.discoveries).toEqual([id]);
    store.getState().retryLevel();
    store.getState().syncDiscoveries(run, ['palenque-orquideas']);
    expect(loadSaved().progress.discoveries).toEqual([id]);
    store.getState().readDiscovery(id);
    expect(loadSaved().progress.readDiscoveries).toEqual([id]);
    store.getState().resetProgress();
    expect(loadSaved().progress).toEqual(EMPTY_PROGRESS);
    expect(loadSaved().wallet).toEqual(EMPTY_WALLET);
  });
});
