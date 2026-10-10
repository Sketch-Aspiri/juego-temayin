import { ROWS, SNORKEL_TIME, T } from '../constants';
import { moveX, moveY, overlap } from '../physics';
import type { ItemKind } from '../tiles';
import type { World } from '../World';
import type { Item } from './types';

const ITEM_SIZE = 32;

export function createItem(kind: ItemKind, tx: number, ty: number): Item {
  return {
    kind,
    x: tx * T + 4,
    y: ty * T,
    w: ITEM_SIZE,
    h: ITEM_SIZE,
    vx: 0,
    vy: 0,
    onGround: false,
    rise: T,
    // El chile, el snorkel y la pelota se quedan quietos; escudo y vida se mueven al salir.
    still: kind === 'fire' || kind === 'snorkel' || kind === 'ball',
    gone: false,
  };
}

export function updateItems(world: World, dt: number): void {
  const p = world.player;
  for (const it of world.items) {
    if (it.rise > 0) {
      const d = Math.min(it.rise, 60 * dt);
      it.y -= d;
      it.rise -= d;
      if (it.rise <= 0 && !it.still) it.vx = it.kind === 'life' ? 170 : 120;
      continue;
    }
    if (!it.still) {
      it.vy = Math.min(it.vy + 2000 * dt, 900);
      if (moveX(it, it.vx * dt, world.solidAt)) it.vx = -it.vx;
      moveY(it, it.vy * dt, world.solidAt);
    }
    if (overlap(p, it)) {
      it.gone = true;
      collectItem(world, it);
    }
    if (it.y > ROWS * T) it.gone = true;
  }
  world.items = world.items.filter((i) => !i.gone);
}

function collectItem(world: World, it: Item): void {
  switch (it.kind) {
    case 'life':
      world.session.lives++;
      world.audio.play('life');
      world.popups.push({ x: it.x, y: it.y, t: 0, txt: '1UP' });
      break;
    case 'fire':
      world.player.fire = true;
      world.addScore(1000, it.x, it.y);
      world.audio.play('power');
      break;
    case 'snorkel':
      // Congela el consumo de oxígeno durante SNORKEL_TIME segundos sumergido.
      world.player.snorkel = SNORKEL_TIME;
      world.addScore(1000, it.x, it.y);
      world.audio.play('power');
      break;
    case 'ball':
      // Pelota de pok ta pok: la tecla de disparo la lanza (ver `entities/ball.ts`).
      world.player.ball = true;
      world.addScore(1000, it.x, it.y);
      world.audio.play('power');
      break;
    case 'shield':
      world.player.shield = true;
      world.addScore(1000, it.x, it.y);
      world.audio.play('life');
      break;
  }
}
