const MAX_BYTES = 6 * 1024 * 1024;
const MAX_ENTRIES = 60;
const COALESCE_MS = 700;
export function createHistory(initial) {
let past = [];
let future = [];
let present = JSON.stringify(initial);
let lastPush = 0;
const bytes = () => past.reduce((n, s) => n + s.length, 0) + present.length
+ future.reduce((n, s) => n + s.length, 0);
function trim() {
while (past.length > MAX_ENTRIES || (bytes() > MAX_BYTES && past.length > 1)) {
past.shift();                       // drop the oldest reachable state
}
}
return {
push(deck) {
const next = JSON.stringify(deck);
if (next === present) return false;
const now = Date.now();
if (now - lastPush < COALESCE_MS && past.length) {
present = next;
lastPush = now;
future = [];
return true;
}
past.push(present);
present = next;
future = [];                        // a new edit invalidates the redo branch
lastPush = now;
trim();
return true;
},
undo() {
if (!past.length) return null;
future.unshift(present);
present = past.pop();
return JSON.parse(present);
},
redo() {
if (!future.length) return null;
past.push(present);
present = future.shift();
return JSON.parse(present);
},
sync(deck) { present = JSON.stringify(deck); lastPush = 0; },
reset(deck) { past = []; future = []; present = JSON.stringify(deck); lastPush = 0; },
canUndo: () => past.length > 0,
canRedo: () => future.length > 0,
stats: () => ({ undo: past.length, redo: future.length,
kb: Math.round(bytes() / 1024) }),
};
}