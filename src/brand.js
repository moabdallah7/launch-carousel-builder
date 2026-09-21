// Brand is INPUT, not a constant. A walk-in user's deck should look like theirs.
// Kept as plain serialisable data so a saved deck fully reproduces its design.

export const FONTS = {
  display: ['Archivo', 'Martian Mono'],
  body: ['IBM Plex Sans', 'Martian Mono'],
};

export const DEFAULT_BRAND = {
  name: 'YOUR STUDIO',
  bg: '#000000',
  ink: '#EDEDED',
  muted: '#8F8F8F',
  accent: '#B6FF00',
  mark: '#FF1FA0',
  display: 'Archivo',
  body: 'IBM Plex Sans',
  mono: 'Martian Mono',
  tag: '#YOURTAG',
};

export const PRESETS = {
  mudolooo: { label: 'MUDOLOOO',  bg: '#000000', ink: '#EDEDED', muted: '#8F8F8F',
              accent: '#B6FF00', mark: '#FF1FA0' },
  paper:    { label: 'Paper',     bg: '#F4F3EE', ink: '#1A1A18', muted: '#6B6A63',
              accent: '#C8FF3D', mark: '#1A1A18' },
  ink:      { label: 'Ink',       bg: '#11151C', ink: '#F2F5F7', muted: '#8C97A3',
              accent: '#4ADE80', mark: '#38BDF8' },
  clay:     { label: 'Clay',      bg: '#2B211C', ink: '#F6EFE9', muted: '#A8968A',
              accent: '#FF8A3D', mark: '#FFD6A5' },
};

export function applyPreset(brand, key) {
  const p = PRESETS[key];
  if (!p) return brand;
  const { label, ...colours } = p;
  return { ...brand, ...colours };
}

// Readable text on any user-chosen accent - relative luminance per WCAG.
export function contrastInk(hex) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? '#000000' : '#FFFFFF';
}
