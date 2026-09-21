// A deck is plain JSON: { brand, layout, size, frames[] }.
// Serialisable by design - it is what autosave stores today and what a
// server would store later, without changing the renderer.

export const SIZES = {
  carousel: { label: 'Carousel · 1080×1350', w: 1080, h: 1350 },
  square:   { label: 'Square · 1080×1080',   w: 1080, h: 1080 },
  story:    { label: 'Story · 1080×1920',    w: 1080, h: 1920 },
};

export const SCHEMA_VERSION = 1;

const STARTER = [
  ['EVERYONE\nSHIPS.\nWE STAY.',  'Say the one thing that separates you. Short beats clever.'],
  ['THE PROBLEM',                 'Name the thing your reader already feels but has not said.'],
  ['WHY IT HAPPENS',              'One cause, plainly. Resist listing three.'],
  ['WHAT WE DO',                  'The change you make, in the reader’s words not yours.'],
  ['PROOF',                       'A number, a name, or a result. Something checkable.'],
  ['HOW IT WORKS',                'Three steps at most. This is the swipe people stop on.'],
  ['WHAT YOU GET',                'Deliverables, not adjectives.'],
  ['WHO IT IS FOR',               'Being specific here loses the wrong people on purpose.'],
  ['OBJECTION',                   'Answer the reason they would say no, before they do.'],
  ['DO THE THING',                'One instruction. One way to reach you.'],
];

export function makeDeck(brand, sizeKey = 'carousel', count = 10) {
  const { w, h } = SIZES[sizeKey];
  const n = Math.max(1, Math.min(20, count));
  return {
    v: SCHEMA_VERSION,
    id: 'launch-carousel',
    name: 'Launch carousel',
    size: sizeKey,
    layout: 'statement',
    brand,
    frames: Array.from({ length: n }, (_, i) => {
      const [headline, body] = STARTER[i % STARTER.length];
      return {
        id: `frame-${String(i + 1).padStart(2, '0')}`,
        w, h,
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
    slots: { headline: 'NEW FRAME', body: 'Say something worth the swipe.', index: '' },
  });
  return reindex(deck);
}

export function removeFrame(deck, at) {
  if (deck.frames.length <= 1) return deck;
  deck.frames.splice(at, 1);
  return reindex(deck);
}
