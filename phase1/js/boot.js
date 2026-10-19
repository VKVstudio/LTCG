(function () {
'use strict';
var d = document, h = d.documentElement;
h.className = h.className.replace(/\bno-js\b/, 'js');
var SITE_ROOT = h.getAttribute('data-site-root') || '/';
var V = h.getAttribute('data-v') || '';
var VER = V ? '?v=' + V : '';
var DEV = /\.html?$/i.test(location.pathname);
var LANGS = { '': 'home-ru.html', 'hy/': 'home-hy.html', 'en/': 'home-en.html' };
d.querySelectorAll('[data-path]').forEach(function (a) {
var p = a.getAttribute('data-path') || '';
a.setAttribute('href', DEV && LANGS[p] !== undefined ? SITE_ROOT + LANGS[p] : SITE_ROOT + p);
});
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=0/.test(location.search);
var mobile = matchMedia('(max-width: 767px), ((max-height: 767px) and (pointer: coarse))').matches;
var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
var motion = !reduce && !mobile;
var splash = matchMedia('(max-width: 767px), (any-pointer: coarse) and (max-width: 1366px)').matches;
motion = motion && !splash;
var hasHero = !!d.querySelector('[data-hero-scroll]');
var hasReveal = !!d.querySelector('[data-reveal], [data-stagger]');
var hasSite = h.hasAttribute('data-site');  var SRI = {
    "js/vendor/gsap.min.js": "sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly",
    "js/vendor/ScrollTrigger.min.js": "sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF",
    "js/vendor/lenis.min.js": "sha384-iiCtod6ZId6zT42Bar9EFXNKZh8X4VliWYWFOuY3/t1AxCvLejXExXcbluoc57CJ",
    "js/hero-static.js": "sha384-oKKadulpH3T+jdYUXku15C0M5IgUgRooyIjiwxgx+rCTVt2FY6Q71kRBVl24TREF",
    "js/hero-scroll.js": "sha384-WFXI9iFTU+xfiaMq1YLNPnZzrkXvMd9PTadYeJs2x/SIXQDSOmFR8lrytYoYdtIV",
    "js/hero-mobile.js": "sha384-4OM90vdqE461CqKPZYBHJjxYkNQkiFZYzaLXNDjNCdRRpD0OchQBifzagzIZSe7z",
    "js/menu-mobile.js": "sha384-DyN2iaHvY7TsHGzHAbPjUiUOMrMuA4zyszjkwCt1y7bNsweYTIkestBQZcV733Ef",
    "js/site.js": "sha384-P0xwCoeLDeGekR4BM6uHscOb5bu57l3CTpaxG1QEAli4d367ddjjT0HQF8uHvRV0",
    "js/railnav.js": "sha384-qdp4rTEtXjGegoou7tUiapz85cnuSs0rMgNnEQJMCuo93LV4WY8r1mhkdq29eJ5m",
    "js/webmcp.js": "sha384-EoXhIs2v6OdkCBuVolXdjZ7l9fmYC5wqokp8kf8uKgB7mkebQvddf+dRLLI2Dydp"
};
  function load(src) {
    return new Promise(function (res, rej) {
      var el = d.createElement('script');
      el.async = false;
      if (SRI[src]) { el.integrity = SRI[src]; el.crossOrigin = 'anonymous'; }
      el.src = SITE_ROOT + src + VER;
      el.onload = res; el.onerror = function () { rej(new Error(src)); };
      d.head.appendChild(el);
    });
  }
function batch(list) {
return Promise.all(list.map(function (s) {
return load(s).catch(function (err) { console.warn('[boot]', s, err); });
}));
}
var chain = Promise.resolve();
if (motion && (hasHero || hasReveal)) {
chain = batch(['js/vendor/gsap.min.js', 'js/vendor/ScrollTrigger.min.js'].concat(fine ? ['js/vendor/lenis.min.js'] : []))
.then(function () {
if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
gsap.registerPlugin(ScrollTrigger);
if (!fine || typeof Lenis === 'undefined') return;
var lenis = new Lenis({ lerp: 0.18, smoothWheel: true, syncTouch: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis;
})
.catch(function (err) { console.warn('[boot] motion libs unavailable, static tier', err); });
}
chain
.then(function () {
var appScripts = [];
if (hasHero) appScripts.push(splash ? 'js/hero-static.js' : 'js/hero-scroll.js');
if (splash && d.querySelector('[data-hero-mobile]')) appScripts.push('js/hero-mobile.js');
appScripts.push('js/menu-mobile.js');
if (hasSite) appScripts.push('js/site.js');
if (fine && !splash) appScripts.push('js/railnav.js');
return batch(appScripts);
})
.then(function () {
var idle = window.requestIdleCallback || function (cb) { setTimeout(cb, 250); };
idle(function () { load('js/webmcp.js').catch(function () {}); });
});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
addEventListener('load', function () {
if (navigator.serviceWorker.getRegistrations) {
navigator.serviceWorker.getRegistrations().then(function (regs) {
regs.forEach(function (r) { r.unregister(); });
}).catch(function () {});
}
});
}
(function () {
var born = Date.now();
document.addEventListener('visibilitychange', function () {
if (document.hidden || Date.now() - born < 30000) return;
if (window.scrollY > 100) return;
fetch(SITE_ROOT + 'version.json', { cache: 'no-store' })
.then(function (r) { return r.json(); })
.then(function (j) { if (j && j.v && j.v !== V) location.reload(); })
.catch(function () {  });
});
})();
if (/[?&]diag=1/.test(location.search)) {
addEventListener('load', function () {
var q = function (m) { return matchMedia(m).matches ? 'да' : 'нет'; };
var rows = [
['ВЕРСИЯ СТРАНИЦЫ', V || '(нет)'],
['открыто как', matchMedia('(display-mode: standalone)').matches
? 'ПРИЛОЖЕНИЕ с рабочего стола' : 'вкладка браузера'],
['страницу отдал', navigator.serviceWorker && navigator.serviceWorker.controller
? 'рабочий процесс (возможен кеш)' : 'сеть напрямую'],
['экран', innerWidth + '×' + innerHeight + ' · DPR ' + (devicePixelRatio || 1)],
['точек касания', String(navigator.maxTouchPoints || 0)],
['pointer: coarse', q('(pointer: coarse)')],
['any-pointer: coarse', q('(any-pointer: coarse)')],
['hover: hover', q('(hover: hover)')],
['ГЕЙТ ЗАСТАВКИ', splash ? 'ДА' : 'НЕТ'],
['GSAP', typeof gsap === 'undefined' ? 'нет' : 'есть'],
['классы', h.className],
['--gate', h.style.getPropertyValue('--gate') || '(не задан)']
];
var sc = d.querySelector('.hs__screen');
if (sc) {
var r = sc.getBoundingClientRect();
rows.push(['ворота', 'верх ' + Math.round(r.top) + ', высота ' + Math.round(r.height)]);
}
rows.push(['скрипты', Array.prototype.map.call(d.querySelectorAll('script[src]'),
function (x) { return x.src.split('/').pop().split('?')[0]; }).join(' ')]);
var box = d.createElement('div');
box.setAttribute('style', 'position:fixed;inset:auto 8px 8px 8px;z-index:99999;' +
'background:#0b1a36;color:#FAE0A2;border:1px solid #F2C249;border-radius:12px;' +
'padding:10px 12px;font:12px/1.45 ui-monospace,monospace;max-height:52vh;overflow:auto');
box.innerHTML = rows.map(function (r) {
return '<div><b style="color:#fff">' + r[0] + ':</b> ' + String(r[1]) + '</div>';
}).join('') + '<div style="margin-top:8px;opacity:.7">снимок экрана этой плашки — всё, что нужно</div>';
d.body.appendChild(box);
fetch(SITE_ROOT + 'version.json', { cache: 'no-store' })
.then(function (r) { return r.json(); })
.then(function (j) {
var el = d.createElement('div');
el.style.marginTop = '6px';
el.innerHTML = (j && j.v === V)
? '<b style="color:#7CE0A0">версия свежая</b>'
: '<b style="color:#FF8A8A">УСТАРЕЛА: на сервере ' + (j && j.v) + '</b>';
box.appendChild(el);
})
.catch(function () {});
});
}
})();
