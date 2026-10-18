/** Revisión aislada: cinemática, móvil y recorrido con física real y contacto protegido. */
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
const output = new URL('./verificacion/hanal-pixan/', import.meta.url);
await mkdir(output, { recursive: true });
const errors = [], reports = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  await page.goto(process.env.TEMAYIN_QA_URL ?? 'http://127.0.0.1:5199');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Jugar', exact: true }).waitFor();
  await page.evaluate(async () => {
    const loaded = path => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === path).at(-1)?.name ?? path;
    const { World } = await import(loaded('/src/engine/World.ts'));
    const { useAppStore } = await import(loaded('/src/store/appStore.ts'));
    window.qa = { store: useAppStore, tick: World.prototype.update, world: null };
    World.prototype.update = function () { qa.world = this; };
    qa.store.setState({ settings: { ...qa.store.getState().settings, muted: true, introSeen: false, touchControls: 'on' } });
  });
  await page.getByRole('button', { name: 'Jugar', exact: true }).click();
  for (const [width, height] of [[1280, 850], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.locator('.seasonal').scrollIntoViewIfNeeded();
    const order = await page.evaluate(() => document.querySelector('.seasonal').compareDocumentPosition(document.querySelector('.world')) & Node.DOCUMENT_POSITION_FOLLOWING);
    assert(order);
    assert(await page.getByText('Nivel especial de temporada', { exact: true }).isVisible());
    assert(await page.getByRole('button', { name: /Jugar Hanal Pixán/ }).isEnabled());
    await page.screenshot({ path: fileURLToPath(new URL(`selector-${width}.png`, output)), fullPage: true });
    await page.getByRole('button', { name: /Jugar Hanal Pixán/ }).click();
    await page.locator('.intro').waitFor();
    assert.equal(await page.evaluate(() => qa.store.getState().settings.introSeen), false);
    assert.equal(await page.evaluate(() => qa.world), null, 'La cinemática debe empezar antes de crear el motor.');
    assert.equal(await page.locator('.stage canvas').getAttribute('aria-hidden'), null);
    for (let scene = 0; scene < 3; scene++) {
      await page.locator('.intro-actor .intro-sprite').first().waitFor();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.intro-scene')).opacity === '1'
        && document.querySelector('.intro-caption__ghost').textContent === '');
      await page.screenshot({ path: fileURLToPath(new URL(`cinematica-${width}-${scene}.png`, output)) });
      if (scene < 2) await page.locator('.intro-next').click();
    }
    await page.getByRole('button', { name: '¡Jugar Hanal Pixán!', exact: true }).click();
    await page.waitForFunction(() => qa.world?.def.id === 'especial-hanal-pixan');
    await page.locator('.level-loading').waitFor({ state: 'detached' });
    await page.evaluate(() => { for (let i = 0; i < 120; i++) qa.tick.call(qa.world, 1 / 120); });
    assert.equal(await page.locator('.touch button[data-action]').count(), 5);
    await page.screenshot({ path: fileURLToPath(new URL(`inicio-${width}.png`, output)) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert(!overflow, 'No debe haber desbordamiento horizontal.');
    await page.evaluate(() => { qa.world = null; qa.store.getState().go('levels'); });
  }
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.getByRole('button', { name: /Jugar Hanal Pixán/ }).click();
  await page.getByRole('button', { name: /Saltar/ }).click();
  await page.waitForFunction(() => qa.world?.def.id === 'especial-hanal-pixan');
  await page.evaluate(() => {
    qa.advance = seconds => {
      const w = qa.world, p = w.player, input = w.input;
      for (let i = 0; i < seconds * 120 && w.phase === 'play'; i++) {
        p.inv = 100; input.press('right'); input.press('run');
        let jump = false;
        if (p.onGround || p.coyote > 0) {
          const front = p.x + p.w;
          for (let x = Math.floor(front / 40); x <= Math.floor((front + 60) / 40); x++) {
            if (!w.solid(x, 12) || w.solid(x, Math.floor((p.y + p.h - 3) / 40)) || w.solid(x, Math.floor(p.y / 40))) jump = true;
          }
        }
        if (jump && !input.held.jump) input.press('jump');
        else if (p.vy >= 0 || (!jump && p.onGround)) input.release('jump');
        qa.tick.call(w, 1 / 120);
      }
      input.reset(); p.inv = 0;
      return { phase: w.phase, x: p.x / 40, checkpoint: w.checkpointReached, time: w.timeLeft };
    };
  });
  let reachedCheckpoint = false;
  for (let i = 0; i < 50; i++) {
    const report = await page.evaluate(() => qa.advance(0.5));
    reports.push(report);
    assert.notEqual(report.phase, 'dying', 'El recorrido debe poder cruzarse con saltos reales.');
    if (report.checkpoint && !reachedCheckpoint) {
      reachedCheckpoint = true;
      await page.locator('canvas').screenshot({ path: fileURLToPath(new URL('checkpoint.png', output)) });
    }
    if (report.phase === 'flag') break;
  }
  await writeFile(new URL('recorrido.json', output), JSON.stringify(reports, null, 2) + '\n');
  await page.locator('canvas').screenshot({ path: fileURLToPath(new URL('recorrido-final.png', output)) });
  assert(reachedCheckpoint);
  assert.equal(reports.at(-1).phase, 'flag');
  await page.locator('canvas').screenshot({ path: fileURLToPath(new URL('meta.png', output)) });
  await page.evaluate(() => { for (let i = 0; i < 1200 && qa.world.phase !== 'done'; i++) qa.tick.call(qa.world, 1 / 120); });
  await page.getByRole('button', { name: 'Continuar a Palenque' }).waitFor();
  assert.equal(await page.evaluate(() => qa.store.getState().progress.levels['especial-hanal-pixan'].completions), 1);
  const lives = await page.evaluate(() => qa.world.session.lives);
  await page.screenshot({ path: fileURLToPath(new URL('resultados.png', output)) });
  await page.getByRole('button', { name: 'Continuar a Palenque' }).click();
  await page.locator('main.intro[aria-label="El eclipse de Camazotz"]').waitFor();
  await page.getByRole('button', { name: /Saltar/ }).click();
  await page.waitForFunction(() => qa.store.getState().run?.levelId === '1-1' && qa.store.getState().screen === 'game');
  assert.equal(await page.evaluate(() => qa.store.getState().run.session.lives), lives);
  assert.equal(await page.evaluate(() => qa.store.getState().progress.levels['especial-hanal-pixan'].completions), 1);
  assert.deepEqual(errors, []);
  await writeFile(new URL('informe.json', output), JSON.stringify({ errors, recorrido: reports, checkpoint: reachedCheckpoint,
    contactoProtegido: true, saltosYColisionesReales: true, continuacionConPrologo: true }, null, 2) + '\n');
  process.stdout.write('Selector, tres escenas, tres tamaños, checkpoint, meta, guardado y continuación a Palenque verificados.\n');
} finally { await browser.close(); }
