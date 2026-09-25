// Undo/redo over whole-deck snapshots.
//
// Snapshots rather than a command log: the deck is already plain JSON, so a
// snapshot is one stringify and correctness is free. A command log would be
// smaller but every future action would need a matching inverse, and one
// missing inverse silently corrupts the document.
//
// The cost is memory, and it is real: a deck with three images carries a few
// hundred KB per snapshot. So the stack is capped by BYTES, not by count -
// capping by count alone would hold ~10MB of image data on an image-heavy deck
// and nothing at all on a text one.

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_ENTRIES = 60;
// Typing fires a render per keystroke. Without coalescing, "HELLO WORLD" costs
// eleven undos to unwind - undo should step through edits, not characters.
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
    /** Record a new state. No-op when nothing actually changed. */
    push(deck) {
      const next = JSON.stringify(deck);
      if (next === present) return false;
      const now = Date.now();
      // Rapid consecutive edits collapse into the state before the burst, so one
      // undo removes a typed phrase rather than its last letter.
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
    /** Adopt a state without recording it - used after undo/redo re-render. */
    sync(deck) { present = JSON.stringify(deck); lastPush = 0; },
    reset(deck) { past = []; future = []; present = JSON.stringify(deck); lastPush = 0; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    stats: () => ({ undo: past.length, redo: future.length,
                    kb: Math.round(bytes() / 1024) }),
  };
}
