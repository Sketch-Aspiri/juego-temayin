import type { MovingPlatform } from '../../entities/platforms';
import type { Rect } from '../../types';
import type { World } from '../../World';
import * as K from './tuning';

export interface TurtleAlly { readonly platform: MovingPlatform; netted: boolean; rescue: number; boost: number }
export interface TurtlePulse { x: number; y: number }
const cx = (r: Rect): number => r.x + r.w / 2;
const cy = (r: Rect): number => r.y + r.h / 2;
const near = (r: Rect, m: MovingPlatform, radius: number): boolean => Math.hypot(cx(r) - cx(m), cy(r) - m.y) <= radius;

/** El vínculo y sus pulsos pertenecen al encuentro; jamás se altera la definición del nivel. */
export class TurtleTeam {
  readonly allies: TurtleAlly[] = [];
  pulse: TurtlePulse | null = null;
  rescues = 0;
  private bound = false;

  bind(world: World, left: number, right: number): void {
    if (this.bound) return;
    this.bound = true;
    for (const platform of world.platforms) {
      if (platform.spec.kind !== 'mover' || platform.spec.appearance !== 'turtle' || platform.x < left || platform.x >= right) continue;
      this.allies.push({ platform, netted: false, rescue: 0, boost: 0 });
      platform.turtleState = 'swim';
    }
  }

  /** La aliada cercana al jefe deja una apertura físicamente alcanzable, sin teletransportes. */
  target(boss: Rect): number {
    let target = 0, distance = Infinity;
    for (let i = 0; i < this.allies.length; i++) {
      const m = this.allies[i].platform;
      const d = Math.hypot(cx(m) - cx(boss), m.y - cy(boss));
      if (d < distance) { distance = d; target = i; }
    }
    return target;
  }

  ensnare(index: number): void {
    const ally = this.allies[index];
    if (!ally) return;
    ally.netted = true; ally.rescue = 0;
    ally.platform.turtleState = 'net';
  }

  providesAir(body: Rect): boolean {
    for (const ally of this.allies) if (!ally.netted && near(body, ally.platform, K.AIR_RADIUS)) return true;
    return false;
  }

  step(world: World, boss: Rect, dt: number): boolean {
    for (const ally of this.allies) this.stepAlly(world, ally, dt);
    let n = 0;
    for (const fire of world.fireballs) if (!fire.gone) world.fireballs[n++] = fire;
    world.fireballs.length = n;
    if (!this.pulse) return false;
    const dx = cx(boss) - this.pulse.x, dy = cy(boss) - this.pulse.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= K.PULSE_HIT) { this.pulse = null; return true; }
    const travel = Math.min(distance, K.PULSE_SPEED * dt);
    this.pulse.x += dx / distance * travel; this.pulse.y += dy / distance * travel;
    return false;
  }

  private stepAlly(world: World, ally: TurtleAlly, dt: number): void {
    const m = ally.platform, p = world.player;
    ally.boost = Math.max(0, ally.boost - dt);
    if (ally.netted) {
      if (near(p, m, K.RESCUE_RADIUS)) ally.rescue += dt;
      else ally.rescue = Math.max(0, ally.rescue - dt);
      this.fireOnNet(world, ally);
      if (ally.rescue >= K.RESCUE_TIME) this.release(world, ally);
      return;
    }
    if (near(p, m, K.BOOST_RADIUS) && ally.boost === 0 && p.strokeT > 0 && p.vy < 0) {
      p.vy = -K.BOOST_SPEED; ally.boost = K.BOOST_COOLDOWN;
      world.audio.play('power');
    }
    m.turtleState = ally.boost > K.BOOST_COOLDOWN / 2 ? 'boost' : near(p, m, K.AIR_RADIUS) ? 'air' : 'swim';
  }

  private fireOnNet(world: World, ally: TurtleAlly): void {
    const m = ally.platform;
    for (const fire of world.fireballs) {
      if (fire.gone || Math.hypot(fire.x - cx(m), fire.y - m.y) > K.RESCUE_RADIUS) continue;
      fire.gone = true; ally.rescue += K.RESCUE_FIRE;
    }
  }

  private release(world: World, ally: TurtleAlly): void {
    ally.netted = false; ally.rescue = 0; ally.boost = K.BOOST_COOLDOWN;
    ally.platform.turtleState = 'boost';
    this.rescues++;
    this.pulse = { x: cx(ally.platform), y: ally.platform.y };
    world.addScore(K.RESCUE_SCORE, this.pulse.x, this.pulse.y);
    world.audio.play('power');
    world.popups.push({ x: this.pulse.x, y: this.pulse.y - 35, t: 0, txt: '¡Tortuga libre! ¡Sigue su pulso!' });
  }

  restore(): void {
    this.pulse = null;
    for (const ally of this.allies) {
      ally.netted = false; ally.rescue = 0; ally.platform.submerged = false; ally.platform.turtleState = 'swim';
    }
  }
}
