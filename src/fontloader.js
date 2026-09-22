// Fonts are served as .woff2 files and loaded in groups, so a visitor only
// pays for what their deck actually uses:
//
//   core    41 KB  always
//   serif   15 KB  only once an Editorial layout renders
//   arabic  66 KB  only once RTL text appears
//
// Base64 data URIs are built ONLY at export time. A rasterised SVG cannot
// fetch anything, so the export must carry its fonts inline — but the preview
// does not, because the SVG sits in a document that already has the faces.
// Embedding them in every preview meant ~187 KB of string per frame, ten times
// over on every keystroke.

import { FACES, FONT_DIR } from './fontmanifest.js';

const faceRule = (f, src) =>
  `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};`
  + `font-display:swap;src:url(${src}) format('woff2')}`;

const loaded = new Map();   // group -> Promise

function inject(css, id) {
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/**
 * Make a group's faces available to the document (and therefore to the
 * measuring canvas, which is what shrink-to-fit depends on).
 */
export function loadGroup(group) {
  if (loaded.has(group)) return loaded.get(group);
  const faces = FACES.filter((f) => f.group === group);
  if (!faces.length) return Promise.resolve();

  inject(faces.map((f) => faceRule(f, FONT_DIR + f.file)).join('\n'), `ff-${group}`);

  const p = Promise.all(faces.map((f) =>
    // a representative size is enough; the face is loaded for all sizes
    document.fonts.load(`${f.weight} 100px '${f.family}'`).catch(() => {})
  )).then(() => document.fonts.ready).then(() => group);

  loaded.set(group, p);
  return p;
}

export const loadedGroups = () => [...loaded.keys()];

/** Core faces, needed before the first render so measurement is accurate. */
export const ensureFonts = () => loadGroup('core');

/** Pull in optional groups a deck turns out to need. */
export async function ensureFontsFor(deck) {
  const jobs = [];
  const text = deck.frames.map((f) => `${f.slots.headline}\n${f.slots.body}`).join('\n')
             + deck.brand.name + deck.brand.tag;
  if (/[֐-׿؀-ۿ܀-ݏހ-޿ࢠ-ࣿיִ-﷿ﹰ-﻿]/.test(text)) {
    jobs.push(loadGroup('arabic'));
  }
  if (deck.frames.some((f) => f.layout === 'editorial') || deck.layout === 'editorial') {
    jobs.push(loadGroup('serif'));
  }
  return Promise.all(jobs);
}

// ---------------------------------------------------------------- export

let _exportCss = null;
let _exportKey = '';

const toBase64 = (buf) => {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

/**
 * @font-face rules with the fonts inlined as data URIs, for embedding in an
 * SVG that is about to be rasterised. Only the groups in use are included,
 * and the result is cached — a ten-frame export builds it once.
 */
export async function exportFontCss(groups = loadedGroups()) {
  const key = [...groups].sort().join(',');
  if (_exportCss && _exportKey === key) return _exportCss;

  const faces = FACES.filter((f) => groups.includes(f.group));
  const rules = await Promise.all(faces.map(async (f) => {
    const res = await fetch(FONT_DIR + f.file);
    if (!res.ok) throw new Error(`Could not load ${f.file} for export`);
    const b64 = toBase64(await res.arrayBuffer());
    return faceRule(f, `data:font/woff2;base64,${b64}`);
  }));

  _exportKey = key;
  _exportCss = rules.join('\n');
  return _exportCss;
}
