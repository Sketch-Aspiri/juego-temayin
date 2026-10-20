import type { StationInfo } from './types';
import { WORLD_1_INFO } from './world1';
import { WORLD_2_INFO } from './world2';
import { WORLD_3_INFO } from './world3';
import { WORLD_4_INFO } from './world4';
import { WORLD_5_INFO } from './world5';
import { WORLD_6_INFO } from './world6';
import { WORLD_7_INFO } from './world7';

/** Solo los destinos principales: los boletos no revelan aquí sus secretos. */
export const STATION_INFO: Readonly<Record<string, StationInfo>> = {
  ...WORLD_1_INFO, ...WORLD_2_INFO, ...WORLD_3_INFO, ...WORLD_4_INFO,
  ...WORLD_5_INFO, ...WORLD_6_INFO, ...WORLD_7_INFO,
};
