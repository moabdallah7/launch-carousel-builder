# Launch Carousel Builder

Browser-based carousel maker. No server, no accounts, no uploads — a user's
words and images never leave their browser.

## Commands

```sh
npm start     # build, then serve dist/ — always run this before shipping
npm run build # write dist/ only
npm run dev   # serve source unbuilt, for fast iteration
```

`npm start` builds first on purpose: serving the source directly means you
never test what you actually upload. The dev server negotiates
`Content-Encoding` and serves the `.br`/`.gz` files the build produced, so the
bytes on the wire locally are the bytes a host would send.

No dependencies — `npm install` is not required.

**Upload `dist/` only.** It contains minified HTML/JS, the fonts, the OFL
licences, and pre-compressed `.gz`/`.br` copies of every text file.

## Size budget

Hosting is billed on bytes transferred, so the payload is structured around
what a visitor actually needs:

| | brotli |
|---|---|
| Code + HTML | 13.9 KB |
| Core fonts (Archivo, Martian Mono, IBM Plex Sans) | 40.8 KB |
| **First visit** | **54.7 KB** |
| + Instrument Serif — only when an Editorial frame renders | 14.7 KB |
| + IBM Plex Sans Arabic — only when Arabic is typed | 65.6 KB |

Before this structure it was a flat **230 KB for everyone**.

Three rules keep it there:

1. **Never base64 fonts for page load.** Data URIs cost +34% and gzip barely
   touches them. Fonts are `.woff2` files; base64 is built only at export time,
   where a rasterised SVG genuinely cannot fetch anything.
2. **Load fonts in groups.** Most visitors never need Arabic — that alone is
   more than the entire core set.
3. **Never inline fonts into preview SVGs.** They sit in a document that already
   has the faces. Doing so cost ~187 KB of string per frame, ten frames deep, on
   every keystroke.

Exported images are generated in the browser and never touch the server, so
they cost nothing in bandwidth.
