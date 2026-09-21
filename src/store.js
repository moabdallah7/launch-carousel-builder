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

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const deck = JSON.parse(raw);
    // shape check: a corrupt or older payload should start fresh, not crash the app
    if (!deck || !Array.isArray(deck.frames) || !deck.frames.length || !deck.brand) return null;
    return deck;
  } catch {
    return null;
  }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to do */ }
}

/** Trailing-edge debounce so typing does not hit storage on every keystroke. */
export function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
