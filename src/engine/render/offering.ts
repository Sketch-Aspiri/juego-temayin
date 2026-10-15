import { EK_CHUAH } from '../../data/offerings';
import { PLAYER_SPRITES } from '../../data/playerSprites';
import { GROUND, T, TAU } from '../constants';
import type { World } from '../World';
import { lazyImage } from './artCache';
import type { Ctx } from './drawUtils';
import { drawCacao } from './props';

const DEITY_X = 7.5 * T;
const ALTAR_OFFSET = 1.7 * T;
const ALTAR_WIDTH = 1.4 * T;
const ALTAR_HEIGHT = 0.55 * T;
const IDLE_PLAYER = PLAYER_SPRITES.idle[0];
/** La altura se deriva del sprite real de Temayin, no de su caja de colisión. */
const DEITY_HEIGHT = IDLE_PLAYER.h * IDLE_PLAYER.scale;
const SPARK_COUNT = 7;

/** El altar es decorado: el encuentro ocurre antes de que empiece el nivel. */
export function drawOffering(c: Ctx, world: World, now: number): void {
  if (!world.offeringActive || !world.def.offering) return;
  const x = DEITY_X - world.camX;
  const altarX = x - ALTAR_OFFSET;
  const y = GROUND * T;
  c.save();
  const glow = c.createRadialGradient(x, y - DEITY_HEIGHT / 2, 10, x, y - DEITY_HEIGHT / 2, DEITY_HEIGHT);
  glow.addColorStop(0, '#ffdd8860'); glow.addColorStop(1, '#ffdd8800');
  c.fillStyle = glow; c.fillRect(x - DEITY_HEIGHT, y - DEITY_HEIGHT * 1.5, DEITY_HEIGHT * 2, DEITY_HEIGHT * 1.5);
  c.fillStyle = '#184b3b'; c.strokeStyle = '#d4bd70'; c.lineWidth = 2;
  c.fillRect(altarX - ALTAR_WIDTH / 2, y - ALTAR_HEIGHT, ALTAR_WIDTH, ALTAR_HEIGHT);
  c.strokeRect(altarX - ALTAR_WIDTH / 2, y - ALTAR_HEIGHT, ALTAR_WIDTH, ALTAR_HEIGHT);
  c.fillStyle = '#c8b578'; c.fillRect(altarX - ALTAR_WIDTH / 2 - 6, y - ALTAR_HEIGHT - 8, ALTAR_WIDTH + 12, 8);
  drawCacao(c, altarX, y - ALTAR_HEIGHT - T / 2, now / 150);
  drawDeity(c, x, y);
  drawSparks(c, x, y, now);
  c.restore();
}

function drawDeity(c: Ctx, x: number, feet: number): void {
  const image = lazyImage(EK_CHUAH.file);
  if (!image) return;
  const width = DEITY_HEIGHT * image.naturalWidth / image.naturalHeight;
  c.drawImage(image, x - width / 2, feet - DEITY_HEIGHT, width, DEITY_HEIGHT);
}

function drawSparks(c: Ctx, x: number, y: number, now: number): void {
  c.fillStyle = '#ffe49b';
  for (let i = 0; i < SPARK_COUNT; i++) {
    const phase = (now / 3000 + i / SPARK_COUNT) % 1;
    c.globalAlpha = Math.sin(phase * Math.PI) * 0.7;
    c.beginPath(); c.arc(x + Math.sin(i * 2.4) * DEITY_HEIGHT / 2, y - phase * DEITY_HEIGHT * 1.2, 2, 0, TAU); c.fill();
  }
}
