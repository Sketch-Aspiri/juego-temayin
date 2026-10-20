import type { StationPhoto } from '../stationInfo/photos';
import { NOTEBOOK_PHOTO_MANIFEST } from './photoManifest';

const PHOTOS: Readonly<Record<string, StationPhoto>> = NOTEBOOK_PHOTO_MANIFEST;

/** Fotografía propia de cada página; las páginas del códice no llevan imagen. */
export const getNotebookPhoto = (entryId: string): StationPhoto | undefined => PHOTOS[entryId];
