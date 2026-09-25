export const CHROME = { full: 'full', minimal: 'minimal', none: 'none' };
export const LAYOUTS = {
statement: {
label: 'Statement',
voice: 'display', casing: 'upper', align: 'start', anchor: 0.34,
size: 132, min: 44, leading: 0.88, tracking: -6, margin: 0.0667, chrome: 'full',
},
editorial: {
label: 'Editorial',
voice: 'serif', casing: 'none', align: 'start', anchor: 0.30,
size: 124, min: 44, leading: 1.02, tracking: -2, margin: 0.10, chrome: 'minimal',
},
quiet: {
label: 'Quiet',
voice: 'body', casing: 'none', align: 'center', anchor: 0.46,
size: 46, min: 26, leading: 1.45, tracking: 0, margin: 0.18, chrome: 'minimal',
},
poster: {
label: 'Poster',
voice: 'display', casing: 'upper', align: 'start', anchor: 0.20,
size: 190, min: 56, leading: 0.82, tracking: -9, margin: 0.033, chrome: 'none',
},
split: {
label: 'Split block',
voice: 'display', casing: 'upper', align: 'start', anchor: 0.30,
size: 112, min: 40, leading: 0.9, tracking: -5, margin: 0.0667, chrome: 'full',
band: true,
},
numbered: {
label: 'Big number',
voice: 'display', casing: 'upper', align: 'start', anchor: 0.56,
size: 88, min: 36, leading: 0.92, tracking: -4, margin: 0.0667, chrome: 'full',
numeral: true,
},
};
const RHYTHM = ['poster', 'editorial', 'statement', 'quiet', 'statement',
'numbered', 'editorial', 'quiet', 'split', 'poster'];
export const rhythmFor = (i) => RHYTHM[i % RHYTHM.length];
export const layoutOf = (frame, deck) =>
LAYOUTS[frame?.layout] ? frame.layout
: LAYOUTS[deck?.layout] ? deck.layout
: 'statement';