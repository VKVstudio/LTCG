(function () {
'use strict';
var html  = document.documentElement;
var scene = document.querySelector('[data-hero-mobile]');
if (!scene) return;
var SITE_ROOT = html.getAttribute('data-site-root') || '/';
var VQ = html.getAttribute('data-v') ? '?v=' + html.getAttribute('data-v') : '';
var NS = 'http://www.w3.org/2000/svg';
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var SEEN = 'ltcg-splash-seen';
function seen(v) {
try {
if (v) { sessionStorage.setItem(SEEN, '1'); return true; }
return sessionStorage.getItem(SEEN) === '1';
} catch (e) { return false; }
}
var hs       = document.querySelector('.hs');
var screenEl = document.querySelector('.hs__screen');
var svg      = scene.querySelector('.hm__vec');
var edge     = scene.querySelector('.hm__edge');
var gLogo    = scene.querySelector('.hm__logo');
var veil     = scene.querySelector('.hm__veil');
var skip     = document.querySelector('.hs__skip');
var head     = document.getElementById('siteHead');
if (!svg || !edge || !gLogo) return;
var locked = false;
function lock()   { if (!locked) { locked = true;  html.classList.add('hm-lock'); } }
function unlock() { if (locked)  { locked = false; html.classList.remove('hm-lock'); } }
html.classList.add('hm-run');
lock();
html.style.setProperty('--gate', '1');
var earlyHint = document.getElementById('triHint');
if (earlyHint) { earlyHint.hidden = false; earlyHint.classList.add('is-in'); }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function outCubic(p) { return 1 - Math.pow(1 - p, 3); }
function inOutCubic(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
var T = {
draw:    [   0, 1500],
veil:    [1100, 2900],
morph:   [1400, 2750],
xfade:   [2600, 3050],
swoosh:  [2900, 3450],
letters: [3300, 3800],
tag:     [3600, 4050],
lift:    [3900, 4700]
};
var TOTAL = 4700;
function seg(t, k, ease) {
var a = T[k][0], b = T[k][1];
return (ease || outCubic)(clamp01((t - a) / (b - a)));
}
var M = null, vw = 0, vh = 0, cov = null, pl = null;
function measure() {
vw = scene.clientWidth || window.innerWidth;
vh = scene.clientHeight || window.innerHeight;
var s = Math.max(vw / M.frame[0], vh / M.frame[1]);
cov = { s: s, ox: (vw - M.frame[0] * s) / 2, oy: (vh - M.frame[1] * s) / 2 };
var LB = M.logoBox, bw = LB[2] - LB[0], bh = LB[3] - LB[1];
var cap = vw < 520 ? 300 : 420;
var lw = Math.min(vw * 0.64, cap), k = lw / bw, lh = bh * k;
var gateH = screenEl ? screenEl.offsetHeight : vh * 0.46;
pl = {
k: k, lw: lw, lh: lh, LB: LB,
cy0: cov.oy + M.anchors.ridge.masis_apex[1] * s + lh * 0.30,
cy1: Math.max(lh / 2 + 18, (vh - gateH) / 2)
};
}
function ridgeS(i) {
return [cov.ox + M.ridge[i][0] * cov.s, cov.oy + M.ridge[i][1] * cov.s];
}
function logoOrigin(lift) {
var cy = pl.cy0 + (pl.cy1 - pl.cy0) * lift;
return [vw / 2 - pl.lw / 2 - pl.LB[0] * pl.k, cy - pl.lh / 2 - pl.LB[1] * pl.k];
}
function edgeS(i, lift) {
var o = logoOrigin(lift);
return [o[0] + M.edge[i][0] * pl.k, o[1] + M.edge[i][1] * pl.k];
}
function pathD(m, lift) {
var d = '', i, a, b, x, y;
for (i = 0; i < M.ridge.length; i++) {
a = ridgeS(i); b = edgeS(i, lift);
x = a[0] + (b[0] - a[0]) * m;
y = a[1] + (b[1] - a[1]) * m;
d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
}
return d;
}
var gMt = null, gSw = null, gLt = null, gTg = null, wipeRect = null;
function buildLogo(doc) {
var pick = function (id) { return doc.getElementById(id); };
var mk = function (d, rule) {
var p = document.createElementNS(NS, 'path');
p.setAttribute('d', d);
if (rule) p.setAttribute('fill-rule', rule);
return p;
};
var clone = function (id, target) {
var s = pick(id); if (!s || !target) return;
var c = s.cloneNode(true);
c.removeAttribute('id');
c.querySelectorAll('[fill]').forEach(function (el) { el.removeAttribute('fill'); });
c.removeAttribute('fill');
target.appendChild(c);
};
var g = function (cls) {
var el = document.createElementNS(NS, 'g');
el.setAttribute('class', cls);
gLogo.appendChild(el);
return el;
};
gMt = g('hm__mt'); gSw = g('hm__sw'); gLt = g('hm__lt'); gTg = g('hm__tg');
var main  = pick('mountain-main');
var third = pick('mountain-third');
var lower = pick('swoosh-lower');
var snow  = ['snow-sis', 'snow-masis'].map(function (id) {
var e = pick(id); return e ? e.getAttribute('d') : '';
}).join(' ');
if (main)  gMt.appendChild(mk(main.getAttribute('d') + ' ' + snow, 'evenodd'));
if (third) gMt.appendChild(mk(third.getAttribute('d')));
if (lower) gSw.appendChild(mk(lower.getAttribute('d')));
clone('swoosh-upper', gSw);
clone('arrowhead', gSw);
clone('letters', gLt);
clone('tagline', gTg);
var defs = document.createElementNS(NS, 'defs');
var cp = document.createElementNS(NS, 'clipPath');
cp.setAttribute('id', 'hmWipe');
cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
wipeRect = document.createElementNS(NS, 'rect');
wipeRect.setAttribute('x', '0');
wipeRect.setAttribute('y', '0');
wipeRect.setAttribute('height', '1024');
wipeRect.setAttribute('width', '0');
cp.appendChild(wipeRect);
defs.appendChild(cp);
svg.insertBefore(defs, svg.firstChild);
gSw.setAttribute('clip-path', 'url(#hmWipe)');
}
var lastLift = -1, ended = false;
function render(t) {
var mDraw  = seg(t, 'draw');
var mVeil  = seg(t, 'veil');
var mMorph = seg(t, 'morph', inOutCubic);
var mFade  = seg(t, 'xfade');
var mSw    = seg(t, 'swoosh');
var mLt    = seg(t, 'letters');
var mTg    = seg(t, 'tag');
var mLift  = seg(t, 'lift', inOutCubic);
if (mFade < 1) {
edge.setAttribute('d', pathD(mMorph, 1));
if (mDraw < 1) {
var len = edge.getTotalLength();
edge.style.strokeDasharray = String(len);
edge.style.strokeDashoffset = String(len * (1 - mDraw));
} else if (edge.style.strokeDasharray) {
edge.style.strokeDasharray = '';
edge.style.strokeDashoffset = '';
}
}
edge.style.opacity = String(1 - mFade);
if (lastLift !== 1) {
var o = logoOrigin(1);
gLogo.setAttribute('transform',
'translate(' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + ') scale(' + pl.k.toFixed(4) + ')');
lastLift = 1;
}
gMt.style.opacity = String(mFade);
gSw.style.opacity = mSw > 0 ? '1' : '0';
if (wipeRect) wipeRect.setAttribute('width', String(Math.round(1024 * mSw)));
gLt.style.opacity = String(mLt);
gTg.style.opacity = String(mTg);
if (veil) veil.style.opacity = String(mVeil);
html.style.setProperty('--gate', '1');
if (skip) skip.style.opacity = String(clamp01(1 - mLift * 2));
}
var t0 = 0, raf = 0, guard = 0;
function step(now) {
var t = now - t0;
if (t >= TOTAL) { render(TOTAL); finish(); return; }
render(t);
raf = requestAnimationFrame(step);
}
function finish() {
if (ended) return;
ended = true;
html.style.setProperty('--gate', '1');
if (raf) { cancelAnimationFrame(raf); raf = 0; }
if (guard) { clearTimeout(guard); guard = 0; }
html.classList.remove('hm-run');
html.classList.add('hm-gate');
seen(true);
requestAnimationFrame(function () {
if (!screenEl) { unlock(); return; }
var r = screenEl.getBoundingClientRect();
if (!r.height || r.top > window.innerHeight - 48) {
unlock();
html.classList.remove('hm-gate');
html.classList.add('hm-done');
}
});
setTimeout(function () {
if (!locked || !screenEl) return;
var r = screenEl.getBoundingClientRect();
if (!r.height || r.top > window.innerHeight - 48) {
unlock();
html.classList.remove('hm-gate');
html.classList.add('hm-done');
}
}, 900);
var hint = document.getElementById('triHint');
if (hint) { hint.hidden = false; hint.classList.add('is-in'); }
}
function jumpToEnd() { if (!ended) { render(TOTAL); finish(); } }
function release() {
jumpToEnd();
unlock();
html.classList.remove('hm-gate');
html.classList.add('hm-done');
if (head) {
head.style.setProperty('--head-in', '0');
head.style.setProperty('--brand-o', '1');
}
}
function onPick(e) {
var a = e.target && e.target.closest ? e.target.closest('.tri__part[data-lang]') : null;
if (!a || a.classList.contains('is-soon')) return;
release();
setTimeout(function () {
if (window.scrollY > 24) return;
var where = document.getElementById('where') ||
document.querySelector('.hs') && document.querySelector('.hs').nextElementSibling;
if (!where) return;
window.scrollTo(0, Math.round(where.getBoundingClientRect().top + window.scrollY));
}, 700);
}
document.addEventListener('click', onPick, true);
scene.addEventListener('click', jumpToEnd);
scene.addEventListener('touchstart', jumpToEnd, { passive: true });
if (skip) {
skip.addEventListener('click', function (e) { e.preventDefault(); jumpToEnd(); });
}
function repaint() {
measure();
lastLift = -1;
render(ended ? TOTAL : (performance.now() - t0));
}
function start() {
measure();
var resizeT = 0;
addEventListener('resize', function () {
clearTimeout(resizeT);
resizeT = setTimeout(repaint, 120);
}, { passive: true });
addEventListener('orientationchange', function () { setTimeout(repaint, 260); });
scene.classList.add('is-ready');
if (reduce || seen()) {
render(TOTAL); finish();
if (seen()) { unlock(); html.classList.remove('hm-gate'); html.classList.add('hm-done'); }
return;
}
t0 = performance.now();
raf = requestAnimationFrame(step);
guard = setTimeout(jumpToEnd, TOTAL + 1200);
}
Promise.all([
fetch(SITE_ROOT + 'assets/hero/m/morph.json' + VQ).then(function (r) { return r.json(); }),
fetch(SITE_ROOT + 'assets/hero/logo.svg' + VQ).then(function (r) { return r.text(); })
]).then(function (res) {
M = res[0];
buildLogo(new DOMParser().parseFromString(res[1], 'image/svg+xml'));
start();
}).catch(function (err) {
console.error('[hero-mobile]', err);
scene.classList.add('is-off');
html.classList.remove('hm-run');
html.classList.add('hm-gate');
html.style.setProperty('--gate', '1');
unlock();
});
})();
