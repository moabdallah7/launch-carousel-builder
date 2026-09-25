export const SIZES = {
carousel: { label: 'Carousel · 1080×1350', w: 1080, h: 1350 },
square:   { label: 'Square · 1080×1080',   w: 1080, h: 1080 },
story:    { label: 'Story · 1080×1920',    w: 1080, h: 1920 },
};
export const SCHEMA_VERSION = 1;
import { rhythmFor } from './layouts.js';
const STARTER = [
['Everyone ships.\nWe stay.', 'Say the one thing that separates you. Short beats clever.'],
['The problem',               'Name the thing your reader already feels but has not said.'],
['Why it happens',            'One cause, plainly. Resist listing three.'],
['What we do',                'The change you make, in the reader\u2019s words not yours.'],
['Proof',                     'A number, a name, or a result. Something checkable.'],
['How it works',              'Three steps at most. This is the swipe people stop on.'],
['What you get',              'Deliverables, not adjectives.'],
['Who it is for',             'Being specific here loses the wrong people on purpose.'],
['The objection',             'Answer the reason they would say no, before they do.'],
['Do the thing',              'One instruction. One way to reach you.'],
];
function starterFor(seed) {
const subject = (seed?.subject || '').trim();
const brand = (seed?.brandName || '').trim();
if (!subject && !brand) return STARTER;
const NAME = brand || subject;
const sentence = subject
? subject.charAt(0).toUpperCase() + subject.slice(1) + (/[.!?]$/.test(subject) ? '' : '.')
: 'Say the one thing that separates you. Short beats clever.';
const copy = STARTER.map((row) => [...row]);
copy[0] = [`Introducing\n${NAME}.`, sentence];
copy[copy.length - 1] = [`Try\n${NAME}.`, 'One instruction. One way to reach you.'];
return copy;
}
export function makeDeck(brand, sizeKey = 'carousel', count = 10, seed = null) {
const { w, h } = SIZES[sizeKey];
const n = Math.max(1, Math.min(20, count));
const starter = starterFor(seed);
return {
v: SCHEMA_VERSION,
id: 'launch-carousel',
name: 'Launch carousel',
size: sizeKey,
layout: 'statement',
brand,
frames: Array.from({ length: n }, (_, i) => {
const [headline, body] = starter[i % starter.length];
return {
id: `frame-${String(i + 1).padStart(2, '0')}`,
w, h,
layout: rhythmFor(i),
slots: { headline, body, index: `${String(i + 1).padStart(2, '0')} / ${n}` },
};
}),
};
}
export function resizeDeck(deck, sizeKey) {
const { w, h } = SIZES[sizeKey];
deck.size = sizeKey;
deck.frames.forEach((f) => { f.w = w; f.h = h; });
return deck;
}
export function reindex(deck) {
const n = deck.frames.length;
deck.frames.forEach((f, i) => {
f.id = `frame-${String(i + 1).padStart(2, '0')}`;
f.slots.index = `${String(i + 1).padStart(2, '0')} / ${n}`;
});
return deck;
}
export function addFrame(deck, at) {
const { w, h } = SIZES[deck.size];
deck.frames.splice(at + 1, 0, {
id: 'tmp', w, h,
layout: rhythmFor(at + 1),
slots: { headline: 'New frame', body: 'Say something worth the swipe.', index: '' },
});
return reindex(deck);
}
export function removeFrame(deck, at) {
if (deck.frames.length <= 1) return deck;
deck.frames.splice(at, 1);
return reindex(deck);
}