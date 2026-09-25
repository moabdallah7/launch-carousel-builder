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
export function load() {
let raw = null;
try { raw = localStorage.getItem(KEY); } catch { return null; }
if (!raw) return null;
let deck;
try { deck = JSON.parse(raw); } catch { return { corrupt: true, raw }; }
return validate(deck) ? deck : { corrupt: true, raw };
}
export function clear() {
try { localStorage.removeItem(KEY); } catch {  }
}
export function debounce(fn, ms = 400) {
let t;
return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}