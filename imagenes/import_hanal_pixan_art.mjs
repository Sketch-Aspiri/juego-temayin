/** Publica los alebrijes existentes sin cambiar su arte ni perder transparencia. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
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
const names = ['temayin', 'temayina', 'toh', 'coati', 'murcielago', 'alux', 'hormiga-arriera', 'luciernaga'];
const records = {};
await mkdir(path('public/assets/temporada/hanal-pixan'), { recursive: true });
for (const name of names) {
  const source = path(`imagenes/alebrijes-dia-de-muertos/${name}.png`);
  const target = path(`public/assets/temporada/hanal-pixan/${name}.webp`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = 0, bottom = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 8) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  assert(right > left && bottom > top);
  await sharp(source).webp({ lossless: true, effort: 6 }).toFile(target);
  const after = await sharp(target).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < data.length; i += 4) {
    assert.equal(data[i + 3], after[i + 3]);
    if (data[i + 3]) assert(data.subarray(i, i + 3).equals(after.subarray(i, i + 3)));
  }
  records[name] = { file: `temporada/hanal-pixan/${name}.webp`, sheetW: info.width, sheetH: info.height,
    frame: [left, top, right - left + 1, bottom - top + 1] };
}
await writeFile(path('public/assets/temporada/hanal-pixan/atlas.json'), JSON.stringify(records, null, 2) + '\n');
process.stdout.write('Ocho alebrijes exportados con alfa y color visible intactos.\n');
