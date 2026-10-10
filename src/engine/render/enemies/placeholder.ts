import { TAU } from '../../constants';
import type { EnemyDrawFn } from './types';

/**
 * Dibujo provisional para enemigos sin arte: un cuerpo ovalado del color dado con
 * ojos que miran hacia donde camina. Solo evita que el juego quede sin dibujo.
 */
export const placeholderSprite =
  (body: string, accent: string): EnemyDrawFn =>
  (c, _assets, e) => {
    if (e.vx < 0) c.scale(-1, 1);
    const rx = e.w / 2;
    const ry = e.h / 2;
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(0, -ry, rx, ry, 0, 0, TAU);
    c.fill();
    c.strokeStyle = accent;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(rx * 0.45, -ry * 1.25, 3.5, 0, TAU);
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(rx * 0.5, -ry * 1.25, 1.8, 0, TAU);
    c.fill();
  };
