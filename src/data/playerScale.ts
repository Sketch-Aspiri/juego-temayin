import type { AnimName } from '../engine/entities/types';
import type { PlayerPoseId } from './gameplaySprites';

/** Referencia anatómica base; brazos, piernas y cola no determinan la escala. */
export const PLAYER_HEAD_WIDTH = 56;

/** El perfil de carrera necesita menos ancho que el rostro frontal para conservar el tamaño del cuerpo. */
export const PLAYER_RUN_HEAD_WIDTH = 48;

/** Anchos de cabeza medidos de oreja exterior a hocico en guepardo.webp. */
export const PLAYER_HEAD_WIDTHS = {
  run: [87, 94, 83, 87, 85, 87, 88],
  jump: [82, 87, 88, 85, 81, 80, 78, 78],
  fall: [82, 80, 80, 79, 78, 83, 82],
  idle: [88, 88, 85, 83, 86, 86, 87],
  win: [81, 79, 78, 73, 77, 82, 85],
} as const satisfies Readonly<Record<AnimName, readonly number[]>>;

/** La hoja de mecánicas tiene otra resolución; se calibra con la misma referencia. */
export const PLAYER_POSE_HEAD_WIDTHS = {
  swimGlide: 208,
  swimKick: 215,
  swimStroke: 211,
  hanging: 203,
  swinging: 191,
  throwing: 204,
} as const satisfies Readonly<Record<PlayerPoseId, number>>;

export function playerScale(anim: AnimName, index: number): number {
  const headWidth = anim === 'run' ? PLAYER_RUN_HEAD_WIDTH : PLAYER_HEAD_WIDTH;
  return headWidth / PLAYER_HEAD_WIDTHS[anim][index];
}

export function playerPoseScale(id: PlayerPoseId): number {
  return PLAYER_HEAD_WIDTH / PLAYER_POSE_HEAD_WIDTHS[id];
}
