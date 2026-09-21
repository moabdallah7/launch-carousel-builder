# Fonts — attribution and licensing

Every typeface bundled with this project is licensed under the
**SIL Open Font License, Version 1.1 (OFL-1.1)**. Full licence text for each is in
[`assets/fonts/licenses/`](assets/fonts/licenses/).

| Family | Weight | Subset | Designers | Copyright |
|---|---|---|---|---|
| Archivo | 900 | latin | Omnibus-Type | Copyright 2020 The Archivo Project Authors |
| Martian Mono | 600 | latin | Roman Shamin, Evil Martians | Copyright 2021 The Martian Mono Project Authors |
| IBM Plex Sans | 400 | latin | Mike Abbink, Bold Monday | Copyright © 2017 IBM Corp. |
| IBM Plex Sans Arabic | 400, 700 | arabic | Mike Abbink, Bold Monday, Khajag Apelian, Wael Morcos | Copyright © 2017 IBM Corp. |

Source: Google Fonts. All four are listed upstream under
`google/fonts/ofl/` and report `isOpenSource: true` in Google Fonts metadata.

## What OFL-1.1 permits here

- **Embedding** the fonts in this application, including as base64 data URIs — allowed.
- **Redistribution**, bundled with this software — allowed, provided the copyright
  notice and licence accompany the files. That is what `assets/fonts/licenses/`
  and this file are for.
- **Commercial use**, including a paid version of this tool — allowed.
- **Exported artwork** carries rasterised or outlined glyphs, not the font software,
  so users may use their exports commercially without any obligation.

## Constraints to respect

- **The fonts may not be sold on their own.** Selling this tool is fine; selling the
  typefaces as a font product is not.
- **"Plex" is a Reserved Font Name.** A *modified* version of IBM Plex may not be
  distributed under a name containing "Plex". We ship Google's own unmodified
  subset builds, so this does not apply — but it would if anyone re-subsets,
  re-hints or otherwise alters the files. Rename in that case.
- **Derivative fonts stay under OFL-1.1.** The licence is inherited.

## Adding or changing a face

1. Drop the `.woff2` into `assets/fonts/`.
2. Add an entry to `assets/fonts/fonts.json` (`family`, `weight`, `style`, `subset`, `file`).
3. Add its `OFL.txt` to `assets/fonts/licenses/` and a row to the table above.
4. Run `node scripts/build-fonts.mjs`.
5. Register it in `ensureFonts()` in `src/render.js` so the measuring canvas can
   see it — a face the document lacks measures as a fallback and silently
   breaks every width calculation.

Only add openly licensed fonts. A proprietary face embedded as base64 is
redistribution of the font software, which almost no commercial licence permits.
