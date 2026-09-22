// document + brand -> SVG string. Pure: identical inputs give identical output,
// which is what keeps the on-screen frame and the exported PNG in sync.

import { FONT_CSS } from './fonts.js';
import { contrastInk } from './brand.js';
import { LAYOUTS } from './layouts.js';

export { LAYOUTS, layoutOf, CHROME, rhythmFor } from './layouts.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- direction

const RTL_RE = /[֐-׿؀-ۿ܀-ݏހ-޿ࢠ-ࣿיִ-﷿ﹰ-﻿]/;
export const isRTL = (s) => RTL_RE.test(String(s ?? ''));

// Latin faces carry no Arabic glyphs, so RTL must switch family or it renders
// as fallback on screen and tofu in the export.
const ARABIC_FAMILY = 'IBM Plex Sans Arabic';

const VOICE = {
  display: (b) => ({ family: b.display, weight: 900 }),
  serif:   ()  => ({ family: 'Instrument Serif', weight: 400 }),
  body:    (b) => ({ family: b.body, weight: 400 }),
  mono:    (b) => ({ family: b.mono, weight: 600 }),
};

/** Resolve a typeface for a run of text. Script wins over style. */
export function faceFor(text, brand, voice, tracking = 0) {
  if (isRTL(text)) {
    // Negative tracking severs Arabic letter joining - always zero it.
    // There is no Arabic serif here, so serif requests fall back to Arabic sans.
    return { family: ARABIC_FAMILY, weight: voice === 'display' ? 700 : 400,
             tracking: 0, rtl: true };
  }
  return { ...(VOICE[voice] || VOICE.display)(brand), tracking, rtl: false };
}

// ---------------------------------------------------------------- fonts

let _fontsReady = null;
export function ensureFonts() {
  if (_fontsReady) return _fontsReady;
  const style = document.createElement('style');
  style.textContent = FONT_CSS;
  document.head.appendChild(style);
  _fontsReady = Promise.all([
    document.fonts.load("900 132px 'Archivo'"),
    document.fonts.load("600 26px 'Martian Mono'"),
    document.fonts.load("400 30px 'IBM Plex Sans'"),
    document.fonts.load("400 124px 'Instrument Serif'"),
    document.fonts.load("700 132px '" + ARABIC_FAMILY + "'"),
    document.fonts.load("400 30px '" + ARABIC_FAMILY + "'"),
  ]).then(() => document.fonts.ready);
  return _fontsReady;
}

let _ctx = null;
export function measureText(text, { family, weight = 400, size, tracking = 0 }) {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
  const supports = 'letterSpacing' in _ctx;
  if (supports) _ctx.letterSpacing = '0px';
  _ctx.font = `${weight} ${size}px '${family}'`;
  if (supports && tracking) _ctx.letterSpacing = `${tracking}px`;
  let w = _ctx.measureText(text).width;
  if (!supports && tracking) w += tracking * Math.max(0, text.length - 1);
  if (supports) _ctx.letterSpacing = '0px';
  return w;
}

// ---------------------------------------------------------------- text

export function wrap(text, maxW, font) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (!para.trim()) { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measureText(next, font) > maxW) { out.push(line); line = word; }
      else line = next;
    }
    out.push(line);
  }
  return out;
}

function fitSize(rows, maxW, font, start, min) {
  let size = start;
  while (size > min) {
    const t = font.tracking * (size / start);
    if (Math.max(...rows.map((r) => measureText(r, { ...font, size, tracking: t }))) <= maxW) break;
    size -= 2;
  }
  return size;
}

/**
 * One <text> block. Direction and alignment resolve together, because
 * text-anchor is relative to inline direction: under rtl, "start" is the RIGHT
 * edge, so using "end" there anchors the wrong side and overflows the frame.
 */
function textEl({ rows, frame, M, top, lh, face, size, fill, align = 'start', opacity }) {
  const { w } = frame;
  let x, anchor = null;
  if (align === 'center') { x = Math.round(w / 2); anchor = 'middle'; }
  else if (face.rtl)      { x = w - M; }
  else                    { x = M; }

  const attrs = [
    `font-family="${face.family}"`, `font-weight="${face.weight}"`, `font-size="${size}"`,
    face.tracking ? `letter-spacing="${face.tracking}"` : '',
    `fill="${fill}"`, opacity ? `opacity="${opacity}"` : '',
    face.rtl ? 'direction="rtl"' : '',
    anchor ? `text-anchor="${anchor}"` : '',
  ].filter(Boolean).join(' ');

  const spans = rows
    .map((r, i) => `<tspan x="${x}" y="${top + i * lh}">${esc(r)}</tspan>`).join('');
  return `<text ${attrs}>${spans}</text>`;
}

// ---------------------------------------------------------------- chrome

function chrome(frame, brand, M, mode) {
  if (mode === 'none') return '';
  const { w } = frame;
  const nameFace = faceFor(brand.name, brand, 'mono', 4.4);
  const rtl = nameFace.rtl;

  const index = `<text x="${rtl ? M : w - M}" y="${M + 14}" font-family="${brand.mono}"
        font-weight="600" font-size="20" letter-spacing="4.4" fill="${brand.muted}"${
        rtl ? '' : ' text-anchor="end"'}>${esc(frame.slots.index)}</text>`;

  // "minimal" keeps only the position marker. Dropping the repeated brand line
  // is the single biggest thing that stops ten frames reading as identical.
  if (mode === 'minimal') return index;

  return `
  <text x="${rtl ? w - M : M}" y="${M + 14}" font-family="${nameFace.family}"
        font-weight="${nameFace.weight}" font-size="20"${
        nameFace.tracking ? ` letter-spacing="${nameFace.tracking}"` : ''}
        fill="${brand.mark}"${rtl ? ' direction="rtl"' : ''}>${esc(brand.name)}</text>
  ${index}`;
}

const MAX_BODY_ROWS = 4;

function footer(frame, brand, M, mode, align) {
  if (mode === 'none') return '';
  const { w, h } = frame;
  const face = faceFor(frame.slots.body, brand, 'body');
  const all = wrap(frame.slots.body, w - M * 2, { ...face, size: 30 });
  const rows = all.slice(0, MAX_BODY_ROWS);
  if (all.length > MAX_BODY_ROWS) rows[MAX_BODY_ROWS - 1] += ' …';   // never silent
  const bodyTop = h - 250 - (rows.length - 1) * 38;
  const body = textEl({ rows, frame, M, top: bodyTop, lh: 38, face, size: 30,
                        fill: brand.muted, align });

  if (mode === 'minimal') return body;

  const tagFace = faceFor(brand.tag, brand, 'mono', -0.5);
  const tagW = Math.round(measureText(brand.tag, { ...tagFace, size: 26 }) + 32);
  const tagX = tagFace.rtl ? w - M - tagW : M;
  return `
  ${body}
  <rect x="${tagX}" y="${h - 200}" width="${tagW}" height="54" fill="${brand.accent}"/>
  <text x="${tagFace.rtl ? tagX + tagW - 16 : tagX + 16}" y="${h - 163}"
        font-family="${tagFace.family}" font-weight="${tagFace.weight}" font-size="26"${
        tagFace.tracking ? ` letter-spacing="${tagFace.tracking}"` : ''}
        fill="${contrastInk(brand.accent)}"${tagFace.rtl ? ' direction="rtl"' : ''}>${esc(brand.tag)}</text>
  <rect x="${M}" y="${h - 96}" width="${w - M * 2}" height="2" fill="${brand.muted}" opacity=".25"/>`;
}

// ---------------------------------------------------------------- image

/**
 * Background image plus a scrim. Type over a photograph is unreadable without
 * one, and the user cannot be relied on to notice before exporting.
 * preserveAspectRatio does the cover/contain work: "slice" crops to fill,
 * "meet" fits the whole image inside the frame.
 */
function imageLayer(frame, brand) {
  const img = frame.image;
  if (!img?.src) return '';
  const { w, h } = frame;
  const par = img.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
  const opacity = img.opacity ?? 1;
  const scrim = img.scrim ?? 0;
  return `
  <image href="${esc(img.src)}" x="0" y="0" width="${w}" height="${h}"
         preserveAspectRatio="${par}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>${
  scrim > 0 ? `
  <rect width="${w}" height="${h}" fill="${brand.bg}" opacity="${scrim}"/>` : ''}`;
}

// ---------------------------------------------------------------- frame

export function renderFrame(frame, brand, deckLayout = 'statement') {
  const key = LAYOUTS[frame?.layout] ? frame.layout
            : LAYOUTS[deckLayout] ? deckLayout : 'statement';
  const L = LAYOUTS[key];
  const { w, h } = frame;
  const M = Math.round(w * L.margin);
  const maxW = w - M * 2 - (L.band ? 48 : 0);

  const text = L.casing === 'upper'
    ? String(frame.slots.headline).toUpperCase()
    : frame.slots.headline;

  const face = faceFor(text, brand, L.voice, L.tracking);
  const rows = wrap(text, maxW, { ...face, size: L.size });
  const size = fitSize(rows, maxW, face, L.size, L.min);
  const scaled = { ...face, tracking: face.tracking * (size / L.size) };
  const lh = Math.round(size * L.leading);
  const top = Math.round(h * L.anchor);

  let band = '';
  let fill = brand.ink;
  if (L.band) {
    band = `<rect x="0" y="${top - lh}" width="${w}" height="${rows.length * lh + 56}" fill="${brand.accent}"/>`;
    fill = contrastInk(brand.accent);
  }

  let numeral = '';
  if (L.numeral) {
    const n = String(frame.slots.index).split('/')[0].trim();
    numeral = `<text x="${face.rtl ? w - M : M}" y="${Math.round(h * 0.42)}"
        font-family="${brand.display}" font-weight="900" font-size="${Math.round(h * 0.3)}"
        letter-spacing="-14" fill="${brand.accent}" opacity=".9"${
        face.rtl ? ' direction="rtl"' : ''}>${esc(n)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><style>${FONT_CSS}</style></defs>
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  ${imageLayer(frame, brand)}
  ${chrome(frame, brand, M, L.chrome)}
  ${band}
  ${numeral}
  ${textEl({ rows, frame, M, top, lh, face: scaled, size, fill, align: L.align })}
  ${footer(frame, brand, M, L.chrome, L.align)}
</svg>`;
}
