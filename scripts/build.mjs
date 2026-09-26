#!/usr/bin/env node
// Produces dist/ — the only folder that should ever be uploaded.
//
// Deliberately dependency-free. A bundler would shave a little more, but the
// win here is structural (fonts served as binaries, loaded in groups) and the
// remaining JS is ~35KB before minifying. Adding a toolchain to save 8KB is a
// bad trade for a project that must stay easy to rebuild in a year.
//
//   node scripts/build.mjs

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync }
  from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/**
 * Conservative JS minifier: strips comments and indentation only.
 * It does NOT rename or restructure, because a regex-based minifier that tries
 * to be clever silently breaks code, and a wrong build here is far more
 * expensive than the bytes it would save.
 */
function minifyJs(src) {
  return src
    .replace(/^\s*\/\/.*$/gm, '')              // whole-line // comments
    .replace(/\/\*[\s\S]*?\*\//g, '')          // block comments
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim();
}

function minifyHtml(html) {
  return html
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${minifyCss(css)}</style>`)
    .replace(/<script type="module">([\s\S]*?)<\/script>/g,
             (_, js) => `<script type="module">${minifyJs(js)}</script>`)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+/gm, '');
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'src'), { recursive: true });

for (const page of ['index.html', 'privacy.html', '404.html']) {
  writeFileSync(join(dist, page), minifyHtml(readFileSync(join(root, page), 'utf8')));
}
// copied verbatim - minifying these would corrupt them
for (const f of ['favicon.svg', 'robots.txt', 'sitemap.xml']) {
  cpSync(join(root, f), join(dist, f));
}

for (const f of readdirSync(join(root, 'src'))) {
  if (extname(f) !== '.js') continue;
  writeFileSync(join(dist, 'src', f),
                minifyJs(readFileSync(join(root, 'src', f), 'utf8')));
}

// fonts + licences ship as-is: woff2 is already compressed, and OFL requires
// the licence to travel with the files
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

// Pre-compress text assets. Static hosts that support it serve these directly
// and never spend CPU compressing on the fly; hosts that don't simply ignore them.
let raw = 0, gz = 0, br = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const ext = extname(p);
    const size = statSync(p).size;
    raw += size;
    if (!['.html', '.js', '.json', '.txt', '.css', '.svg'].includes(ext)) { gz += size; br += size; continue; }
    const buf = readFileSync(p);
    const g = gzipSync(buf, { level: 9 });
    const b = brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    });
    writeFileSync(`${p}.gz`, g);
    writeFileSync(`${p}.br`, b);
    gz += g.length;
    br += b.length;
  }
};
walk(dist);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`dist/ built`);
console.log(`  raw     ${kb(raw)}`);
console.log(`  gzip    ${kb(gz)}`);
console.log(`  brotli  ${kb(br)}`);
