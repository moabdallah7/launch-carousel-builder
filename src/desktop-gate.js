const KEY = 'mudolooo.studio.forceDesktop';
const CSS = `
.dg{position:fixed;inset:0;z-index:100;background:#0b0b0b;color:#EDEDED;display:grid;
place-items:center;padding:28px;overflow:auto;
font:15px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif}
.dg-in{width:min(460px,100%)}
.dg h2{font-family:'Archivo',system-ui,sans-serif;font-weight:900;letter-spacing:-.04em;
font-size:clamp(30px,8vw,44px);line-height:.98;margin:0 0 16px}
.dg p{color:#9a9a9a;margin:0 0 14px}
.dg .mark{font-family:'Martian Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.22em;
color:#B6FF00;margin:0 0 22px}
.dg .cta{display:inline-block;margin-top:12px;background:#B6FF00;color:#000;
padding:13px 20px;border-radius:3px;font-weight:800;letter-spacing:.04em;
text-decoration:none;font-size:14px}
.dg .alt{display:block;margin-top:20px;background:none;border:0;color:#6f6f6f;
font-size:12px;text-decoration:underline;cursor:pointer;padding:0}
.dg .w{margin-top:26px;font-size:11px;color:#4f4f4f}
`;
export function requireDesktop({ minWidth = 820, studio = {} } = {}) {
const wide = () => window.innerWidth >= minWidth;
let forced = false;
try { forced = sessionStorage.getItem(KEY) === '1'; } catch {  }
if (wide() || forced) return Promise.resolve();
return new Promise((resolve) => {
const style = document.createElement('style');
style.textContent = CSS;
document.head.appendChild(style);
const href = studio.url || (studio.email ? `mailto:${studio.email}` : null);
const el = document.createElement('div');
el.className = 'dg';
el.innerHTML = `
<div class="dg-in" role="dialog" aria-modal="true">
${studio.name ? `<p class="mark">${studio.name}</p>` : ''}
<h2>Built for a<br>bigger screen.</h2>
<p>This builder puts a full-size preview, ten frames and the controls
side by side. On a phone it would be a worse version of itself, so we
didn't make one.</p>
<p>Open it on a laptop or desktop and it takes about two minutes.</p>
${href ? `<a class="cta" href="${href}">Talk to the studio →</a>` : ''}
<button class="alt" type="button">Continue anyway on this screen</button>
<p class="w">Your work saves in this browser, so it will still be here
when you come back on a larger screen.</p>
</div>`;
document.body.appendChild(el);
const done = () => {
window.removeEventListener('resize', onResize);
el.remove();
style.remove();
resolve();
};
function onResize() { if (wide()) done(); }
window.addEventListener('resize', onResize);
el.querySelector('.alt').onclick = () => {
try { sessionStorage.setItem(KEY, '1'); } catch {  }
done();
};
});
}