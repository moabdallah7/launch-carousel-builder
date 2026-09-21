// document + brand -> SVG string. Pure: identical inputs give identical output,
// which is what keeps the on-screen frame and the exported PNG in sync.

import { FONT_CSS } from './fonts.js';
import { contrastInk } from './brand.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- direction

// Arabic, Hebrew, Syriac, Thaana + Arabic presentation forms.
const RTL_RE = /[֐-׿؀-ۿ܀-ݏހ-޿ࢠ-ࣿיִ-﷿ﹰ-﻿]/;
export const isRTL = (s) => RTL_RE.test(String(s ?? ''));

// Latin faces carry no Arabic glyphs, so RTL text must switch family or it
// renders as fallback on screen and as tofu in the exported PNG.
const ARABIC_FAMILY = 'IBM Plex Sans Arabic';

/** @returns {{family:string, weight:number, tracking:number, rtl:boolean}} */
export function faceFor(text, brand, role, tracking = 0) {
  const rtl = isRTL(text);
  if (rtl) {
    // Negative tracking breaks Arabic letter joining - always zero it.
    return { family: ARABIC_FAMILY, weight: role === 'display' ? 700 : 400, tracking: 0, rtl };
  }
  if (role === 'display') return { family: brand.display, weight: 900, tracking, rtl };
  if (role === 'mono')    return { family: brand.mono,    weight: 600, tracking, rtl };
  return { family: brand.body, weight: 400, tracking, rtl };
}

// ---------------------------------------------------------------- fonts

// The SVG embeds FONT_CSS for export; the document needs the same faces or
// measureText silently measures a fallback and every width comes out wrong.
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
    document.fonts.load(`700 132px '${ARABIC_FAMILY}'`),
    document.fonts.load(`400 30px '${ARABIC_FAMILY}'`),
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

/** Greedy wrap by measured width. Honours newlines the user typed. */
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

/** Step size down until the longest line fits. Never guesses. */
function fitSize(rows, maxW, font, start, min) {
  let size = start;
  while (size > min) {
    const t = font.tracking * (size / start);
    const widest = Math.max(...rows.map((r) => measureText(r, { ...font, size, tracking: t })));
    if (widest <= maxW) break;
    size -= 2;
  }
  return size;
}

/**
 * One <text> block, direction-aware.
 * RTL anchors to the right margin so the layout mirrors rather than
 * leaving right-to-left text ragged against a left edge.
 */
function textEl({ rows, frame, M, top, lh, face, size, fill, opacity }) {
  const x = face.rtl ? frame.w - M : M;
  const attrs = [
    `font-family="${face.family}"`,
    `font-weight="${face.weight}"`,
    `font-size="${size}"`,
    face.tracking ? `letter-spacing="${face.tracking}"` : '',
    `fill="${fill}"`,
    opacity ? `opacity="${opacity}"` : '',
    // text-anchor is relative to inline direction: under rtl, "start" is the
    // RIGHT edge. Using "end" here anchors the left side and overflows right.
    face.rtl ? 'direction="rtl"' : '',
  ].filter(Boolean).join(' ');
  const spans = rows
    .map((r, i) => `<tspan x="${x}" y="${top + i * lh}">${esc(r)}</tspan>`).join('');
  return `<text ${attrs}>${spans}</text>`;
}

// ---------------------------------------------------------------- layouts

export const LAYOUTS = {
  statement: 'Statement',
  split: 'Split block',
  numbered: 'Big number',
};

function chrome(frame, brand, M) {
  const { w } = frame;
  const nameFace = faceFor(brand.name, brand, 'mono', 4.4);
  // brand name sits on the reading-start edge, index opposite - mirrored for RTL
  const nameX = nameFace.rtl ? w - M : M;
  const idxX  = nameFace.rtl ? M : w - M;
  const nameAnchor = nameFace.rtl ? ' direction="rtl"' : '';
  const idxAnchor  = nameFace.rtl ? '' : ' text-anchor="end"';
  return `
  <text x="${nameX}" y="${M + 14}" font-family="${nameFace.family}" font-weight="${nameFace.weight}"
        font-size="20"${nameFace.tracking ? ` letter-spacing="${nameFace.tracking}"` : ''}
        fill="${brand.mark}"${nameAnchor}>${esc(brand.name)}</text>
  <text x="${idxX}" y="${M + 14}" font-family="${brand.mono}" font-weight="600"
        font-size="20" letter-spacing="4.4" fill="${brand.muted}"${idxAnchor}>${esc(frame.slots.index)}</text>`;
}

const MAX_BODY_ROWS = 4;

function footer(frame, brand, M) {
  const { w, h } = frame;
  const face = faceFor(frame.slots.body, brand, 'body');
  const font = { ...face, size: 30 };
  const all = wrap(frame.slots.body, w - M * 2, font);
  const rows = all.slice(0, MAX_BODY_ROWS);
  // Truncation must be visible, never silent.
  if (all.length > MAX_BODY_ROWS) rows[MAX_BODY_ROWS - 1] += ' …';

  const tagFace = faceFor(brand.tag, brand, 'mono', -0.5);
  const tagW = Math.round(measureText(brand.tag, { ...tagFace, size: 26 }) + 32);
  const tagX = tagFace.rtl ? w - M - tagW : M;
  const tagInk = contrastInk(brand.accent);
  const bodyTop = h - 250 - (rows.length - 1) * 38;

  return `
  ${textEl({ rows, frame, M, top: bodyTop, lh: 38, face, size: 30, fill: brand.muted })}
  <rect x="${tagX}" y="${h - 200}" width="${tagW}" height="54" fill="${brand.accent}"/>
  <text x="${tagFace.rtl ? tagX + tagW - 16 : tagX + 16}" y="${h - 163}"
        font-family="${tagFace.family}" font-weight="${tagFace.weight}" font-size="26"${
        tagFace.tracking ? ` letter-spacing="${tagFace.tracking}"` : ''}
        fill="${tagInk}"${tagFace.rtl ? ' direction="rtl"' : ''}>${esc(brand.tag)}</text>
  <rect x="${M}" y="${h - 96}" width="${w - M * 2}" height="2" fill="${brand.muted}" opacity=".25"/>`;
}

const BODY = {
  statement(frame, brand, M) {
    const { w, h } = frame;
    const maxW = w - M * 2;
    const face = faceFor(frame.slots.headline, brand, 'display', -6);
    const rows = wrap(frame.slots.headline, maxW, { ...face, size: 132 });
    const size = fitSize(rows, maxW, face, 132, 44);
    const scaled = { ...face, tracking: face.tracking * (size / 132) };
    return textEl({ rows, frame, M, top: Math.round(h * 0.34),
                    lh: Math.round(size * 0.88), face: scaled, size, fill: brand.ink });
  },

  split(frame, brand, M) {
    const { w, h } = frame;
    const maxW = w - M * 2 - 48;
    const face = faceFor(frame.slots.headline, brand, 'display', -5);
    const rows = wrap(frame.slots.headline, maxW, { ...face, size: 112 });
    const size = fitSize(rows, maxW, face, 112, 40);
    const lh = Math.round(size * 0.9);
    const top = Math.round(h * 0.3);
    const scaled = { ...face, tracking: face.tracking * (size / 112) };
    return `
  <rect x="0" y="${top - lh}" width="${w}" height="${rows.length * lh + 56}" fill="${brand.accent}"/>
  ${textEl({ rows, frame, M, top, lh, face: scaled, size, fill: contrastInk(brand.accent) })}`;
  },

  numbered(frame, brand, M) {
    const { w, h } = frame;
    const n = String(frame.slots.index).split('/')[0].trim();
    const maxW = w - M * 2;
    const face = faceFor(frame.slots.headline, brand, 'display', -4);
    const rows = wrap(frame.slots.headline, maxW, { ...face, size: 88 });
    const size = fitSize(rows, maxW, face, 88, 36);
    const scaled = { ...face, tracking: face.tracking * (size / 88) };
    const numX = face.rtl ? w - M : M;
    const numAnchor = face.rtl ? ' direction="rtl"' : '';
    return `
  <text x="${numX}" y="${Math.round(h * 0.42)}" font-family="${brand.display}" font-weight="900"
        font-size="${Math.round(h * 0.3)}" letter-spacing="-14" fill="${brand.accent}"
        opacity=".9"${numAnchor}>${esc(n)}</text>
  ${textEl({ rows, frame, M, top: Math.round(h * 0.56), lh: Math.round(size * 0.92),
             face: scaled, size, fill: brand.ink })}`;
  },
};

export function renderFrame(frame, brand, layout = 'statement') {
  const { w, h } = frame;
  const M = Math.round(w * 0.0667);
  const draw = BODY[layout] || BODY.statement;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><style>${FONT_CSS}</style></defs>
  <rect width="${w}" height="${h}" fill="${brand.bg}"/>
  ${chrome(frame, brand, M)}
  ${draw(frame, brand, M)}
  ${footer(frame, brand, M)}
</svg>`;
}
