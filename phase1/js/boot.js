/* ============================================================
   LTCG — boot.js · один загрузчик на три версии (ЗАКОН ИМПОРТА, docs/vkv_bar.md §3.1)
   Что делает: no-js → js; языковые ссылки из одного массива (dev: home-*.html, прод: /, /hy/, /en/);
   гейты reduce / мобильный / точный указатель; GSAP + ScrollTrigger + Lenis — только когда есть движение;
   Lenis — только на (hover: hover) and (pointer: fine) и только через gsap.ticker; хиро — движок или
   статическая ветка; затем site.js. Всё видно без JS: разметка рендерится сразу.
   Подключать классическим <script defer src="js/boot.js"> — единственный тег скрипта на странице.
   ============================================================ */
(function () {
  'use strict';
  var d = document, h = d.documentElement;
  h.className = h.className.replace(/\bno-js\b/, 'js');

  var SITE_ROOT = h.getAttribute('data-site-root') || '/';
  var V = h.getAttribute('data-v') || '';
  var VER = V ? '?v=' + V : '';
  // превью на dev-сервере: страницы лежат рядом как home-*.html; в проде — каталоги /, /hy/, /en/
  var DEV = /\.html?$/i.test(location.pathname);
  var LANGS = { '': 'home-ru.html', 'hy/': 'home-hy.html', 'en/': 'home-en.html' };
  d.querySelectorAll('[data-path]').forEach(function (a) {
    var p = a.getAttribute('data-path') || '';
    a.setAttribute('href', DEV && LANGS[p] !== undefined ? SITE_ROOT + LANGS[p] : SITE_ROOT + p);
  });

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=0/.test(location.search);
  var mobile = matchMedia('(max-width: 767px), ((max-height: 767px) and (pointer: coarse))').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var motion = !reduce && !mobile;   /* пересчитывается ниже, после splash */
  /* Заставка первого экрана. Шире, чем гейт GSAP: её берут ВСЕ устройства
     с грубым указателем до 1366 px — телефон в любой ориентации и планшет
     в любой, включая iPad Pro в альбоме.
     Сперва планшет в альбоме оставался на десктопной сцене: форма экрана у
     него десктопная. Оказалось, что дело не в форме — сцена держит canvas
     2560x1440, ролик прохода по офису и скраб по закреплённому экрану, и на
     планшете это встаёт колом (владелец, 4 сентября: «на айпаде повис»).
     Палец такой сценой не управляет, а заставка на том же кадре — управляет.

     ПОЧЕМУ any-pointer, А НЕ pointer. Safari на iPad по умолчанию выдаёт
     себя за настольный браузер и на запрос pointer отвечает fine, а на
     hover — hover, хотя это планшет с пальцем. Гейт по `pointer: coarse`
     проходил мимо iPad целиком: он получал десктопную сцену и замирал
     (владелец: «не прошло на айпаде»). `any-pointer: coarse` спрашивает
     иначе — «есть ли ХОТЬ ОДИН грубый указатель», и тач-экран честно
     отвечает да. На настольной машине без сенсорного экрана — нет. */
  var splash = matchMedia('(max-width: 767px), (any-pointer: coarse) and (max-width: 1366px)').matches;
  /* GSAP нужен ровно там, где есть десктопная сцена хиро. На устройствах с
     заставкой её нет, а reveal-анимации в site.js без GSAP деградируют
     штатно — «без GSAP всё видно». Планшет получал GSAP и ScrollTrigger без
     движка сцены: триггеры считались поверх закреплённого экрана и замка
     прокрутки, и первый экран замирал (владелец: «на айпаде анимация
     проходит и дальше не переключается»). На телефоне этого не было именно
     потому, что там GSAP не грузится вовсе. */
  motion = motion && !splash;

  var hasHero = !!d.querySelector('[data-hero-scroll]');
  var hasReveal = !!d.querySelector('[data-reveal], [data-stagger]');
  var hasSite = h.hasAttribute('data-site');  var SRI = {
    "js/vendor/gsap.min.js": "sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly",
    "js/vendor/ScrollTrigger.min.js": "sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF",
    "js/vendor/lenis.min.js": "sha384-iiCtod6ZId6zT42Bar9EFXNKZh8X4VliWYWFOuY3/t1AxCvLejXExXcbluoc57CJ",
    "js/hero-static.js": "sha384-YUrHE7ZfRQ9kI/Ck4ZZGP+mBKbaoMUsM/X0AQfcT6PNbMG0/8VBhIOKhTDVZ9vVQ",
    "js/hero-scroll.js": "sha384-7P5RBPPJs8CTzen0ip0fZlpYpsI9Y6qbc2rQ3uAnNOwnxPoriN5FBcyfQqERthsD",
    "js/hero-mobile.js": "sha384-GDjZg3rNImcKZ0wRZuKXKw5hNI5NDw1N3Stw0jkgTfYTsOR07735znZ7uL3NfV/I",
    "js/menu-mobile.js": "sha384-X6byNeiPRoKn3hrRZNdSkwZKbQEUmWBfF1dLf2ryuF7de2GzJf25V9Eg7wmKtnKP",
    "js/site.js": "sha384-0fE5UjHlrzUZyFFZguZwqSTIb75U/mD1ZrSqXwpjzNMlLpXqyAn8/ltngdNeSZXJ",
    "js/railnav.js": "sha384-vED4nRbRadrYCkT5KimiSgA+zQ7GI+RSq6opb9h5i2PEEsmo9ZVBjGpnlST0zMcy",
    "js/webmcp.js": "sha384-IKPiUmiPDc3YWfDPl28NUj+CWyVGdb6TbsX9BPl5ZMG7W4VIe5iIz9jF6StjTcQq"
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
        // Lenis через gsap.ticker — один драйвер на кадр; собственного rAF-цикла нет.
        // Демпфер ровно один на всю цепь: lerp (нормирован по dt внутри Lenis), НЕ duration.
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

  /* Снимаем старый Service Worker, если он остался от прежних сессий:
     SW перехватывает навигацию и блокирует Back/Forward Cache (bfcache) в Lighthouse. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', function () {
      if (navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) { r.unregister(); });
        }).catch(function () {});
      }
    });
  }

  /* Приложение на рабочем столе не перезагружает страницу, когда его
     открывают снова, — оно восстанавливает уже открытую сессию. Пока сайт
     правится по нескольку раз в день, человек так и остаётся на вчерашней
     версии, ничего об этом не зная (владелец, 4 сентября: «я просто
     приложение не обновил»).
     Поэтому при возвращении спрашиваем сервер о версии и перезагружаемся,
     если она разошлась. Условия узкие: прошло больше полминуты с загрузки
     и человек в самом начале страницы — тогда перезагрузка ничего не отнимет.
     Читает 20 байт мимо кеша, ошибку глотает молча. */
  (function () {
    var born = Date.now();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden || Date.now() - born < 30000) return;
      if (window.scrollY > 100) return;
      fetch(SITE_ROOT + 'version.json', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.v && j.v !== V) location.reload(); })
        .catch(function () { /* нет сети — не мешаем */ });
    });
  })();

  /* Диагностика по адресу с ?diag=1 — плашка поверх экрана с тем, что видит
     конкретное устройство. На планшете и телефоне консоль недоступна без
     подключённого компьютера, а гадать о медиазапросах чужого Safari дорого:
     iPad, например, отвечает на pointer «fine», хотя это планшет с пальцем.
     Ничего не грузит и без параметра не выполняется. */
  if (/[?&]diag=1/.test(location.search)) {
    addEventListener('load', function () {
      var q = function (m) { return matchMedia(m).matches ? 'да' : 'нет'; };
      var rows = [
        /* Первыми — три строки, отвечающие на вопрос «а ту ли страницу мы
           вообще смотрим». Вчерашняя версия в установленном приложении даёт
           ровно те же симптомы, что настоящая поломка, и отличить их иначе
           нельзя: приложение выглядит как браузер, а метка версии нигде не
           видна. */
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
      // Свежая ли версия — спрашиваем сервер прямо здесь, мимо всех кешей.
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
