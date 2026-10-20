import { PHOTO_MANIFEST } from './photoManifest';

export interface StationPhoto {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly caption: string;
  readonly alt: string;
  readonly scope: 'place' | 'surroundings';
  readonly author: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly licenseUrl: string;
}

export const STATION_PHOTOS: Readonly<Record<string, StationPhoto>> = PHOTO_MANIFEST;
