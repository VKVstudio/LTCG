(function () {
'use strict';
const SITE_ROOT = document.documentElement.getAttribute('data-site-root') || '/';
const PHONE = '37494184014';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=0/.test(location.search);
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
$$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
const curFile = (location.pathname.split('/').pop() || 'home-ru.html').replace(/^index\.html$/, 'home-ru.html');
$$('.hdr__nav a[href]').forEach(a => {
const rawHref = a.getAttribute('href') || '';
if (rawHref.indexOf('#') >= 0) return;
const linkFile = rawHref.replace(/^\.\//, '').split('?')[0];
if (linkFile && linkFile === curFile) a.setAttribute('aria-current', 'true');
});
const themers = $$('[data-themer]');
if (themers.length) {
const root = document.documentElement;
const current = () => root.getAttribute('data-theme') || 'auto';
const paint = () => {
const now = current();
themers.forEach(box => $$('[data-theme-set]', box).forEach(b => {
b.setAttribute('aria-pressed', String(b.dataset.themeSet === now));
}));
$$('[data-theme-toggle] .tri__theme-btn').forEach(b => {
b.setAttribute('aria-pressed', String(b.dataset.set === now));
});
};
const setTheme = (mode) => {
if (mode === 'auto') root.removeAttribute('data-theme');
else root.setAttribute('data-theme', mode);
try { mode === 'auto' ? localStorage.removeItem('ltcg-theme') : localStorage.setItem('ltcg-theme', mode); } catch (e) {}
paint();
};
themers.forEach(box => box.addEventListener('click', (e) => {
const b = e.target.closest('[data-theme-set]');
if (b) setTheme(b.dataset.themeSet);
}));
const themeParam = /[?&]theme=(light|dark|auto)\b/.exec(location.search);
if (themeParam) setTheme(themeParam[1]);
else paint();
}
const hdr = $('#hdr');
const dock = $('.dock');
const hero = $('[data-hero-scroll]');
const headerH = () => (hdr ? hdr.offsetHeight : 72);
if (hero && 'IntersectionObserver' in window) {
const io = new IntersectionObserver(entries => {
const past = entries.some(e => e.boundingClientRect.bottom <= headerH() + 8);
const inHero = entries.some(e => e.isIntersecting && e.boundingClientRect.bottom > headerH() + 8);
const show = past && !inHero;
if (hdr && hdr.classList.contains('is-shown') !== show) {
hdr.classList.add('is-animating');
hdr.classList.toggle('is-shown', show);
setTimeout(() => hdr.classList.remove('is-animating'), 520);
}
dock && dock.classList.toggle('is-shown', show);
document.documentElement.classList.toggle('hdr-on', show);
}, { threshold: [0, 0.05, 0.15] });
io.observe(hero);
} else {
hdr && hdr.classList.add('is-shown');
dock && dock.classList.add('is-shown');
document.documentElement.classList.add('hdr-on');
}
const burger = $('.burger');
const menu = $('#menu');
const setMenu = (open) => {
if (!burger || !menu) return;
burger.setAttribute('aria-expanded', String(open));
menu.hidden = !open;
document.documentElement.classList.toggle('menu-open', open);
if (open) {
const first = menu.querySelector('a'); first && first.focus({ preventScroll: true });
if (window.__lenis) window.__lenis.stop();
} else if (window.__lenis) window.__lenis.start();
};
burger && burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); burger.focus(); } });
const parseHash = (h) => {
const raw = String(h || '');
const idx = raw.indexOf('#');
const s = idx >= 0 ? raw.slice(idx + 1) : raw.replace(/^#/, '');
const [id, q] = s.split('?');
const params = new URLSearchParams(q || '');
return { id, params };
};
const finishRevealTween = (el) => {
if (el.__revealTween) {
if (el.__revealTween.scrollTrigger) el.__revealTween.scrollTrigger.kill();
el.__revealTween.progress(1).kill();
el.__revealTween = null;
}
};
const revealVisibleNow = (scopeEl) => {
if (!hasGsap) return;
if (scopeEl) {
$$('[data-reveal]', scopeEl).forEach(el => {
finishRevealTween(el);
gsap.set(el, { autoAlpha: 1, y: 0, clearProps: 'transform,opacity,visibility' });
});
$$('[data-stagger]', scopeEl).forEach(group => {
finishRevealTween(group);
const items = Array.from(group.children);
if (items.length) gsap.set(items, { autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform,opacity,visibility' });
});
$$('.kicker', scopeEl).forEach(k => {
finishRevealTween(k);
gsap.set(k, { '--kw': 1 });
});
return;
}
if (hero && window.scrollY < 40) return;
const vh = window.innerHeight || 900;
$$('[data-reveal]').forEach(el => {
const r = el.getBoundingClientRect();
if (r.top <= vh * 0.96 && r.bottom >= -40) {
finishRevealTween(el);
gsap.set(el, { autoAlpha: 1, y: 0, clearProps: 'transform,opacity,visibility' });
}
});
$$('[data-stagger]').forEach(group => {
const r = group.getBoundingClientRect();
if (r.top <= vh * 0.96 && r.bottom >= -40) {
finishRevealTween(group);
const items = Array.from(group.children);
if (items.length) gsap.set(items, { autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform,opacity,visibility' });
}
});
$$('.kicker').forEach(k => {
const r = k.getBoundingClientRect();
if (r.top <= vh * 0.96 && r.bottom >= -40) {
finishRevealTween(k);
gsap.set(k, { '--kw': 1 });
}
});
};
const setScrollY = (y) => {
const l = window.__lenis;
const pos = Math.max(0, Math.round(y));
if (l && typeof l.resize === 'function') l.resize();
if (l && typeof l.scrollTo === 'function') {
l.scrollTo(pos, { immediate: true, force: true });
}
window.scrollTo(0, pos);
if (window.ScrollTrigger && typeof window.ScrollTrigger.update === 'function') {
window.ScrollTrigger.update();
}
};
const scrollToId = (id) => {
const el = id ? document.getElementById(id) : null;
if (!el) return false;
if (id !== 'hero' && id !== 'triGate') {
if (typeof window.__heroUnlock === 'function') window.__heroUnlock();
if (document.querySelector('.hs')) {
document.body.classList.add('is-landed');
document.documentElement.classList.add('hdr-on');
if (hdr) hdr.classList.add('is-shown');
}
}
const l = window.__lenis;
if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
window.ScrollTrigger.refresh();
}
if (l && typeof l.resize === 'function') l.resize();
revealVisibleNow(el);
const offset = (id === 'hero') ? 0 : -headerH();
const to = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY + offset));
setScrollY(to);
revealVisibleNow(el);
window.dispatchEvent(new Event('scroll'));
setTimeout(() => {
const fixTo = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY + offset));
if (Math.abs(window.scrollY - fixTo) > 8) setScrollY(fixTo);
revealVisibleNow(el);
window.dispatchEvent(new Event('scroll'));
}, 50);
return true;
};
const states = $$('.state[data-state]');
const stateNames = {};
states.forEach(s => { stateNames[s.dataset.state] = s.dataset.name; });
const chosen = $('[data-chosen]');
const chosenName = $('[data-chosen-name]');
const formState = $('#f-state');
let currentState = '';
const setState = (key, opts) => {
opts = opts || {};
if (!stateNames[key]) return;
currentState = key;
document.documentElement.setAttribute('data-state', key);
states.forEach(s => s.classList.toggle('is-on', s.dataset.state === key));
if (chosen && chosenName) { chosenName.textContent = stateNames[key]; chosen.hidden = false; }
if (formState && !opts.keepForm) {
formState.value = key;
if (typeof formState.__syncCsel === 'function') formState.__syncCsel();
}
$$('a[data-cta]').forEach(a => {
const raw = a.getAttribute('href') || '';
const prefix = raw.indexOf('#') > 0 ? raw.slice(0, raw.indexOf('#')) : '';
const { id } = parseHash(raw);
if (id) a.setAttribute('href', prefix + '#' + id + '?state=' + key);
});
updateWa();
try { localStorage.setItem('ltcg.state', key); } catch (e) {  }
};
const applyHash = (hash, scroll) => {
const { id, params } = parseHash(hash);
const st = params.get('state');
if (st) setState(st);
else if (stateNames[id]) setState(id);
const preset = params.get('preset');
if (preset) applyPreset(preset);
if (scroll) scrollToId(id);
};
document.addEventListener('click', (e) => {
const a = e.target.closest('a[href*="#"]');
if (!a) return;
const href = a.getAttribute('href') || '';
if (href === '#' || a.classList.contains('hs__skip') || a.classList.contains('tri__part')) return;
const hashIdx = href.indexOf('#');
if (hashIdx < 0) return;
if (hashIdx > 0) {
try {
const u = new URL(href, location.href);
const samePage = (u.origin === location.origin) && (
u.pathname === location.pathname ||
(u.pathname.endsWith('/home-ru.html') && (location.pathname === '/' || location.pathname.endsWith('/index.html'))) ||
((u.pathname === '/' || u.pathname.endsWith('/index.html')) && location.pathname.endsWith('/home-ru.html'))
);
if (!samePage) return;
} catch (err) { return; }
}
const hashPart = href.slice(hashIdx);
const { id } = parseHash(hashPart);
if (!id || !document.getElementById(id)) return;
e.preventDefault();
if (a.dataset.stateLink) setState(a.dataset.stateLink);
if (a.dataset.presetLink) applyPreset(a.dataset.presetLink);
applyHash(hashPart, false);
setMenu(false);
history.replaceState(null, '', hashPart);
scrollToId(id);
});
states.forEach(s => {
s.addEventListener('click', (e) => {
const hitLink = e.target.closest('a, button');
if (hitLink) {
if (s.dataset.state && (hitLink.classList.contains('state__link') || hitLink.classList.contains('tile__read'))) {
setState(s.dataset.state);
}
return;
}
if (s.dataset.state) setState(s.dataset.state);
const readLink = s.querySelector('a.tile__read, a.state__link');
if (readLink && readLink.getAttribute('href')) {
window.location.href = readLink.getAttribute('href');
}
});
});
$$('.svc').forEach(card => {
card.addEventListener('click', (e) => {
if (e.target.closest('a, button')) return;
const readLink = card.querySelector('a.tile__read');
if (readLink && readLink.getAttribute('href')) {
window.location.href = readLink.getAttribute('href');
}
});
});
formState && formState.addEventListener('change', () => { if (formState.value) setState(formState.value, { keepForm: true }); });
$$('.field select').forEach(sel => {
if (sel.classList.contains('is-enhanced')) return;
sel.classList.add('is-enhanced');
sel.tabIndex = -1;
const wrap = document.createElement('div');
wrap.className = 'csel';
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'csel__btn';
btn.setAttribute('aria-haspopup', 'listbox');
btn.setAttribute('aria-expanded', 'false');
const valSpan = document.createElement('span');
valSpan.className = 'csel__val';
btn.appendChild(valSpan);
const list = document.createElement('ul');
list.className = 'csel__list';
list.setAttribute('role', 'listbox');
list.hidden = true;
const options = Array.from(sel.options);
const items = options.map((opt, idx) => {
const li = document.createElement('li');
li.className = 'csel__opt';
li.setAttribute('role', 'option');
li.dataset.value = opt.value;
li.dataset.index = String(idx);
li.textContent = opt.textContent;
list.appendChild(li);
return li;
});
const syncFromSelect = () => {
const curIdx = sel.selectedIndex >= 0 ? sel.selectedIndex : 0;
const curOpt = options[curIdx];
valSpan.textContent = curOpt ? curOpt.textContent : '';
items.forEach((li, i) => {
const isSel = (i === curIdx);
li.setAttribute('aria-selected', isSel ? 'true' : 'false');
li.classList.toggle('is-active', isSel);
});
};
sel.__syncCsel = syncFromSelect;
syncFromSelect();
let activeIdx = sel.selectedIndex >= 0 ? sel.selectedIndex : 0;
const setActive = (idx) => {
if (!items.length) return;
activeIdx = (idx + items.length) % items.length;
items.forEach((li, i) => li.classList.toggle('is-active', i === activeIdx));
const el = items[activeIdx];
if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
};
const close = (restoreFocus) => {
if (list.hidden) return;
list.hidden = true;
wrap.classList.remove('is-open');
btn.setAttribute('aria-expanded', 'false');
if (restoreFocus) btn.focus({ preventScroll: true });
};
const open = () => {
if (!list.hidden) return;
$$('.csel.is-open').forEach(other => {
if (other !== wrap && typeof other.__closeCsel === 'function') other.__closeCsel(false);
});
list.hidden = false;
wrap.classList.add('is-open');
btn.setAttribute('aria-expanded', 'true');
setActive(sel.selectedIndex >= 0 ? sel.selectedIndex : 0);
};
wrap.__closeCsel = close;
const choose = (idx) => {
if (idx < 0 || idx >= options.length) return;
if (sel.selectedIndex !== idx) {
sel.selectedIndex = idx;
syncFromSelect();
sel.dispatchEvent(new Event('change', { bubbles: true }));
} else {
syncFromSelect();
}
close(true);
};
btn.addEventListener('click', (e) => {
e.preventDefault();
if (list.hidden) open();
else close(false);
});
btn.addEventListener('keydown', (e) => {
if (e.key === 'ArrowDown') {
e.preventDefault();
if (list.hidden) open();
else setActive(activeIdx + 1);
} else if (e.key === 'ArrowUp') {
e.preventDefault();
if (list.hidden) open();
else setActive(activeIdx - 1);
} else if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
if (list.hidden) open();
else choose(activeIdx);
} else if (e.key === 'Escape') {
if (!list.hidden) { e.preventDefault(); e.stopPropagation(); close(true); }
} else if (e.key === 'Tab') {
close(false);
}
});
items.forEach((li, idx) => {
li.addEventListener('mouseenter', () => setActive(idx));
li.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
choose(idx);
});
});
const fieldLabel = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : sel.closest('label');
if (fieldLabel) {
fieldLabel.addEventListener('click', (e) => {
if (e.target.closest('.csel')) return;
e.preventDefault();
btn.focus({ preventScroll: true });
open();
});
}
sel.parentNode.insertBefore(wrap, sel.nextSibling);
wrap.appendChild(btn);
wrap.appendChild(list);
});
document.addEventListener('click', (e) => {
if (!e.target.closest('.csel')) {
$$('.csel.is-open').forEach(w => { if (typeof w.__closeCsel === 'function') w.__closeCsel(false); });
}
});
let prices = null;
try { prices = JSON.parse($('#prices').textContent); } catch (e) { prices = null; }
const previewPrices = /[?&]prices=preview/.test(location.search);
const showNumbers = !!prices && (prices.publish === true || previewPrices);
const calcForm = $('[data-calc]');
const boxes = calcForm ? $$('input[name="mod"]', calcForm) : [];
const totalEl = $('[data-total]');
const fmt = (n) => n.toLocaleString('ru-RU').replace(/ |\s/g, ' ');
const curLabel = () => (prices ? (prices.currencyConfirmed ? prices.currency : prices.currency + '?') : '');
const applyPreset = (key) => {
if (!boxes.length) return;
const map = { hero: 'ip,account,social', arrived: 'account,social,address', legalizing: 'ip,address', working: 'ip,accounting', settled: 'accounting' };
const stateEl = states.find(s => s.dataset.state === key);
const list = stateEl && stateEl.dataset.preset !== undefined ? stateEl.dataset.preset : map[key];
if (list === undefined) return;
const on = list.split(',').filter(Boolean);
boxes.forEach(b => { b.checked = on.includes(b.value); });
recalc();
};
const selected = () => boxes.filter(b => b.checked).map(b => b.value);
const waText = () => {
const parts = [];
if (currentState) parts.push('Маршрут: ' + stateNames[currentState] + '.');
const mods = selected();
if (mods.length && prices) parts.push('Хочу расчёт: ' + mods.map(k => prices.modules[k].name.toLowerCase()).join(', ') + '.');
else parts.push('Хочу расчёт стоимости.');
return 'Здравствуйте! ' + parts.join(' ');
};
const updateWa = () => {
const t = encodeURIComponent(waText());
$$('a[data-wa], a[data-wa-calc]').forEach(a => a.setAttribute('href', 'https://wa.me/' + PHONE + '?text=' + t));
const hidden = $('[data-f-modules]');
if (hidden) hidden.value = selected().join(',');
};
const recalc = () => {
if (!prices || !totalEl) return;
const mods = selected();
boxes.forEach(b => b.closest('.mod') && b.closest('.mod').classList.toggle('is-on', b.checked));
const list = $('[data-total-list]', totalEl);
if (list) {
list.innerHTML = mods.length
? mods.map(k => {
const m = prices.modules[k];
if (!m) return '';
const per = m.per === 'year' ? ' / год' : m.per === 'month' ? ' / мес' : '';
const pref = m.from ? 'от ' : '';
const pTxt = (showNumbers && typeof m.amount === 'number') ? (pref + fmt(m.amount) + ' ' + curLabel() + per) : '';
return '<li class="total__item"><span>' + m.name + '</span><b>' + pTxt + '</b></li>';
}).join('')
: '<li class="total__item total__item--empty">Отметьте нужные пункты слева — здесь появится смета</li>';
}
const cnt = $('[data-total-count]', totalEl);
if (cnt) {
const n = mods.length, w = n % 10 === 1 && n % 100 !== 11 ? 'модуль выбран' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'модуля выбрано' : 'модулей выбрано';
cnt.innerHTML = n + '<small>' + w + '</small>';
}
const rows = $('[data-total-rows]', totalEl);
const note = $('[data-total-note]', totalEl);
if (rows) rows.hidden = !showNumbers;
if (note) note.hidden = showNumbers;
if (showNumbers) {
const sums = { once: 0, year: 0, month: 0 };
mods.forEach(k => { const m = prices.modules[k]; if (m && typeof m.amount === 'number') sums[m.per] += m.amount; });
['once', 'year', 'month'].forEach(per => {
const dd = $('[data-sum="' + per + '"]', totalEl);
if (!dd) return;
const has = mods.some(k => prices.modules[k] && prices.modules[k].per === per);
const hasFrom = mods.some(k => prices.modules[k] && prices.modules[k].per === per && prices.modules[k].from);
dd.innerHTML = has ? (hasFrom ? 'от ' : '') + fmt(sums[per]) + ' <span class="cur">' + curLabel() + '</span>' : '—';
});
const startDd = $('[data-sum="start"]', totalEl);
if (startDd) {
const startSum = sums.once + sums.year + sums.month;
const anyFrom = mods.some(k => prices.modules[k] && prices.modules[k].from);
startDd.innerHTML = mods.length ? (anyFrom ? 'от ' : '') + fmt(startSum) + ' <span class="cur">' + curLabel() + '</span>' : '—';
}
}
updateWa();
};
if (prices) {
$$('[data-price]').forEach(el => {
const m = prices.modules[el.dataset.price];
if (!m) return;
if (showNumbers && typeof m.amount === 'number') {
const per = m.per === 'year' ? ' / год' : m.per === 'month' ? ' / мес' : '';
const prefix = m.from ? '<span>от</span> ' : '';
el.innerHTML = prefix + fmt(m.amount) + ' <span class="small">' + curLabel() + per + '</span>';
el.hidden = false;
}
});
if (previewPrices && totalEl) {
const badge = document.createElement('span');
badge.className = 'total__preview';
badge.textContent = 'предварительно · валюта и состав не подтверждены';
totalEl.insertBefore(badge, totalEl.children[1]);
}
boxes.forEach(b => b.addEventListener('change', recalc));
recalc();
}
const forkField = $('[data-f-fork]');
const syncFork = () => {
if (!forkField) return;
const checked = $('.fork__r:checked');
const titleEl = checked && checked.id ? $(`label[for="${checked.id}"] .fork__tag, label[for="${checked.id}"] b`) : null;
forkField.value = titleEl ? titleEl.textContent.trim() : '';
};
$$('.fork__r').forEach(r => r.addEventListener('change', syncFork));
syncFork();
$$('.faq').forEach(faq => {
const items = $$('details', faq);
if (!items.length) return;
items.forEach((d, idx) => {
const sum = $('summary', d);
if (!sum) return;
sum.addEventListener('click', (e) => {
if (window.innerWidth < 1024) {
if (!d.open) {
items.forEach((other, j) => { if (j !== idx && other.open) other.open = false; });
}
return;
}
e.preventDefault();
const isLastOdd = (items.length % 2 === 1) && (idx === items.length - 1);
const rowStart = isLastOdd ? idx : (idx - (idx % 2));
const rowIdxs = isLastOdd ? [idx] : [rowStart, rowStart + 1].filter(i => i < items.length);
const willOpen = !d.open;
items.forEach((item, j) => {
item.open = willOpen ? rowIdxs.includes(j) : false;
});
});
});
});
const MOD_NAMES = {
ip: 'регистрация ИП',
llc: 'регистрация ООО',
account: 'открытие банковского счёта и KYC',
residence: 'ВНЖ через ИП или ООО',
accounting: 'бухгалтерское сопровождение',
social: 'соцкарта (ПСН)',
address: 'юридический адрес',
closure: 'справки, апостиль и закрытие ИП/ООО'
};
$$('[data-lead]').forEach(lead => {
const host = lead.closest('section') || lead.parentElement || document;
const msg = $('[data-form-msg]', lead);
const done = $('[data-form-done]', host) || $('[data-form-done]');
const out = $('[data-form-out]', host) || $('[data-form-out]');
const leadText = () => {
const name = $('#f-name', lead), contact = $('#f-contact', lead);
const st = $('#f-state', lead), free = $('#f-msg', lead), src = $('#f-src', lead);
const branch = lead.querySelector('input[name="branch"]');
const fork = lead.querySelector('input[name="fork"]');
const modField = lead.querySelector('input[name="modules"]');
const days = $('#f-days', lead), when = $('#f-when', lead), country = $('#f-country', lead);
const mods = (typeof selected === 'function' ? selected() : []);
const rawMods = mods.length ? mods : (modField && modField.value ? modField.value.split(',').map(s => s.trim()).filter(Boolean) : []);
const parts = ['Здравствуйте! Меня зовут ' + (name ? name.value.trim() : '') + '.'];
if (st && st.value) parts.push('Маршрут: ' + (stateNames[st.value] || st.value) + '.');
else if (branch && branch.value) parts.push('Страница: ' + branch.value + '.');
if (fork && fork.value) parts.push('Сценарий: ' + fork.value + '.');
if (rawMods.length) parts.push('Модули: ' + rawMods.map(k => (prices && prices.modules && prices.modules[k]) ? prices.modules[k].name.toLowerCase() : (MOD_NAMES[k] || k)).join(', ') + '.');
if (days && days.value.trim()) parts.push('Дни в РА/РФ: ' + days.value.trim() + '.');
if (when && when.value.trim()) parts.push('Срок отъезда: ' + when.value.trim() + '.');
if (country && country.value.trim()) parts.push('Следующая страна: ' + country.value.trim() + '.');
if (free && free.value.trim()) parts.push(free.value.trim());
if (contact && contact.value.trim()) parts.push('Связь: ' + contact.value.trim() + '.');
if (src && src.value.trim()) parts.push('Узнал(а) о вас: ' + src.value.trim() + '.');
return parts.join(' ');
};
lead.addEventListener('submit', (e) => {
e.preventDefault();
const hp = lead.querySelector('input[name="website"]');
if (hp && hp.value.trim() !== '') return;
const name = $('#f-name', lead), contact = $('#f-contact', lead);
const st = $('#f-state', lead);
const consent = lead.querySelector('input[name="consent"]');
const reqFields = [name, contact, st && st.hasAttribute('required') ? st : null].filter(Boolean);
const bad = reqFields.find(f => !f.value.trim()) || (consent && !consent.checked ? consent : null);
if (bad) {
const errText = bad === consent
? 'Нужно согласие на обработку данных.'
: (st && bad === st ? 'Заполните имя, контакт и выберите задачу.' : 'Заполните имя и контакт для связи.');
if (msg) msg.textContent = errText;
bad.focus();
if (typeof e.respondWith === 'function') {
e.respondWith(Promise.resolve({ ok: false, error: errText }));
}
return;
}
if (msg) msg.textContent = '';
const text = leadText();
if (out) out.value = text;
const waUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
const wa = $('[data-send-wa]', host) || $('[data-send-wa]');
if (wa) wa.setAttribute('href', waUrl);
lead.hidden = true;
if (done) { done.hidden = false; done.focus(); }
if (typeof e.respondWith === 'function') {
e.respondWith(Promise.resolve({
ok: true,
summary: text,
whatsappUrl: waUrl,
telegramUrl: 'https://t.me/LTCG_Armenia',
}));
}
});
const copyBtn = $('[data-copy]', host) || $('[data-copy]');
if (copyBtn && out) {
const note = $('[data-copy-msg]', host) || $('[data-copy-msg]');
copyBtn.addEventListener('click', () => {
const say = (t) => { if (note) note.textContent = t; };
const fallback = () => { out.focus(); out.select(); say('Текст выделен — скопируйте его (Ctrl+C).'); };
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(out.value).then(() => say('Скопировано. Откройте Telegram и вставьте.'), fallback);
} else fallback();
});
}
});
if (hasGsap && !reduced) {
let revealsReady = false;
const initScrollReveals = () => {
if (revealsReady) return;
revealsReady = true;
['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => window.removeEventListener(ev, initScrollReveals));
gsap.registerPlugin(ScrollTrigger);
$$('[data-reveal]').forEach(el => {
el.__revealTween = gsap.fromTo(el, { autoAlpha: 0, y: 24 }, {
autoAlpha: 1, y: 0, duration: 0.75, ease: 'expo.out', clearProps: 'transform,opacity,visibility',
scrollTrigger: { trigger: el, start: 'top 90%', once: true, refreshPriority: -1 }
});
});
$$('[data-stagger]').forEach(group => {
const items = Array.from(group.children);
if (!items.length) return;
group.__revealTween = gsap.fromTo(items, { autoAlpha: 0, y: 32, scale: 0.97 }, {
autoAlpha: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.06, ease: 'expo.out', clearProps: 'transform,opacity,visibility',
scrollTrigger: { trigger: group, start: 'top 88%', once: true, refreshPriority: -1 }
});
});
$$('.kicker').forEach(k => {
k.__revealTween = gsap.fromTo(k, { '--kw': 0 }, { '--kw': 1, duration: 0.6, ease: 'back.out(2.5)', scrollTrigger: { trigger: k, start: 'top 90%', once: true, refreshPriority: -1 } });
});
$$('.art img, .bento-visual img, .nov-hero__figure img').forEach(img => {
const pic = img.closest('picture');
if (pic && getComputedStyle(pic).display === 'none') return;
const host = img.closest('.section, .tile, .nov-hero__figure') || img.parentElement;
if (!host) return;
gsap.fromTo(img, { yPercent: -6, scale: 1.06 }, {
yPercent: 6, scale: 1.06, ease: 'none',
scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true, refreshPriority: -2 }
});
});
const navLinks = $$('.hdr__nav a');
navLinks.forEach(a => {
const { id } = parseHash(a.getAttribute('href'));
const sec = document.getElementById(id);
if (!sec) return;
ScrollTrigger.create({
trigger: sec, start: 'top 45%', end: 'bottom 45%', refreshPriority: -1,
onToggle: (self) => { if (self.isActive) { navLinks.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); } }
});
});
revealVisibleNow();
window.addEventListener('scroll', () => revealVisibleNow(), { passive: true });
};
if (hero && window.scrollY < 4 && !location.hash && !/[?&]at=/.test(location.search)) {
['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, initScrollReveals, { passive: true, once: true }));
} else {
initScrollReveals();
}
}
if (finePointer && !reduced) {
if (hasGsap) {
$$('.btn--primary').forEach(btn => {
const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power2.out' });
const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power2.out' });
btn.addEventListener('pointermove', (e) => {
const r = btn.getBoundingClientRect();
xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
yTo((e.clientY - (r.top + r.height / 2)) * 0.18);
}, { passive: true });
btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); }, { passive: true });
});
}
$$('.bento, .calc__mods, .traps, .oath').forEach(grid => {
grid.addEventListener('pointermove', (e) => {
const t = e.target.closest('.tile');
if (!t) return;
const r = t.getBoundingClientRect();
t.style.setProperty('--mx', (e.clientX - r.left).toFixed(1) + 'px');
t.style.setProperty('--my', (e.clientY - r.top).toFixed(1) + 'px');
}, { passive: true });
});
}
const getStepBlocks = () => $$('main > .section:not([hidden]):not([data-hero-scroll]), footer.ftr');
const isInHeroZone = () => {
if (!hero) return false;
return hero.getBoundingClientRect().bottom > headerH() + 24;
};
const canInnerScroll = (el, dir) => {
let cur = el && el.nodeType === 1 ? el : null;
while (cur && cur !== document.body && cur !== document.documentElement) {
if (cur.tagName === 'TEXTAREA' || cur.tagName === 'SELECT' || cur.classList.contains('csel__list')) return true;
const st = getComputedStyle(cur);
if ((st.overflowY === 'auto' || st.overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight + 2) {
if (dir > 0 && cur.scrollTop + cur.clientHeight < cur.scrollHeight - 2) return true;
if (dir < 0 && cur.scrollTop > 2) return true;
}
cur = cur.parentElement;
}
return false;
};
const findCurrentBlockIndex = (blocks) => {
const hdrTop = headerH();
let bestIdx = 0;
let bestDist = Infinity;
blocks.forEach((b, i) => {
const r = b.getBoundingClientRect();
const d = Math.abs(r.top - hdrTop);
if (d < bestDist) {
bestDist = d;
bestIdx = i;
}
});
return bestIdx;
};
const stepByBlock = (dir) => {
const blocks = getStepBlocks();
if (!blocks.length) return false;
const hdrTop = headerH();
const vh = window.innerHeight;
const idx = findCurrentBlockIndex(blocks);
const cur = blocks[idx];
const r = cur.getBoundingClientRect();
if (dir > 0) {
if (r.top <= hdrTop + 16 && r.bottom > vh + 18) {
const stepDown = Math.min(r.bottom - vh, vh - hdrTop - 32);
setScrollY(window.scrollY + stepDown);
revealVisibleNow(cur);
window.dispatchEvent(new Event('scroll'));
return true;
}
const next = blocks[idx + 1];
if (!next) return true;
const to = Math.max(0, Math.round(next.getBoundingClientRect().top + window.scrollY - hdrTop));
setScrollY(to);
revealVisibleNow(next);
if (next.id) history.replaceState(null, '', '#' + next.id);
window.dispatchEvent(new Event('scroll'));
return true;
} else {
if (r.top < hdrTop - 18) {
const toCur = Math.max(0, Math.round(r.top + window.scrollY - hdrTop));
setScrollY(toCur);
revealVisibleNow(cur);
window.dispatchEvent(new Event('scroll'));
return true;
}
if (idx > 0) {
const prev = blocks[idx - 1];
const to = Math.max(0, Math.round(prev.getBoundingClientRect().top + window.scrollY - hdrTop));
setScrollY(to);
revealVisibleNow(prev);
if (prev.id) history.replaceState(null, '', '#' + prev.id);
window.dispatchEvent(new Event('scroll'));
return true;
}
if (hero) {
document.body.classList.remove('is-landed');
const gateY = Math.max(0, Math.round(hero.offsetTop + Math.max(0, hero.offsetHeight - vh) * 0.94));
setScrollY(gateY);
history.replaceState(null, '', location.pathname + location.search);
window.dispatchEvent(new Event('scroll'));
return true;
}
setScrollY(0);
return true;
}
};
let lastWheelTs = 0;
let lastStepTs = 0;
let lastStepDir = 0;
let minAbsDeltaSinceStep = Infinity;
window.addEventListener('wheel', (e) => {
if (window.innerWidth < 1024) return;
if (e.ctrlKey || e.metaKey) return;
if (document.documentElement.classList.contains('is-gate-locked') || document.documentElement.classList.contains('menu-open')) return;
if (isInHeroZone()) return;
if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
const absD = Math.abs(e.deltaY);
if (absD < 2) {
e.preventDefault();
e.stopImmediatePropagation();
return;
}
const dir = e.deltaY > 0 ? 1 : -1;
if (canInnerScroll(e.target, dir)) return;
e.preventDefault();
e.stopImmediatePropagation();
const now = performance.now();
const dtEvent = now - lastWheelTs;
const dtStep = now - lastStepTs;
lastWheelTs = now;
const dirChanged = (dir !== lastStepDir) && (dtStep > 80);
const gestureGap = dtEvent > 120;
const newFlickSpike = (dtStep > 260) && (absD > minAbsDeltaSinceStep * 1.45) && (absD >= 18);
const cooldownDone = dtStep > 480;
if (dirChanged || gestureGap || newFlickSpike || cooldownDone) {
lastStepTs = now;
lastStepDir = dir;
minAbsDeltaSinceStep = absD;
stepByBlock(dir);
} else {
if (absD < minAbsDeltaSinceStep) minAbsDeltaSinceStep = absD;
}
}, { passive: false, capture: true });
window.addEventListener('keydown', (e) => {
if (window.innerWidth < 1024) return;
if (e.altKey || e.ctrlKey || e.metaKey) return;
if (document.documentElement.classList.contains('is-gate-locked') || document.documentElement.classList.contains('menu-open')) return;
if (isInHeroZone()) return;
const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'SUMMARY' || (e.target && e.target.isContentEditable)) return;
if (e.key === 'PageDown' || e.key === 'ArrowDown') {
e.preventDefault();
stepByBlock(1);
} else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
e.preventDefault();
stepByBlock(-1);
}
});
let saved = '';
try { saved = localStorage.getItem('ltcg.state') || ''; } catch (e) { saved = ''; }
if (location.hash) {
applyHash(location.hash, false);
const { id } = parseHash(location.hash);
if (id && id !== 'hero' && document.getElementById(id)) {
setTimeout(() => scrollToId(id, true), 120);
window.addEventListener('load', () => setTimeout(() => scrollToId(id, true), 360), { once: true });
}
} else if (saved && stateNames[saved]) {
setState(saved, { keepForm: false });
}
window.addEventListener('hashchange', () => applyHash(location.hash, true));
updateWa();
const at = /[?&]at=([\w-]+)/.exec(location.search);
if (at) {
const runAt = () => {
const el = document.getElementById(at[1]);
if (!el) return;
document.body.classList.add('is-landed');
document.documentElement.classList.add('hdr-on');
const siteHead = document.getElementById('siteHead');
if (siteHead) siteHead.style.display = 'none';
hdr && hdr.classList.add('is-shown');
dock && dock.classList.add('is-shown');
revealVisibleNow(el);
$$('img', el).forEach(img => { img.loading = 'eager'; img.decoding = 'sync'; });
if (/[?&]motion=0/.test(location.search)) {
if (hero) hero.style.display = 'none';
const mainEl = document.getElementById('main');
if (hero && mainEl) mainEl.style.paddingTop = headerH() + 'px';
let prev = el.previousElementSibling;
while (prev) {
prev.style.display = 'none';
prev = prev.previousElementSibling;
}
window.scrollTo(0, 0);
} else {
setScrollY(el.getBoundingClientRect().top + window.scrollY - headerH() - 8);
}
};
runAt();
if (document.readyState !== 'complete') {
window.addEventListener('load', runAt, { once: true });
}
}
})();
