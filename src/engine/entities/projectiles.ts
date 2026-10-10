import { ROWS, T, VW } from '../constants';
import { overlap } from '../physics';
import type { World } from '../World';
import { ENEMIES } from './enemies/registry';
import { makeParticle } from './particles';
import type { Fireball } from './types';

function explode(world: World, f: Fireball): void {
  f.gone = true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    world.particles.push(
      makeParticle('spark', f.x, f.y, { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0.6, col: i % 2 ? '#ffd23f' : '#ff6a1a' }),
    );
  }
}

/** Bolas de fuego del jugador (poder del chile). */
export function updateFireballs(world: World, dt: number): void {
  for (const f of world.fireballs) {
    f.t += dt;
    f.vy = Math.min(f.vy + 1800 * dt, 900);
    f.x += f.vx * dt;
    if (world.solid(Math.floor(f.x / T), Math.floor(f.y / T))) {
      explode(world, f);
      world.audio.play('bump');
      continue;
    }
    f.y += f.vy * dt;
    if (f.vy > 0 && world.solid(Math.floor(f.x / T), Math.floor((f.y + 8) / T))) {
      f.y = Math.floor((f.y + 8) / T) * T - 8;
      f.vy = -380;
    }
    if (f.y > ROWS * T || f.x < world.camX - 40 || f.x > world.camX + VW + 40 || f.t > 3) {
      f.gone = true;
      continue;
    }
    if (Math.random() < 0.5) {
      world.particles.push(makeParticle('spark', f.x, f.y, { vy: -20, t: 0.8, col: '#ff9a2a' }));
    }

    const box = { x: f.x - 8, y: f.y - 8, w: 16, h: 16 };
    for (const e of world.enemies) {
      if (e.alive && !e.dead && e.active && overlap(box, e)) {
        const onFireball = ENEMIES[e.id].onFireball;
        if (onFireball) onFireball(e, world);
        else world.killEnemy(e, true);
        explode(world, f);
        break;
      }
    }
    if (f.gone) continue;

    const boss = world.boss;
    if (boss && boss.hittable && overlap(box, boss)) {
      explode(world, f);
      boss.onFireball(world);
    }
  }
  world.fireballs = world.fireballs.filter((f) => !f.gone);
}

/** Púas lanzadas por los jefes. */
export function updateQuills(world: World, dt: number): void {
  const p = world.player;
  for (const q of world.quills) {
    q.vy += 900 * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (world.solid(Math.floor(q.x / T), Math.floor(q.y / T)) || q.y > ROWS * T) q.gone = true;
    else if (world.phase === 'play' && overlap(p, { x: q.x - 8, y: q.y - 8, w: 16, h: 16 })) {
      q.gone = true;
      world.hurt();
    }
  }
  world.quills = world.quills.filter((q) => !q.gone);
}
