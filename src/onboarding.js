// First-run screen. Two questions, then a seeded deck.
//
// Deliberately not a multi-step wizard: a walk-in user who has to click "Next"
// three times before seeing anything usually doesn't. Everything here is
// skippable, and it never appears again once a deck is saved.

import { PRESETS } from './brand.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `
.ob-back{position:fixed;inset:0;z-index:50;background:#0b0b0b;display:grid;
  place-items:center;padding:24px;overflow:auto}
.ob{width:min(560px,100%);animation:ob-in .25s ease-out}
@keyframes ob-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ob h2{font-family:'Archivo',system-ui,sans-serif;font-weight:900;letter-spacing:-.04em;
  font-size:clamp(34px,6vw,56px);line-height:.95;margin:0 0 10px;color:#EDEDED}
.ob p.lede{color:#8a8a8a;margin:0 0 30px;font-size:15px;max-width:44ch}
.ob label{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  color:#7c7c7c;margin:20px 0 6px}
.ob input{width:100%;background:#000;border:1px solid #2a2a2a;color:#EDEDED;
  padding:13px 14px;font:15px/1.4 ui-sans-serif,system-ui,sans-serif;border-radius:3px}
.ob input:focus{outline:none;border-color:#B6FF00}
.ob .swatches{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.ob .sw{border:1px solid #2a2a2a;background:#000;cursor:pointer;border-radius:3px;
  padding:9px 11px;display:flex;align-items:center;gap:8px;color:#bdbdbd;font-size:12px}
.ob .sw[aria-pressed="true"]{border-color:#B6FF00;color:#EDEDED}
.ob .dot{width:13px;height:13px;border-radius:2px;display:block}
.ob .go{margin-top:30px;width:100%;background:#B6FF00;color:#000;border:0;padding:14px;
  font-weight:800;letter-spacing:.06em;font-size:14px;border-radius:3px;cursor:pointer}
.ob .skip{margin-top:12px;width:100%;background:transparent;color:#7c7c7c;border:0;
  padding:8px;font-size:12px;cursor:pointer;text-decoration:underline}
.ob .foot{margin-top:22px;font-size:11px;color:#5a5a5a;line-height:1.5}
`;

/**
 * @returns {Promise<{subject:string, brandName:string, preset:string}|null>}
 *          null when skipped.
 */
export function runOnboarding() {
  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const back = document.createElement('div');
    back.className = 'ob-back';
    back.innerHTML = `
      <div class="ob" role="dialog" aria-modal="true" aria-labelledby="ob-h">
        <h2 id="ob-h">Make a launch<br>carousel.</h2>
        <p class="lede">Ten frames, your colours, ready to post. Nothing is uploaded —
          everything happens in this browser.</p>

        <label for="ob-subject">What are you launching?</label>
        <input id="ob-subject" placeholder="a specialty coffee shop" autocomplete="off">

        <label for="ob-brand">What's it called?</label>
        <input id="ob-brand" placeholder="Halftone Coffee" autocomplete="off">

        <label>Pick a look</label>
        <div class="swatches" id="ob-sw">${
          Object.entries(PRESETS).map(([k, p], i) => `
            <button class="sw" data-k="${k}" aria-pressed="${i === 0}">
              <span class="dot" style="background:${p.accent}"></span>${esc(p.label)}
            </button>`).join('')}</div>

        <button class="go" id="ob-go">Build my deck</button>
        <button class="skip" id="ob-skip">Skip — start from a blank deck</button>
        <p class="foot">You can change any of this afterwards.</p>
      </div>`;
    document.body.appendChild(back);

    let preset = Object.keys(PRESETS)[0];
    const $ = (id) => back.querySelector('#' + id);

    $('ob-sw').addEventListener('click', (e) => {
      const btn = e.target.closest('.sw');
      if (!btn) return;
      preset = btn.dataset.k;
      $('ob-sw').querySelectorAll('.sw')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });

    const close = (value) => {
      back.remove();
      style.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    };

    const submit = () => close({
      subject: $('ob-subject').value.trim(),
      brandName: $('ob-brand').value.trim(),
      preset,
    });

    function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      if (e.key === 'Escape') close(null);
    }

    $('ob-go').onclick = submit;
    $('ob-skip').onclick = () => close(null);
    document.addEventListener('keydown', onKey);
    $('ob-subject').focus();
  });
}
