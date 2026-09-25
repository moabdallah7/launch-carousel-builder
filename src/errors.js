export function installErrorHandlers(report) {
window.addEventListener('error', (e) => {
report(e.error || new Error(e.message), 'uncaught');
});
window.addEventListener('unhandledrejection', (e) => {
report(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), 'promise');
});
}
export function attempt(fn, report, label) {
try {
fn();
return true;
} catch (err) {
report(err, label);
return false;
}
}
export function createErrorBar(host) {
const bar = document.createElement('div');
bar.className = 'errbar';
bar.hidden = true;
bar.innerHTML = `<span class="errbar-msg"></span>`
+ `<button type="button" class="errbar-x" aria-label="Dismiss">✕</button>`;
host.prepend(bar);
bar.querySelector('.errbar-x').onclick = () => { bar.hidden = true; };
return {
show(msg) {
bar.querySelector('.errbar-msg').textContent = msg;
bar.hidden = false;
},
hide() { bar.hidden = true; },
};
}
export function downloadBackup(raw, filename = 'carousel-backup.json') {
try {
const blob = new Blob([typeof raw === 'string' ? raw : JSON.stringify(raw)],
{ type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
return true;
} catch {
return false;
}
}
export const ERR_CSS = `
.errbar{display:flex;gap:10px;align-items:flex-start;background:#2a1414;
border:1px solid #5c2020;color:#ffb4b4;padding:10px 12px;border-radius:3px;
font-size:12px;line-height:1.45;margin-bottom:14px}
.errbar-msg{flex:1}
.errbar-x{background:none;border:0;color:#ffb4b4;cursor:pointer;font-size:12px;
padding:0;line-height:1.45}
`;