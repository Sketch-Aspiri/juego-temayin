import { SARGASSUM_BURN_RADIUS, T } from '../constants';
import { burnSlowZones, slowZoneAt } from '../level/slowZones';
import type { World } from '../World';
import { makeParticle } from './particles';

const BURN_SPARKS = 10;
const BURN_SPARK_SPEED = 160;
const BURN_COLORS = ['#ffd23f', '#ff6a1a', '#6b5a2a'] as const;

/** Chispas y ceniza al quemarse el sargazo en (x, y). */
function burnBurst(world: World, x: number, y: number): void {
  for (let i = 0; i < BURN_SPARKS; i++) {
    const a = -Math.PI * (i / (BURN_SPARKS - 1));
    world.particles.push(
      makeParticle('spark', x, y, {
        vx: Math.cos(a) * BURN_SPARK_SPEED,
        vy: Math.sin(a) * BURN_SPARK_SPEED,
        t: 0.7,
        col: BURN_COLORS[i % BURN_COLORS.length],
      }),
    );
  }
}

/**
 * Las bolas de fuego que tocan sargazo lo queman (AGENTS.md §5.5): la bola se consume
 * y desaparecen las columnas cercanas de la zona. La resina de chicle no arde.
 */
export function burnSargassum(world: World): void {
  if (world.slowZones.length === 0 || world.fireballs.length === 0) return;
  for (const f of world.fireballs) {
    const z = slowZoneAt(world.slowZones, f.x, f.y);
    if (!z || z.kind !== 'sargassum') continue;
    world.slowZones = burnSlowZones(world.slowZones, Math.floor(f.x / T), z.y, SARGASSUM_BURN_RADIUS);
    f.gone = true;
    burnBurst(world, f.x, (z.y + 1) * T);
    world.audio.play('bump');
  }
  world.fireballs = world.fireballs.filter((f) => !f.gone);
}
