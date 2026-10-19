(function () {
'use strict';
var d = document;
var btn = d.querySelector('[data-burger]');
var head = d.querySelector('.hdr');
if (!btn || !head) return;
var GATE = '(max-width: 1099px), (any-pointer: coarse) and (max-width: 1366px)';
var mq = matchMedia(GATE);
var NS_LIMIT = 26;
function sections() {
return Array.prototype.slice.call(d.querySelectorAll('section[id], [data-rail-item][id]'))
.filter(function (el) {
if (el.hasAttribute('data-rail-skip')) return false;
if (el.hasAttribute('hidden')) return false;
return !el.parentElement.closest('section[id]');
});
}
function labelOf(el) {
var explicit = el.getAttribute('data-rail-label');
if (explicit) return explicit.trim();
var by = el.getAttribute('aria-labelledby');
var named = by && d.getElementById(by);
var t = named ? named.textContent
: (el.getAttribute('aria-label') || (el.querySelector('h1, h2') || {}).textContent || el.id || '');
t = t.replace(/\s+/g, ' ').trim();
return t.length > NS_LIMIT ? t.slice(0, NS_LIMIT - 1).replace(/[\s,–—-]+$/, '') + '…' : t;
}
var panel = d.createElement('nav');
panel.className = 'mnav';
panel.id = 'mnav';
panel.setAttribute('aria-label', 'Меню сайта');
panel.hidden = true;
function group(title) {
var s = d.createElement('div');
s.className = 'mnav__group';
if (title) {
var h = d.createElement('p');
h.className = 'mnav__h';
h.textContent = title;
s.appendChild(h);
}
panel.appendChild(s);
return s;
}
function list(host, cls) {
var ul = d.createElement('ul');
ul.className = 'mnav__list' + (cls ? ' ' + cls : '');
ul.setAttribute('role', 'list');
host.appendChild(ul);
return ul;
}
function item(ul, href, text, no) {
var li = d.createElement('li');
var a = d.createElement('a');
a.className = 'mnav__item';
a.href = href;
if (no) {
var n = d.createElement('span');
n.className = 'mnav__no';
n.textContent = no;
a.appendChild(n);
}
var t = d.createElement('span');
t.className = 'mnav__t';
t.textContent = text;
a.appendChild(t);
li.appendChild(a);
ul.appendChild(li);
return a;
}
function build() {
panel.textContent = '';
var secs = sections();
if (secs.length > 1) {
var g1 = group('На этой странице');
var ul1 = list(g1);
secs.forEach(function (el, i) {
item(ul1, '#' + el.id, labelOf(el), String(i + 1).padStart(2, '0'));
});
}
var footNav = d.querySelector('.ftr__tile--nav .ftr__list');
if (footNav) {
var g2 = group('Практики и маршруты');
var ul2 = list(g2);
var curLeaf = location.pathname.split('/').pop() || 'home-ru.html';
if (!/^(?:home-ru|index)\.html$/i.test(curLeaf)) {
item(ul2, './home-ru.html', 'Главная и калькулятор');
}
Array.prototype.forEach.call(footNav.querySelectorAll('a'), function (a) {
var here = a.pathname === location.pathname;
var hash = (a.hash || '').replace('#', '');
var target = hash ? d.getElementById(hash) : null;
var dead = here && hash && (!target || target.hasAttribute('hidden'));
var text = a.textContent.trim();
if (dead) {
var li = d.createElement('li');
var sp = d.createElement('span');
sp.className = 'mnav__item is-soon';
sp.setAttribute('aria-disabled', 'true');
var t = d.createElement('span'); t.className = 'mnav__t'; t.textContent = text;
sp.appendChild(t);
li.appendChild(sp); ul2.appendChild(li);
return;
}
var link = item(ul2, here && hash ? '#' + hash : a.getAttribute('href'), text);
if (here && !hash) link.classList.add('is-here');
});
}
var langs = d.querySelector('.ftr__langs');
if (langs) {
var g3 = group('Язык');
var row = d.createElement('div');
row.className = 'mnav__langs';
Array.prototype.forEach.call(langs.children, function (el) {
var c = el.cloneNode(true);
c.classList.add('mnav__lang');
row.appendChild(c);
});
g3.appendChild(row);
}
}
var open = false;
var lastY = 0;
function focusables() {
return Array.prototype.slice.call(
panel.querySelectorAll('a[href], button:not([disabled])')
).filter(function (el) { return el.offsetParent !== null; });
}
function setOpen(v) {
if (v === open) return;
open = v;
btn.setAttribute('aria-expanded', v ? 'true' : 'false');
d.documentElement.classList.toggle('mnav-on', v);
if (v) {
build();
panel.hidden = false;
lastY = window.scrollY;
d.body.style.top = (-lastY) + 'px';
d.body.classList.add('mnav-lock');
requestAnimationFrame(function () {
panel.classList.add('is-in');
var f = focusables();
if (f.length) f[0].focus();
});
} else {
panel.classList.remove('is-in');
d.body.classList.remove('mnav-lock');
d.body.style.top = '';
window.scrollTo(0, lastY);
var hide = function () { if (!open) panel.hidden = true; };
setTimeout(hide, 280);
btn.focus();
}
}
btn.addEventListener('click', function () { setOpen(!open); });
panel.addEventListener('click', function (e) {
var a = e.target.closest ? e.target.closest('a') : null;
if (a) setOpen(false);
});
d.addEventListener('keydown', function (e) {
if (!open) return;
if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
if (e.key !== 'Tab') return;
var f = focusables();
if (!f.length) return;
var first = f[0], last = f[f.length - 1];
if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
});
var mounted = false;
function syncGate() {
if (mq.matches) {
if (!mounted) {
d.body.appendChild(panel);
btn.setAttribute('aria-controls', 'mnav');
mounted = true;
}
btn.hidden = false;
} else {
if (open) setOpen(false);
btn.hidden = true;
}
}
syncGate();
if (typeof mq.addEventListener === 'function') {
mq.addEventListener('change', syncGate);
}
})();
