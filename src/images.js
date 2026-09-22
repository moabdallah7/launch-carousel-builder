// Client-side image import. Nothing is uploaded: the file is read, downscaled
// and re-encoded in the browser, then lives in the deck as a data URI.
//
// Downscaling is mandatory, not a nicety. A phone photo is 3-4 MB, base64
// inflates it by a third, and the whole deck autosaves into localStorage -
// which is ~5 MB for the entire origin. One raw photo would break autosave
// for everything else the user has done.

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;   // refuse absurd files before decoding
export const MAX_EDGE = 1600;                // plenty for a 1080px artboard at 2x
const QUALITY = 0.82;

/** WebP keeps alpha and is smaller; JPEG is the fallback for older browsers. */
function bestFormat() {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp')
    ? { type: 'image/webp', ext: 'webp' }
    : { type: 'image/jpeg', ext: 'jpg' };
}

const readAsDataURL = (file) => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result);
  fr.onerror = () => rej(new Error('Could not read that file.'));
  fr.readAsDataURL(file);
});

const loadImage = (src) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('That file is not an image this browser can open.'));
  img.src = src;
});

/**
 * @returns {Promise<{src:string, w:number, h:number, bytes:number, type:string}>}
 * @throws  {Error} with a message suitable for showing the user
 */
export async function importImage(file) {
  if (!file) throw new Error('No file chosen.');
  if (!file.type.startsWith('image/')) throw new Error('That is not an image file.');
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`That image is ${(file.size / 1048576).toFixed(0)} MB — too large. `
                  + 'Try one under 25 MB.');
  }

  const img = await loadImage(await readAsDataURL(file));
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const { type } = bestFormat();
  const src = canvas.toDataURL(type, QUALITY);

  // A data URI is ~4/3 of the bytes it encodes; this is the number that
  // actually counts against the storage budget.
  return { src, w, h, type, bytes: Math.round(src.length * 0.75) };
}

export const DEFAULT_IMAGE = {
  fit: 'cover',        // cover | contain
  opacity: 1,
  scrim: 0.45,         // darkening behind text - photos destroy legibility without it
};
