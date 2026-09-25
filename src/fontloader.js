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
export function loadGroup(group) {
if (loaded.has(group)) return loaded.get(group);
const faces = FACES.filter((f) => f.group === group);
if (!faces.length) return Promise.resolve();
inject(faces.map((f) => faceRule(f, FONT_DIR + f.file)).join('\n'), `ff-${group}`);
const p = Promise.all(faces.map((f) =>
document.fonts.load(`${f.weight} 100px '${f.family}'`).catch(() => {})
)).then(() => document.fonts.ready).then(() => group);
loaded.set(group, p);
return p;
}
export const loadedGroups = () => [...loaded.keys()];
export const ensureFonts = () => loadGroup('core');
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