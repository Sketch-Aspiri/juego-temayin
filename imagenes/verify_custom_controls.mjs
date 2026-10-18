/** Verifica ajustes, persistencia, teclado y multitáctil; requiere Vite en 5199. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); }
  catch { return require(join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
})();
const url = process.env.TEMAYIN_QA_URL ?? 'http://127.0.0.1:5199';
const output = new URL('./.temp/controles-personalizados/', import.meta.url);
await mkdir(output, { recursive: true });
const report = { layouts: [], keyboard: false, persistence: false, multitouch: false, reset: false, errors: [] };

async function instrument(page) {
  await page.evaluate(async () => {
    const loaded = suffix => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === suffix).at(-1)?.name ?? suffix;
    const { useAppStore: store } = await import(loaded('/src/store/appStore.ts'));
    const { input } = await import(loaded('/src/engine/input.ts'));
    const { World } = await import(loaded('/src/engine/World.ts'));
    window.qa = { store, input, world: null, hold: false };
    const original = World.prototype.update;
    World.prototype.update = function (dt) { qa.world = this; if (!qa.hold) original.call(this, dt); };
  });
}

async function ready(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()}: ${response.url()}`); });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.title');
  await instrument(page);
}

async function snapshot(page, name) {
  await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)), fullPage: true });
}

async function assign(page, action, key) {
  await page.getByRole('button', { name: new RegExp(`^Cambiar tecla de ${action}:`) }).click();
  await page.keyboard.press(key);
  assert.match(await page.locator('#keyboard-status').innerText(), /guardada/);
}

async function slider(page, label, value) {
  await page.getByRole('slider', { name: label, exact: true }).fill(String(value));
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await ready(page);
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  for (const [action, key] of [['Izquierda', 'h'], ['Derecha', 'l'], ['Saltar', 'k'], ['Correr', 'r'], ['Fuego / pelota', 'g'], ['Pausa', 'o'], ['Silenciar', 'n']]) {
    await assign(page, action, key);
  }
  await page.getByRole('button', { name: /^Cambiar tecla de Fuego/ }).click();
  await page.keyboard.press('h');
  assert.match(await page.locator('#keyboard-status').innerText(), /ya se usa para Izquierda/);
  await page.keyboard.press('Escape');
  assert.match(await page.locator('#keyboard-status').innerText(), /cancelado/);
  await slider(page, 'Tamaño de botones', 120);
  await slider(page, 'Opacidad de botones', 60);
  await page.getByRole('button', { name: 'Movimiento a la derecha', exact: true }).click();
  await page.getByRole('button', { name: 'Siempre', exact: true }).click();
  await snapshot(page, 'ajustes-escritorio');
  await page.locator('.touch-preview').scrollIntoViewIfNeeded();
  await snapshot(page, 'ajustes-tactiles-escritorio');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('temayin:v3')).settings);
  await page.reload();
  await page.waitForSelector('.title');
  await instrument(page);
  assert.deepEqual(await page.evaluate(() => qa.store.getState().settings), before);
  assert.match(await page.locator('.controls-help').innerText(), /K.*Saltar/s);
  report.persistence = true;
  await page.evaluate(() => {
    qa.store.getState().updateSettings({ introSeen: true });
    qa.store.getState().startLevel('1-1');
  });
  await page.waitForFunction(() => qa.world?.def.id === '1-1');
  await page.evaluate(() => { qa.hold = true; });
  await page.keyboard.down('ArrowRight');
  assert.equal(await page.evaluate(() => qa.input.held.right), false);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('l');
  await page.keyboard.down('k');
  await page.keyboard.down('g');
  assert.deepEqual(await page.evaluate(() => ({ right: qa.input.held.right, jump: qa.input.held.jump, fire: qa.input.held.fire })), { right: true, jump: true, fire: true });
  await page.keyboard.up('l'); await page.keyboard.up('k'); await page.keyboard.up('g');
  await page.evaluate(() => { qa.world.player.fire = true; qa.start = { x: qa.world.player.x, y: qa.world.player.y }; qa.hold = false; });
  await page.keyboard.down('l'); await page.keyboard.down('k'); await page.keyboard.down('g');
  await page.waitForFunction(() => qa.world.player.x > qa.start.x && qa.world.player.y < qa.start.y && qa.world.fireballs.length > 0);
  await page.keyboard.up('l'); await page.keyboard.up('k'); await page.keyboard.up('g');
  await page.keyboard.press('o');
  await page.waitForSelector('.overlay');
  assert.equal(await page.evaluate(() => Object.values(qa.input.held).some(Boolean)), false);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.touch');
  const muted = await page.evaluate(() => qa.store.getState().settings.muted);
  await page.keyboard.press('n');
  assert.equal(await page.evaluate(() => qa.store.getState().settings.muted), !muted);
  report.keyboard = true;
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await mobile.newPage();
  await ready(touch);
  await touch.getByRole('button', { name: 'Ajustes', exact: true }).tap();
  await slider(touch, 'Tamaño de botones', 120);
  await slider(touch, 'Opacidad de botones', 60);
  await touch.getByRole('button', { name: 'Movimiento a la derecha', exact: true }).tap();
  await touch.getByRole('button', { name: 'Siempre', exact: true }).tap();
  await snapshot(touch, 'ajustes-movil');
  await touch.locator('.touch-preview').scrollIntoViewIfNeeded();
  await snapshot(touch, 'ajustes-tactiles-movil');
  await touch.evaluate(() => { qa.store.getState().updateSettings({ introSeen: true }); qa.store.getState().startLevel('1-1'); });
  await touch.waitForFunction(() => qa.world?.def.id === '1-1');
  await touch.evaluate(() => { qa.hold = true; });
  for (const [width, height] of [[320, 640], [360, 640], [390, 844], [844, 390]]) {
    await touch.setViewportSize({ width, height });
    for (const scale of [0.8, 1.2]) for (const layout of ['standard', 'mirrored']) {
      await touch.evaluate(({ scale, layout }) => qa.store.getState().updateSettings({ touchAppearance: { scale, layout, opacity: 0.6 } }), { scale, layout });
      await touch.waitForFunction(layout => document.querySelector('.touch')?.classList.contains(`touch--${layout}`), layout);
      const boxes = await touch.locator('.touch .pad').evaluateAll(buttons => buttons.map(button => {
        const r = button.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, opacity: getComputedStyle(button).opacity };
      }));
      for (const box of boxes) assert(box.w >= 43.99 && box.h >= 43.99 && box.x >= 0 && box.y >= 0 && box.x + box.w <= width + .1 && box.y + box.h <= height + .1, JSON.stringify({ width, height, scale, layout, box }));
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(a.x + a.w <= b.x + .1 || b.x + b.w <= a.x + .1 || a.y + a.h <= b.y + .1 || b.y + b.h <= a.y + .1, 'Botones solapados');
      }
      assert.equal(boxes[0].opacity, '0.6');
      const positions = await touch.evaluate(() => ({ move: document.querySelector('.touch__movement').getBoundingClientRect().x, actions: document.querySelector('.touch__actions').getBoundingClientRect().x }));
      assert.equal(positions.move < positions.actions, layout === 'standard');
      report.layouts.push({ width, height, scale, layout });
    }
    await snapshot(touch, `mando-${width}`);
  }
  await touch.setViewportSize({ width: 390, height: 844 });
  await touch.getByRole('button', { name: 'Correr', exact: true }).tap();
  const cdp = await mobile.newCDPSession(touch);
  const fingers = [];
  for (const [index, action] of ['right', 'jump', 'fire'].entries()) {
    const box = await touch.locator(`[data-action="${action}"]`).boundingBox();
    fingers.push({ x: box.x + box.width / 2, y: box.y + box.height / 2, id: index + 1 });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers });
  assert.deepEqual(await touch.evaluate(() => qa.input.held), { left: false, right: true, jump: true, run: true, fire: true });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await touch.getByRole('button', { name: 'Pausa', exact: true }).tap();
  assert.equal(await touch.evaluate(() => Object.values(qa.input.held).some(Boolean)), false);
  report.multitouch = true;
  await touch.evaluate(() => qa.store.getState().go('settings'));
  await touch.getByRole('button', { name: 'Restaurar teclado', exact: true }).tap();
  await touch.getByRole('button', { name: 'Restaurar botones táctiles', exact: true }).tap();
  assert.deepEqual(await touch.evaluate(() => qa.store.getState().settings.touchAppearance), { scale: 1, opacity: 1, layout: 'standard' });
  assert.equal(await touch.evaluate(() => qa.store.getState().settings.keyBindings.jump), 'Space');
  report.reset = true;
  await mobile.close();
  assert.deepEqual(report.errors, []);
  await writeFile(new URL('informe.json', output), JSON.stringify(report, null, 2));
  console.info(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
