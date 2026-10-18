/** Requiere Vite en 5199. Comprueba la tienda con compras reales y guardado aislado. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const runtime = join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies');
const { chromium } = (() => {
  try { return require('playwright'); }
  catch { return require(join(runtime, 'node/node_modules/playwright')); }
})();
const url = process.env.TEMAYIN_QA_URL ?? 'http://127.0.0.1:5199';
const output = new URL('./.temp/ofrendas-productos/', import.meta.url);
await mkdir(output, { recursive: true });
const errors = [];
const report = { encounters: [], layouts: [], purchases: [], errors };

async function ready(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.title');
  return instrument(page);
}

async function instrument(page) {
  return page.evaluate(async () => {
    const loaded = suffix => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === suffix).at(-1)?.name ?? suffix;
    const { useAppStore: store } = await import(loaded('/src/store/appStore.ts'));
    const { World } = await import(loaded('/src/engine/World.ts'));
    const { ALL_LEVELS } = await import(loaded('/src/data/worlds.ts'));
    window.qa = { store, world: null, hold: false, drive: false, metrics: {} };
    const update = World.prototype.update;
    World.prototype.update = function (dt) {
      qa.world = this;
      if (qa.hold) return;
      for (let i = 0; i < (qa.drive ? 8 : 1); i++) {
        if (qa.drive && this.phase === 'play') qa.control(this);
        update.call(this, dt);
        if (this.checkpointReached) qa.metrics.checkpoint = true;
        if (this.phase === 'dying' || this.phase === 'done') break;
      }
    };
    return ALL_LEVELS.map(level => ({ id: level.id, encounter: !!level.offering }));
  });
}

async function seed(page, cacao) {
  await page.evaluate(async cacao => {
    const loaded = suffix => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === suffix).at(-1)?.name ?? suffix;
    const { ALL_LEVELS } = await import(loaded('/src/data/worlds.ts'));
    qa.store.setState({ wallet: { cacao, pending: {} },
      progress: { levels: Object.fromEntries(ALL_LEVELS.map(l => [l.id, { bestScore: 0, stars: 1, completions: 1 }])) },
      settings: { ...qa.store.getState().settings, introSeen: true, muted: true } });
  }, cacao);
}

async function enter(page, id) {
  await page.evaluate(id => qa.store.getState().startLevel(id), id);
  await page.waitForSelector('.offering');
}

async function snapshot(page, name) {
  await page.screenshot({ path: new URL(`${name}.png`, output).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), fullPage: true });
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const levels = await ready(page);
  await seed(page, 250);
  for (const level of levels.filter(l => l.encounter)) {
    await enter(page, level.id);
    assert.equal(await page.locator('.blessing__sprite').count(), 3);
    await page.getByRole('button', { name: 'Continuar la aventura' }).click();
    await page.waitForFunction(id => qa.world?.def.id === id, level.id);
    report.encounters.push(level.id);
    await page.evaluate(() => qa.store.getState().go('levels'));
  }
  assert.equal(report.encounters.length, 16);
  await enter(page, '1-3');
  assert(await page.locator('#offering-title').evaluate(e => e === document.activeElement));
  assert(await page.locator('.blessing__sprite').evaluateAll(elements => elements.every(e => getComputedStyle(e).backgroundImage.includes('objetos/objetos.webp'))));
  for (const [width, height] of [[1280, 900], [390, 844], [360, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert(await page.evaluate(() => document.querySelector('.offering').scrollWidth <= innerWidth));
    for (const control of await page.locator('.offering button, .offering select').all()) {
      const box = await control.boundingBox();
      assert(box?.height >= 44);
    }
    await snapshot(page, `tienda-${width}`);
    report.layouts.push(`${width}x${height}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Comprar Fuego del habanero por 30 cacao', exact: true }).evaluate(e => { e.click(); e.click(); });
  await page.getByRole('button', { name: 'Comprar Escudo de jade por 20 cacao', exact: true }).click();
  await page.getByLabel('Cantidad de vidas').selectOption('3');
  await page.getByRole('button', { name: 'Comprar 3 vidas extra por 150 cacao', exact: true }).click();
  assert.equal(await page.evaluate(() => qa.store.getState().wallet.cacao), 50);
  assert.match(await page.locator('.blessing__received').innerText(), /3 vidas listas/);
  await snapshot(page, 'tres-vidas-compradas');
  await page.reload();
  await page.waitForSelector('.title');
  await instrument(page);
  await enter(page, '1-3');
  assert.match(await page.locator('.blessing__received').innerText(), /3 vidas listas/);
  await page.getByRole('button', { name: 'Comprar Corazón de jade por 50 cacao', exact: true }).click();
  assert.equal(await page.evaluate(() => qa.store.getState().wallet.cacao), 0);
  assert(await page.getByRole('button', { name: 'Comprar Corazón de jade por 50 cacao: cacao insuficiente', exact: true }).isDisabled());
  await page.getByRole('button', { name: 'Continuar la aventura' }).click();
  await page.waitForFunction(() => qa.world?.session.lives === 7 && qa.world.player.fire && qa.world.player.shield);
  await page.evaluate(() => { qa.hold = true; });
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('temayin:v3')).wallet.pending).length), 0);
  await snapshot(page, 'cuatro-vidas-entregadas');
  await page.evaluate(() => { qa.previous = qa.world; qa.world.checkpointReached = true; qa.world.die(); qa.hold = false; });
  await page.waitForFunction(() => qa.world !== qa.previous && qa.world.session.lives === 6 && !qa.world.player.fire && !qa.world.player.shield);
  report.purchases.push('3 vidas juntas + 1 repetida; saldo 250 → 0; recarga conserva las compras; entrega 4 vidas; reaparecer no las duplica');
  await page.evaluate(() => qa.store.getState().go('levels'));

  // Reutiliza el recorrido de Tenosique: contacto protegido y saltos preparados en bordes.
  const source = await readFile(new URL('./verify_world3.py', import.meta.url), 'utf8');
  const control = source.match(/window\.qa\.control=w=>\{([\s\S]*?)\r?\n  \};/);
  assert(control);
  await page.evaluate(`qa.control=w=>{${control[1]}\n};`);
  await page.evaluate(() => {
    const normal = qa.control, prepared = new Set();
    qa.control = w => {
      normal(w);
      const p = w.player, input = w.input;
      const pit = w.def.ops.find(o => o[0] === 'pit' && !prepared.has(o[1]) && p.x + p.w > (o[1] - 3) * 40 && p.x < o[1] * 40);
      if (!pit) return;
      const edges = [pit[1] - 2, pit[1] - 1].map(x => ({ x, y: w.grid.findIndex((_, y) => w.solid(x, y)) }));
      edges.sort((a, b) => a.y - b.y);
      p.x = edges[0].x * 40; p.y = edges[0].y * 40 - p.h; p.vx = 400; p.vy = 0; p.onGround = true;
      input.release('jump'); input.press('jump'); prepared.add(pit[1]);
    };
  });
  await seed(page, 150);
  await enter(page, '1-3');
  await page.getByLabel('Cantidad de vidas').selectOption('3');
  await page.getByRole('button', { name: 'Comprar 3 vidas extra por 150 cacao', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar la aventura' }).click();
  await page.waitForFunction(() => qa.world?.def.id === '1-3' && qa.world.session.lives === 6);
  await page.evaluate(() => { qa.metrics = {}; qa.drive = true; });
  await page.waitForFunction(() => qa.world.phase === 'done', null, { timeout: 45000 });
  await page.evaluate(() => { qa.drive = false; });
  assert(await page.evaluate(() => qa.metrics.checkpoint));
  await snapshot(page, 'tenosique-meta');
  report.route = 'Tenosique: checkpoint y meta con tres vidas compradas; contacto protegido y saltos asistidos';
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await mobile.newPage();
  await ready(touch);
  await seed(touch, 200);
  await enter(touch, '6-4');
  await touch.getByLabel('Cantidad de vidas').selectOption('3');
  await touch.getByRole('button', { name: 'Comprar 3 vidas extra por 150 cacao', exact: true }).tap();
  await touch.getByRole('button', { name: 'Comprar Corazón de jade por 50 cacao', exact: true }).tap();
  assert.match(await touch.locator('.blessing__received').innerText(), /4 vidas listas/);
  await snapshot(touch, 'movil-cuatro-vidas');
  await touch.getByRole('button', { name: 'Continuar la aventura' }).tap();
  await touch.waitForFunction(() => qa.world?.def.id === '6-4' && qa.world.session.lives === 7);
  report.purchases.push('Móvil táctil: 3 + 1 vidas en Limones, saldo exacto y entrega correctos');
  await mobile.close();
  assert.deepEqual(errors, []);
  await writeFile(new URL('informe.json', output), JSON.stringify(report, null, 2));
  console.info(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
