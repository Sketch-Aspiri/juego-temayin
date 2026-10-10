import { TAU } from '../../constants';
import type { EnemyDrawFn } from './types';

/** Radio (px) de la rueda; la caja del enemigo mide 36×36. */
const RADIUS = 18;
const SPOKES = 6;
/** Vueltas por segundo al rodar. */
const SPIN_RATE = 2.2;
const RIM = '#6b4423';
const RIM_DARK = '#3d2610';
const FIBER = '#d9c27a';
const FIBER_DARK = '#a8904a';
const HUB = '#4a4a4a';

/** Rueda de henequén: aro de madera envuelto en fibra, con rayos que giran al rodar. */
export const drawWheel: EnemyDrawFn = (c, _assets, e) => {
  const dir = e.vx < 0 ? -1 : 1;
  const angle = e.t * SPIN_RATE * TAU * dir;
  c.translate(0, -RADIUS);
  c.fillStyle = RIM_DARK;
  c.beginPath();
  c.arc(0, 0, RADIUS, 0, TAU);
  c.fill();
  c.fillStyle = RIM;
  c.beginPath();
  c.arc(0, 0, RADIUS - 3, 0, TAU);
  c.fill();
  // Fibras de henequén enrolladas en el aro: giran con la rueda.
  c.strokeStyle = FIBER;
  c.lineWidth = 3;
  for (let i = 0; i < SPOKES * 2; i++) {
    const a = angle + (i / (SPOKES * 2)) * TAU;
    c.beginPath();
    c.moveTo(Math.cos(a) * (RADIUS - 6), Math.sin(a) * (RADIUS - 6));
    c.lineTo(Math.cos(a + 0.2) * (RADIUS + 1), Math.sin(a + 0.2) * (RADIUS + 1));
    c.stroke();
  }
  c.strokeStyle = FIBER_DARK;
  c.lineWidth = 2;
  for (let i = 0; i < SPOKES; i++) {
    const a = angle + (i / SPOKES) * TAU;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * (RADIUS - 5), Math.sin(a) * (RADIUS - 5));
    c.stroke();
  }
  c.fillStyle = HUB;
  c.beginPath();
  c.arc(0, 0, 4, 0, TAU);
  c.fill();
};
