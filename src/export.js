export function svgToBlobUrl(svg) {
return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
}
export async function rasterise(svg, w, h, scale = 1) {
const url = svgToBlobUrl(svg);
try {
const img = new Image();
img.decoding = 'sync';
await new Promise((res, rej) => {
img.onload = res;
img.onerror = () => rej(new Error('SVG failed to load for rasterising'));
img.src = url;
});
if (img.decode) { try { await img.decode(); } catch {} }
const canvas = document.createElement('canvas');
canvas.width = Math.round(w * scale);
canvas.height = Math.round(h * scale);
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
return canvas;
} finally {
URL.revokeObjectURL(url);
}
}
export async function toPngBlob(svg, w, h, scale = 1) {
const canvas = await rasterise(svg, w, h, scale);
return new Promise((res) => canvas.toBlob(res, 'image/png'));
}
export async function downloadPng(svg, w, h, scale, filename) {
const blob = await toPngBlob(svg, w, h, scale);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
}