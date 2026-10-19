(function () {
'use strict';
var GATE_P = 0.985;
function setY(y) {
var l = window.__lenis;
y = Math.max(0, Math.round(y));
if (l && typeof l.resize === 'function') l.resize();
if (l && typeof l.scrollTo === 'function') {
l.scrollTo(y, { immediate: true, force: true });
}
window.scrollTo(0, y);
if (window.ScrollTrigger && typeof window.ScrollTrigger.update === 'function') {
window.ScrollTrigger.update();
}
}
function goTo(y, seconds) {
var l = window.__lenis;
if (l && typeof l.resize === 'function') l.resize();
if (!seconds) { setY(y); return; }
var from = window.scrollY, to = Math.max(0, Math.round(y));
var t0 = performance.now(), ms = seconds * 1000;
var done = false;
(function step(now) {
var p = Math.min(1, (now - t0) / ms);
var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
setY(from + (to - from) * e);
if (p < 1) requestAnimationFrame(step); else done = true;
})(t0);
setTimeout(function () { if (!done) setY(to); }, ms + 150);
}
var GATE_P = 0.985;
function remeasure() {
requestAnimationFrame(function () {
if (window.__lenis && typeof window.__lenis.resize === 'function') window.__lenis.resize();
});
}
if (document.readyState === 'complete') setTimeout(remeasure, 300);
else window.addEventListener('load', function () { setTimeout(remeasure, 300); });
var skip = document.querySelector('.hs__skip');
var hs = document.querySelector('.hs');
if (skip && hs) {
skip.addEventListener('click', function (e) {
e.preventDefault();
e.stopImmediatePropagation();
remeasure();
goTo(hs.offsetTop + Math.max(0, hs.offsetHeight - window.innerHeight) * GATE_P);
}, true);
}
function showChrome() {
document.body.classList.add('is-landed');
document.documentElement.classList.add('hdr-on');
}
(function watchBack() {
var hs2 = document.querySelector('.hs');
if (!hs2) return;
window.addEventListener('scroll', function () {
if (!document.body.classList.contains('is-landed')) return;
var bottom = hs2.getBoundingClientRect().bottom;
if (bottom > 120) document.body.classList.remove('is-landed');
}, { passive: true });
})();
var ru = document.querySelector('.tri__part--ru');
if (ru) {
ru.addEventListener('click', function () {
setTimeout(function () {
var where = document.getElementById('where');
if (!where) return;
var hdr = document.getElementById('hdr');
var hdrH = (hdr && hdr.offsetHeight) ? hdr.offsetHeight : 72;
showChrome();
goTo(where.getBoundingClientRect().top + window.scrollY - hdrH, 0);
setTimeout(function () {
showChrome();
goTo(where.getBoundingClientRect().top + window.scrollY - hdrH, 0);
}, 60);
}, 16);
}, true);
}
(function railOverFooter() {
var foot = document.querySelector('.ftr');
if (!foot || !('IntersectionObserver' in window)) return;
new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
document.body.classList.toggle('is-at-footer', e.isIntersecting);
});
}, { threshold: 0 }).observe(foot);
})();
})();
