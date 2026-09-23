// Autosave to localStorage. No server, no account: a walk-in user's words
// never leave their browser, and a refresh does not destroy their work.
//
// Every read is guarded - private windows, cleared site data and storage-blocking
// settings all make these calls throw or return nothing.

const KEY = 'mudolooo.studio.deck.v1';

export function save(deck) {
  try {
    localStorage.setItem(KEY, JSON.stringify(deck));
    return true;
  } catch {
    return false;   // quota, private mode, storage disabled - not worth interrupting for
  }
}

const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Validate every frame, not just the top level. A deck whose shape passes but
 * whose frames are malformed is worse than one that fails outright: it reaches
 * the renderer, throws, and (if it were persisted) would throw again on every
 * future visit with the work trapped in storage.
 */
export function validate(deck) {
  if (!deck || typeof deck !== 'object') return false;
  if (!deck.brand || typeof deck.brand !== 'object') return false;
  if (!Array.isArray(deck.frames) || !deck.frames.length) return false;
  return deck.frames.every((f) =>
    f && typeof f === 'object'
    && isNum(f.w) && isNum(f.h)
    && f.slots && typeof f.slots === 'object'
    && isStr(f.slots.headline) && isStr(f.slots.body) && isStr(f.slots.index));
}

/**
 * @returns {object|null|{corrupt:true, raw:string}}
 *   a deck, nothing stored, or the raw payload so the app can offer it back
 *   to the user instead of discarding their work.
 */
export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  if (!raw) return null;
  let deck;
  try { deck = JSON.parse(raw); } catch { return { corrupt: true, raw }; }
  return validate(deck) ? deck : { corrupt: true, raw };
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to do */ }
}

/** Trailing-edge debounce so typing does not hit storage on every keystroke. */
export function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
