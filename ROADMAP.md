# Launch Carousel Builder — Roadmap

A browser-based tool where anyone can walk in and make a launch carousel.
Free beta, no accounts, nothing uploaded.

---

## Principles

These are decisions already paid for. Changing one is a rewrite, not a tweak.

1. **Client-side only.** No server, no accounts, no uploads. A user's words never
   leave their browser. This is why there is no database to secure and no privacy
   exposure beyond hosting logs — and it is worth protecting.
2. **The document is plain JSON.** `{ v, brand, layout, size, frames[] }`.
   Autosave stores it today; a server could store the same object later without
   touching the renderer.
3. **Measure, never guess.** Every text box is sized with `measureText` against the
   real font. Guessed advances were the first bug this project hit.
4. **The renderer is pure.** Same inputs, same SVG — which is what keeps the
   on-screen frame and the exported PNG identical.
5. **Fonts are embedded twice.** In the SVG for export, in the document for
   measurement. Miss either and output silently drifts.

---

## Where it stands

**Done**

- Document model + pure SVG renderer
- Browser-only export: PNG @1×/@2×, SVG, and whole-deck ZIP
- Hand-rolled STORE-only ZIP writer (no library, no CDN)
- Shrink-to-fit headlines, greedy wrap, visible `…` on body overflow
- Brand as input: name, hashtag, 4 colours, 4 presets
- Automatic contrast — text on any accent colour picks black or white by WCAG luminance
- 3 layouts (Statement, Split block, Big number), 3 sizes
- Add / remove / renumber frames
- Autosave to `localStorage`, guarded against private-mode failures
- **RTL / Arabic**: script detection, Arabic face embedded, mirrored chrome,
  direction-aware anchoring, tracking zeroed to preserve letter joining
- **Onboarding** (A1): two questions on first run, seeded deck, skippable,
  never shown again once a deck is saved
- **Desktop gate** (A5, resolved by *not* building a phone UI): below 820px
  visitors get an honest "built for a bigger screen" page with a link to the
  studio, an escape hatch, and auto-dismiss on widening
- Fonts generated at build time; all faces OFL-1.1 with licences bundled
- **Per-frame layouts + deck rhythm** (A3): 6 structurally different layouts,
  varied automatically across a deck so it reads loud / quiet / loud
- Second type voice (Instrument Serif) and per-layout casing, chrome and margin
- **Image layers**: client-side import, downscaled and re-encoded in the browser,
  cover/fit, adjustable scrim; free tier capped at 3 per deck

**Verified**

- 10/10 ZIP entries valid PNGs at 2160×2700, CRC32 independently recomputed
- Zero text overflows across all layouts, both directions, light and dark themes
- Zero third-party network requests

---

## Phase A — usable beta

Goal: a stranger gets a good carousel without being taught.

| # | Item | Why |
|---|---|---|
| A2 | **Logo upload** | Brand is colours and text only. Client-side file read to a data URI — no upload. |
| A4 | **Character-count feedback** | Warn before truncation, don't just show `…` after the fact. |
| A6 | **Undo/redo** | Command log. Cheap now, a rewrite later. |

### Why there is no phone UI

Deliberate, not missing. The app's chrome is a fixed 488px, so below ~820px the
preview collapses — at 390px the stage measures 48px and the frame does not
render at all.

A phone version would also fail at the finish line regardless of layout: the
deliverable is a ZIP of ten 2160x2700 PNGs, which iOS cannot unzip or move to
the camera roll. The user could not post what they made.

So narrow screens get a clear page and a link to the studio instead. It costs
a turned-away visitor 19KB and no font downloads, and it converts better than
an editor that cannot finish the job. Revisit only if analytics show real phone
traffic *and* single-frame export lands.

## Phase B — public launch

| # | Item | Why |
|---|---|---|
| B1 | **Hosting** | Static files, any host. Keep the zero-third-party property. |
| B2 | **"Made with" CTA** | The lead-gen mechanism. Optional watermark, link back to the studio. |
| B3 | **Privacy page** | Short and true: nothing collected. Mirrors the studio site's. |
| B4 | **Error boundary** | One thrown render must not blank the app and lose their work. |
| B5 | **Cross-browser pass** | Safari and Firefox differ on `ctx.letterSpacing` and SVG rasterising. Currently unverified outside Chromium. |

## Phase C — editor

Only worth starting once Phase A proves people finish a deck.

| # | Item |
|---|---|
| C1 | Layers array replacing fixed slots — do this **before** direct manipulation |
| C2 | Selection, move, resize |
| C3 | Add / delete / reorder layers |
| C4 | Snapping and alignment guides |
| C5 | Image layers as *movable* layers, not just frame backgrounds |

## Phase D — if it earns it

Deferred on purpose. Each one brings back the server we avoided.

- Accounts and saved projects
- Team brand kits
- One design → every ad placement (the "42 placements, 1 system" feature)

### Paid tier

`src/limits.js` holds the ceilings; the tier is one constant in `index.html`.
Free is 3 images and 10 frames, Pro lifts both. There is **no payment flow and
no upgrade path yet** — the gate exists so the ceiling is visible from the
start rather than appearing after people have built decks that suddenly break.

Before charging, this needs: a real upgrade route, a decision on how tier is
stored without accounts (and it probably cannot be, honestly — a client-side
limit is a suggestion, not an enforcement), and a view on whether images are
the right thing to meter at all.

---

## Still looks same-y

Variation now comes from layout, voice, casing, scale and chrome. What is still
missing is everything that is not type on flat colour:

- ~~No imagery~~ — background images with scrim are in (3 per deck on free).
  Still no texture, pattern or duotone treatment.
- **One accent per deck.** Frames cannot carry their own colour.
- **Quiet frames can read as empty** at thumbnail size, which is the cost of
  the breathing room they buy.

## Known issues

- Arabic headline ink overhangs the right margin by ~2.4px (glyph overhang, not
  misalignment). Cosmetic at current margins.
- Body copy is capped at 4 wrapped rows; overflow shows `…`.
- Only Chromium is tested.
- Arabic display weight is 700 — the latin display face is 900, so weight differs
  between scripts. An Arabic display face would close the gap.
- `Big number` layout renders its numeral in the latin display face regardless of
  script, so Arabic-Indic numerals are not used.
