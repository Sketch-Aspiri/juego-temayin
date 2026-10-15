import type { LightSource } from '../render/lighting';
import type { World } from '../World';
import type { Fireball } from './types';

/** Estado de cada partida: nunca se cambia la configuración de luces del nivel. */
export interface Torch extends LightSource { lit: boolean }
const IGNITION_REACH = 22;

/** Una bola que alcanza la mecha se consume; las ya encendidas dejan pasar el fuego. */
export function igniteTorch(world: World, fire: Fireball): boolean {
  for (const torch of world.torches) {
    if (torch.lit || Math.abs(fire.x - torch.x) > IGNITION_REACH || Math.abs(fire.y - torch.y) > IGNITION_REACH) continue;
    torch.lit = true;
    fire.gone = true;
    world.audio.play('fire');
    return true;
  }
  return false;
}

/** El rugido solo apaga las antorchas situadas dentro del atrio. */
export function extinguishTorches(world: World, left: number, right: number): void {
  for (const torch of world.torches) if (torch.x >= left && torch.x <= right) torch.lit = false;
}
