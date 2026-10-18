/** Exporta la portada y comprueba los píxeles visibles y el alfa de Temayin. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = (() => {
  try { return require('sharp'); }
  catch { return require(join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')); }
})();
const root = new URL('../', import.meta.url);
const path = relative => fileURLToPath(new URL(relative, root));
const character = 'imagenes/alebrijes-dia-de-muertos/temayin.png';
const background = 'imagenes/nuevos/portada-hanal-pixan/fondo.png';
const target = 'public/assets/portada/';

await sharp(path(character)).webp({ lossless: true, effort: 6 }).toFile(path(`${target}temayin-alebrije.webp`));
await sharp(path(background)).webp({ quality: 90, effort: 6 }).toFile(path(`${target}palenque-hanal-pixan.webp`));
const before = await sharp(path(character)).ensureAlpha().raw().toBuffer();
const after = await sharp(path(`${target}temayin-alebrije.webp`)).ensureAlpha().raw().toBuffer();
assert.equal(before.length, after.length);
// WebP puede descartar el RGB oculto bajo alfa cero; ese color nunca se dibuja.
for (let i = 0; i < before.length; i += 4) {
  assert.equal(before[i + 3], after[i + 3], 'La exportación debe conservar el alfa.');
  if (before[i + 3] === 0) continue;
  assert(before.subarray(i, i + 3).equals(after.subarray(i, i + 3)), 'La exportación debe conservar el color visible.');
}
const assets = await Promise.all(['temayin-alebrije.webp', 'palenque-hanal-pixan.webp'].map(async file => {
  const { width, height, hasAlpha } = await sharp(path(target + file)).metadata();
  const { size } = await stat(path(target + file));
  return { archivo: file, ancho: width, alto: height, transparencia: hasAlpha, bytes: size };
}));
await writeFile(path('imagenes/nuevos/portada-hanal-pixan/exportacion.json'), `${JSON.stringify(assets, null, 2)}\n`);
process.stdout.write('Portada exportada; Temayin conserva sus colores visibles y transparencia.\n');
