/** Revisa portada, movimiento reducido, teclado y navegación sin alterar guardados reales. */
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
const output = new URL('./verificacion/portada-hanal-pixan/', import.meta.url);
await mkdir(output, { recursive: true });
const errors = [];
const layouts = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const url = process.env.TEMAYIN_QA_URL ?? 'http://127.0.0.1:5196';
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.title--hanal');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('.title img')].map(image => image.decode()));
  });
  for (const [width, height] of [[1440, 900], [1920, 1080], [390, 844], [360, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.locator('.title').evaluate(element => { element.scrollTop = 0; });
    const layout = await page.evaluate(() => {
      const title = document.querySelector('.title');
      const hero = document.querySelector('.title__jaguar');
      const logo = document.querySelector('.logo');
      const bounds = element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return { width: innerWidth, height: innerHeight, overflow: title.scrollWidth > innerWidth,
        hero: bounds(hero), logo: bounds(logo), animation: getComputedStyle(hero).animationName,
        imagesLoaded: [...title.querySelectorAll('img')].every(image => image.complete && image.naturalWidth > 0) };
    });
    assert(!layout.overflow, 'La portada no debe desbordar horizontalmente.');
    assert(layout.imagesLoaded);
    assert.equal(layout.animation, 'none');
    assert(layout.hero.x >= 0 && layout.hero.x + layout.hero.width <= width + 1);
    assert(layout.logo.x >= 0 && layout.logo.x + layout.logo.width <= width + 1);
    await page.screenshot({ path: fileURLToPath(new URL(`${width}x${height}.png`, output)), fullPage: true });
    for (const label of ['Jugar', 'Historia', 'Ajustes']) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.scrollIntoViewIfNeeded();
      assert(await button.isVisible());
      const box = await button.boundingBox();
      assert(box.height >= 44, 'El botón debe conservar altura táctil.');
    }
    layouts.push(layout);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByText('Cómo jugar', { exact: true }).click();
  assert(await page.locator('.title .controls-help').isVisible());
  await page.getByText('Cómo jugar', { exact: true }).click();
  for (const [label, selector] of [['Historia', '.history'], ['Ajustes', '.settings'], ['Jugar', '.world']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    if (label === 'Ajustes') await page.getByRole('heading', { name: 'Ajustes' }).waitFor();
    else await page.locator(selector).first().waitFor();
    await page.getByRole('button', { name: /Volver/ }).first().click();
    await page.locator('.title--hanal').waitFor();
  }
  await page.getByRole('button', { name: 'Jugar', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.world').first().waitFor();
  assert.deepEqual(errors, []);
  await writeFile(new URL('revision.json', output), `${JSON.stringify({ layouts, navegacion: 'Jugar, Historia, Ajustes y teclado correctos', errors }, null, 2)}\n`);
} finally {
  await browser.close();
}
process.stdout.write('Portada verificada en escritorio y móvil; navegación y movimiento reducido correctos.\n');
