#!/usr/bin/env node
// Dependency-free static server for checking a build before upload.
//
// It negotiates Content-Encoding and serves the .br / .gz files the build
// produced, so the bytes on the wire here are the bytes a host would send.
// A plain server would quietly serve the uncompressed originals and make the
// payload look 3x worse than it is.
//
//   node scripts/serve.mjs [dir] [port]

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4190);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

if (!existsSync(dir)) {
  console.error(`No such directory: ${dir}\nRun \`npm run build\` first.`);
  process.exit(1);
}

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // normalize + prefix check: without it, ../.. escapes the served directory
  const target = join(dir, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  let file = target.startsWith(dir) ? target : dir;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('404');
  }

  const type = MIME[extname(file)] || 'application/octet-stream';
  const accepts = req.headers['accept-encoding'] || '';
  let send = file;
  let encoding = null;
  if (/\bbr\b/.test(accepts) && existsSync(`${file}.br`)) { send = `${file}.br`; encoding = 'br'; }
  else if (/\bgzip\b/.test(accepts) && existsSync(`${file}.gz`)) { send = `${file}.gz`; encoding = 'gzip'; }

  const headers = {
    'content-type': type,
    'content-length': statSync(send).size,
    'cache-control': 'no-cache',
  };
  if (encoding) {
    headers['content-encoding'] = encoding;
    headers.vary = 'Accept-Encoding';
  }
  res.writeHead(200, headers);
  createReadStream(send).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${dir}`);
  console.log(`  http://localhost:${port}/`);
  console.log('  (Content-Encoding negotiated — .br/.gz served when the browser accepts them)');
});
