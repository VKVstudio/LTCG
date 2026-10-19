(function () {
'use strict';
const html = document.documentElement;
const SITE_ROOT = html.getAttribute('data-site-root') || '/';
const PLATE_W = 2560;
const PLATE_H = 1440;
const SLICE_END = 0.44;
const GLASS_END = 0.60;
const WALK_END = 0.88;
const GATE_P = 0.985;
const HERO_END = 1.0;
const PIN_PCT = 540;
const ASSETS = SITE_ROOT + 'assets/hero/';
const MOBILE_GATE = '(max-width: 767px), ((max-height: 767px) and (pointer: coarse))';
const MAX_ZOOM = 1.5;
const LOD = [1280, 1920, 2560];
const LOGO_FIT = 0.72;
const P_LERP = window.__lenis ? 1 : 0.18;
const LERP_HZ = 1000 / 60;
const root = document.querySelector('[data-hero-scroll]');
if (!root) return;
const stage = root.querySelector('.hs__stage');
const canvas = root.querySelector('.hs__canvas');
const svgLight = root.querySelector('.hs__svg--light');
const svgSolid = root.querySelector('.hs__svg--solid');
const worldLight = svgLight.querySelector('.hs__world');
const worldSolid = svgSolid.querySelector('.hs__world');
const poster = root.querySelector('.hs__poster');
const posterImg = poster ? poster.querySelector('img') : null;
const grain = root.querySelector('.hs__grain');
const hint = root.querySelector('.hs__hint');
const skip = root.querySelector('.hs__skip');
const screen = root.querySelector('.hs__screen');
const screenGlow = root.querySelector('.hs__screen-glow');
const pg = screen ? screen.querySelector('.pg') : null;
const pgLangLine = pg ? pg.querySelector('.lang-line') : null;
const pgLangItems = pgLangLine ? Array.from(pgLangLine.querySelectorAll('.lang-line__item')) : [];
const langChoices = pg ? Array.from(pg.querySelectorAll('[data-lang]')) : [];
const pgHint = pg ? pg.querySelector('.lang-hint') : null;
const head = document.getElementById('siteHead');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=0/.test(location.search);
const isMobile = window.matchMedia(MOBILE_GATE).matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const debug = /[?&]debug=1/.test(location.search);
let hud = null;
if (debug) { hud = document.createElement('div'); hud.className = 'hs__hud'; hud.setAttribute('aria-hidden', 'true'); stage.appendChild(hud); }
let SKIN_BG = (getComputedStyle(html).getPropertyValue('--bg') || '').trim() || '#0C1B3A';
const refreshSkinBg = () => {
SKIN_BG = (getComputedStyle(html).getPropertyValue('--bg') || '').trim() || '#0C1B3A';
};
if (typeof MutationObserver !== 'undefined') {
new MutationObserver(refreshSkinBg).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
}
const darkMq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
if (darkMq && typeof darkMq.addEventListener === 'function') {
darkMq.addEventListener('change', refreshSkinBg);
}
const S = {
p: 0,
zoom: 1, cx: PLATE_W / 2, cy: PLATE_H / 2,
dusk: 0,
draw: 0,
glow: 0,
swoosh: 0,
head: 0,
morph: 0,
fill: 0,
shapes: 0,
snow: 0,
letters: 0,
tagline: 0,
glass: 0,
logoSit: 0,
dolly: 0,
screenIn: 0,
full: 0,
navy: 0,
markOut: 0,
choose: 0,
logoFade: 0,
walk: 0,
};
const plates = { A: null, D: null, E: null };
const blur = { A40: null, E40: null };
let quads = null;
let ridgePts = null;
let emblemPts = null;
let anchors = null;
let logo = null;
const N = 64;
const ASSET_V = '?v=20260904quad';
const withV = (url) => url + (url.indexOf('?') < 0 ? ASSET_V : '');
function loadBitmap(url) {
return fetch(withV(url)).then(r => { if (!r.ok) throw new Error(url); return r.blob(); })
.then(b => ('createImageBitmap' in window) ? createImageBitmap(b) : blobToImage(b));
}
function blobToImage(b) {
return new Promise((res, rej) => {
const img = new Image();
img.onload = () => res(img); img.onerror = rej;
img.src = URL.createObjectURL(b);
});
}
const supportsWebp = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
let ext = supportsWebp ? '.webp' : '.jpg';
function posterReady() {
if (!posterImg) return Promise.reject(new Error('no poster'));
const loaded = (posterImg.complete && posterImg.naturalWidth)
? Promise.resolve()
: new Promise((res, rej) => {
posterImg.addEventListener('load', res, { once: true });
posterImg.addEventListener('error', () => rej(new Error('poster')), { once: true });
});
const decoded = posterImg.decode
? Promise.race([posterImg.decode().catch(() => {}), new Promise(res => setTimeout(res, 400))])
: Promise.resolve();
return loaded
.then(() => decoded)
.then(() => {
if (/\.avif(\?|$)/i.test(posterImg.currentSrc || '')) ext = '.avif';
return ('createImageBitmap' in window) ? createImageBitmap(posterImg) : posterImg;
});
}
function lodW(zoomMax) {
const need = Math.min(2560, Math.ceil(Math.max(vw, 1) * dpr * (zoomMax || MAX_ZOOM)));
return LOD.find(w => w >= need) || 2560;
}
function plateUrl(base, w) {
if (base === 'A') return ASSETS + 'lcp/A-' + w + ext;
return w === 2560 ? ASSETS + base + ext : ASSETS + base + '-' + w + ext;
}
function loadPlate(base, w) {
return loadBitmap(plateUrl(base, w)).catch(() => loadBitmap(ASSETS + base + '.jpg'));
}
function loadQuads() {
return fetch(withV(ASSETS + 'E-quads.json')).then(r => r.ok ? r.json() : Promise.reject(new Error('no E-quads')))
.then(q => fetch(withV(ASSETS + 'flow/walk_screen_track.json')).then(r => r.ok ? r.json() : null)
.catch(() => null)
.then(tr => { if (tr) q.walk_track = tr; return { quads: q, base: 'E' }; }));
}
function makeBlur(src, r) {
const pad = r * 3;
const big = document.createElement('canvas'); big.width = 1280 + 2 * pad; big.height = 720 + 2 * pad;
const x = big.getContext('2d');
if (!x || !('filter' in x)) return null;
x.drawImage(src, pad, pad, 1280, 720);
x.save(); x.translate(pad, 0); x.scale(-1, 1); x.drawImage(src, 0, pad, 1280, 720); x.restore();
x.save(); x.translate(1280 + pad, 0); x.scale(-1, 1); x.drawImage(src, -1280, pad, 1280, 720); x.restore();
x.save(); x.translate(0, pad); x.scale(1, -1); x.drawImage(src, pad, 0, 1280, 720); x.restore();
x.save(); x.translate(0, 720 + pad); x.scale(1, -1); x.drawImage(src, pad, -720, 1280, 720); x.restore();
const out = document.createElement('canvas'); out.width = 1280; out.height = 720;
const o = out.getContext('2d');
o.filter = 'blur(' + r + 'px)';
o.drawImage(big, -pad, -pad);
return out;
}
function loadBlur(base, r, sourceBitmap) {
const c = sourceBitmap ? makeBlur(sourceBitmap, r) : null;
if (c) return Promise.resolve(c);
return loadBitmap(ASSETS + 'blur/' + base + '-b' + r + '.jpg').catch(() => null);
}
let vw = 0, vh = 0, dpr = 1, ctx = null;
const cam = { s: 1, tx: 0, ty: 0 };
let gradeGrad = null, vigGrad = null, keyGrad = null;
let duskBand = null;
let embVig = null, embKey = null;
function resize() {
vw = window.innerWidth || stage.clientWidth;
vh = window.innerHeight || stage.clientHeight;
dpr = Math.min(window.devicePixelRatio || 1, 1.5, PLATE_W / vw);
canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
if (!ctx) ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
svgLight.setAttribute('width', vw); svgLight.setAttribute('height', vh);
svgSolid.setAttribute('width', vw); svgSolid.setAttribute('height', vh);
buildGrades();
render();
}
function buildGrades() {
gradeGrad = ctx.createLinearGradient(0, 0, vw, vh);
gradeGrad.addColorStop(0, 'rgb(255,198,116)');
gradeGrad.addColorStop(0.5, 'rgb(128,128,128)');
gradeGrad.addColorStop(1, 'rgb(22,44,104)');
vigGrad = ctx.createRadialGradient(vw * 0.5, vh * 0.46, Math.min(vw, vh) * 0.32, vw * 0.5, vh * 0.5, Math.hypot(vw, vh) * 0.6);
vigGrad.addColorStop(0, 'rgb(255,255,255)');
vigGrad.addColorStop(0.7, 'rgb(150,148,158)');
vigGrad.addColorStop(1, 'rgb(34,36,48)');
keyGrad = ctx.createRadialGradient(vw * 0.1, vh * 0.42, 0, vw * 0.1, vh * 0.42, vw * 0.6);
keyGrad.addColorStop(0, 'rgba(255,208,140,1)');
keyGrad.addColorStop(1, 'rgba(255,208,140,0)');
if (!duskBand) {
duskBand = ctx.createLinearGradient(0, 320, 0, 780);
duskBand.addColorStop(0, 'rgba(255,170,90,0)');
duskBand.addColorStop(0.35, 'rgba(255,170,90,1)');
duskBand.addColorStop(0.7, 'rgba(255,150,70,1)');
duskBand.addColorStop(1, 'rgba(255,150,70,0)');
}
if (EMB.w > 0) {
const cxv = EMB.left + EMB.w / 2, cyv = EMB.top + EMB.h * 1.1;
embVig = ctx.createRadialGradient(cxv, cyv, EMB.w * 0.45, cxv, cyv, EMB.w * 1.6);
embVig.addColorStop(0, 'rgba(8,14,30,0.35)');
embVig.addColorStop(1, 'rgba(8,14,30,0.85)');
embKey = ctx.createLinearGradient(EMB.left, EMB.top, EMB.left + EMB.w * 0.6, EMB.top + EMB.h);
embKey.addColorStop(0, 'rgba(255,243,208,0.95)');
embKey.addColorStop(0.55, 'rgba(128,128,128,0)');
embKey.addColorStop(1, 'rgba(60,40,10,0.6)');
}
}
function coverScale() { return Math.max(vw / PLATE_W, vh / PLATE_H); }
const DOLLY_FROM = { zoom: 1.02, cx: 1300, cy: 735 };
function computeCamera() {
const s0 = coverScale();
let zoom = S.zoom, scx = S.cx, scy = S.cy;
if (S.dolly > 0.001 && quads) {
const t = S.dolly, sc = quadCenter(quads.screen_quad);
const hw0 = vw / (2 * s0 * DOLLY_FROM.zoom), hw1 = vw / (2 * s0 * monitorZoom());
const hw = lerp(hw0, hw1, t);
zoom = vw / (2 * s0 * hw);
scx = lerp(DOLLY_FROM.cx, sc[0], t); scy = lerp(DOLLY_FROM.cy, sc[1], t);
}
const s = s0 * zoom;
const halfW = vw / (2 * s), halfH = vh / (2 * s);
const cx = Math.min(Math.max(scx, halfW), PLATE_W - halfW);
const cy = Math.min(Math.max(scy, halfH), PLATE_H - halfH);
cam.s = s; cam.tx = vw / 2 - cx * s; cam.ty = vh / 2 - cy * s;
cam.zoom = zoom;
}
const toView = (pt) => [pt[0] * cam.s + cam.tx, pt[1] * cam.s + cam.ty];
const WALK_W = 1280, WALK_H = 720;
const walkVideo = root.querySelector('.hs__video');
const walkFrame = document.createElement('canvas'); walkFrame.width = WALK_W; walkFrame.height = WALK_H;
const walkCtx = walkFrame.getContext('2d', { alpha: false });
let walkReady = false, walkHas = false, walkSeeking = false, walkSeekAt = 0;
let walkFrameT = -1;
const WALK_FPS = 24;
const WALK_TIMEOUT = 250;
let walkWantFrame = -1, walkSeekFrame = -1, walkMiss = 0, walkSeekMs = 0, walkSeeks = 0;
function walkActive() { return walkReady && walkHas && S.walk > 0.001; }
function walkMatrix() {
const s = Math.max(vw / WALK_W, vh / WALK_H);
return { s, tx: (vw - WALK_W * s) / 2, ty: (vh - WALK_H * s) / 2 };
}
function walkGrab(mediaTime) {
if (walkVideo.readyState < 2) return;
const t = (typeof mediaTime === 'number' && isFinite(mediaTime)) ? mediaTime : walkVideo.currentTime;
const i = Math.floor(t * WALK_FPS + 0.25);
if (walkHas && walkFrameT >= 0 && i === Math.floor(walkFrameT * WALK_FPS + 0.25)) { walkFrameT = t; return; }
walkCtx.drawImage(walkVideo, 0, 0, WALK_W, WALK_H);
walkFrameT = t;
if (!walkHas) walkAt = arrived();
walkHas = true;
}
function walkTarget() { return Math.min(Math.max(S.walk, 0), 1) * (walkVideo.duration - 1 / 24); }
function walkSync() {
if (!walkReady || !isFinite(walkVideo.duration)) return false;
if (!walkVideo.paused) walkVideo.pause();
if (walkSeeking && performance.now() - walkSeekAt > WALK_TIMEOUT) walkSeeking = false;
const n = Math.max(1, Math.round(walkVideo.duration * WALK_FPS));
walkWantFrame = Math.min(n - 1, Math.max(0, Math.round(Math.min(Math.max(S.walk, 0), 1) * (n - 1))));
if (walkSeeking) return true;
if (walkVideo.readyState < 1) return false;
if (walkWantFrame === walkSeekFrame) return false;
walkSeekFrame = walkWantFrame;
walkSeeking = true; walkSeekAt = performance.now();
walkVideo.currentTime = (walkWantFrame + 0.5) / WALK_FPS;
return true;
}
const FADE_MS = 320;
let eAt = 0, walkAt = 0;
const fadeK = (at) => at ? Math.min(1, (performance.now() - at) / FADE_MS) : 0;
const arrived = () => performance.now() - (loopOn ? 0 : FADE_MS);
function assetFading() { return (!!eAt && fadeK(eAt) < 1) || (!!walkAt && fadeK(walkAt) < 1); }
function walkLoad() {
if (!walkVideo || walkVideo.dataset.loaded) return;
walkVideo.dataset.loaded = '1';
walkVideo.addEventListener('loadedmetadata', () => { walkReady = true; kick(); });
walkVideo.addEventListener('seeked', () => {
walkSeeking = false;
walkSeekMs = performance.now() - walkSeekAt; walkSeeks++;
if (walkSeekFrame >= 0 && Math.abs(walkVideo.currentTime - (walkSeekFrame + 0.5) / WALK_FPS) > 1 / WALK_FPS) {
if (++walkMiss >= 3) { walkReady = false; walkHas = false; walkFrameT = -1; }
} else walkMiss = 0;
walkGrab(); kick();
});
walkVideo.addEventListener('loadeddata', () => { walkGrab(); kick(); });
walkVideo.addEventListener('error', () => { walkReady = false; walkHas = false; walkFrameT = -1; walkSeeking = false; walkSeekFrame = -1; });
if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
const onFrame = (now, md) => { frameCount++; walkGrab(md && md.mediaTime); kick(); walkVideo.requestVideoFrameCallback(onFrame); };
walkVideo.requestVideoFrameCallback(onFrame);
}
walkVideo.preload = 'auto';
fetch(withV(walkVideo.dataset.src)).then(r => { if (!r.ok) throw new Error('walk'); return r.blob(); })
.then(b => { walkVideo.src = URL.createObjectURL(b); walkVideo.load(); })
.catch(() => { walkVideo.src = withV(walkVideo.dataset.src); walkVideo.load(); });
}
let trackFirst = -1;
function trackFps() { const tr = quads && quads.walk_track; return (tr && tr.fps) || 24; }
function shownFrame() {
const tr = quads && quads.walk_track;
if (!tr || !tr.quads || !tr.quads.length) return -1;
if (walkFrameT < 0) return -1;
return Math.min(tr.quads.length - 1, Math.max(0, Math.floor(walkFrameT * trackFps() + 0.25)));
}
function trackQuadAt(t01) {
const tr = quads.walk_track;
if (!tr || !tr.quads || !tr.quads.length) return null;
const n = tr.quads.length;
const i = Math.min(n - 1, Math.max(0, Math.round(t01 * (n - 1))));
return tr.quads[i] || null;
}
function trackStart() {
const tr = quads.walk_track;
if (!tr || !tr.quads) return 1;
if (trackFirst < 0) { trackFirst = (typeof tr.wake_from === 'number') ? tr.wake_from : ((typeof tr.first === 'number') ? tr.first : tr.quads.findIndex(q => q)); if (trackFirst < 0) trackFirst = tr.quads.length; }
return trackFirst / Math.max(1, tr.quads.length - 1);
}
function screenQuadView() {
if (S.full >= 0.999) return [[0, 0], [vw, 0], [vw, vh], [0, vh]];
if (walkActive()) {
const i = shownFrame();
if (i < 0) return null;
const q = quads.walk_track.quads[i];
if (!q) return null;
const M = walkMatrix();
return q.map(p => [p[0] * M.s + M.tx, p[1] * M.s + M.ty]);
}
if (S.walk > 0.001) return null;
return quads.screen_quad.map(toView);
}
function quadInsideView(q) {
const m = 2;
for (let i = 0; i < q.length; i++) {
if (q[i][0] < -m || q[i][0] > vw + m || q[i][1] < -m || q[i][1] > vh + m) return false;
}
return true;
}
const NS = 'http://www.w3.org/2000/svg';
function ensure(parent, tag, id, cls, before) {
let el = parent.querySelector('#' + id);
if (el) return el;
el = document.createElementNS(NS, tag);
el.setAttribute('id', id);
if (cls) el.setAttribute('class', cls);
if (before) parent.insertBefore(el, before); else parent.appendChild(el);
return el;
}
const edgePath = svgSolid.querySelector('#hsEdge');
const edgeBody = svgSolid.querySelector('#hsEdgeBody');
const edgeShadow = svgSolid.querySelector('#hsEdgeShadow');
const glowPath = svgLight.querySelector('#hsGlow');
const spark = svgLight.querySelector('#hsSpark');
const glow2 = ensure(worldLight, 'path', 'hsGlow2', 'hs__glow-2', spark);
const glow3 = ensure(worldLight, 'path', 'hsGlow3', 'hs__glow-3', spark);
const sparkTail = ensure(worldLight, 'path', 'hsSparkTail', 'hs__spark-tail', spark);
if (glowPath) glowPath.removeAttribute('filter');
if (glowPath) glowPath.style.filter = 'none';
if (spark) {
spark.setAttribute('r', '120');
const g = svgLight.querySelector('#hsSparkGrad');
if (g) {
g.innerHTML = '';
[['0', '#FFFFFF', '1'], ['0.12', '#FFF3D0', '0.9'], ['0.3', '#FAE0A2', '0.45'], ['1', '#F2C249', '0']].forEach(([o, c, a]) => {
const st = document.createElementNS(NS, 'stop');
st.setAttribute('offset', o); st.setAttribute('stop-color', c); st.setAttribute('stop-opacity', a);
g.appendChild(st);
});
}
}
const swooshMaskPaths = Array.from(root.querySelectorAll('.hs__swoosh-mask-path'));
const swooshMaskPath = swooshMaskPaths[0];
const swooshLight = svgLight.querySelector('#hsSwooshLight');
const swooshGroup = svgSolid.querySelector('#hsSwoosh');
const headGroup = svgSolid.querySelector('#hsHead');
const fillPoly = svgSolid.querySelector('#hsFill');
const shapesGroup = svgSolid.querySelector('#hsShapes');
const snowGroup = svgSolid.querySelector('#hsSnow');
const lettersGroup = svgSolid.querySelector('#hsLetters');
const taglineGroup = svgSolid.querySelector('#hsTagline');
const etchLight = ensure(worldSolid, 'g', 'hsEtchLight', 'hs__etch-light', fillPoly);
const etchDark = ensure(worldSolid, 'g', 'hsEtchDark', 'hs__etch-dark', fillPoly);
const lettersShadow = ensure(worldSolid, 'g', 'hsLettersShadow', 'hs__letters-shadow', lettersGroup);
const logoGroups = [etchLight, etchDark, shapesGroup, snowGroup, swooshGroup, swooshLight, lettersShadow, lettersGroup, taglineGroup];
let letterPaths = [];
let edgeLen = 0, lastMorph = -1, lastD = '', swooshLen = 0;
let gildPath = null, gildGrad = null;
let mainD = '', thirdD = '', lowerD = '', gildExact = null;
let firstFrame = false;
function gildGradient() {
if (!gildGrad) {
gildGrad = ctx.createLinearGradient(EMB.left, EMB.top + EMB.h, EMB.left + EMB.w, EMB.top);
gildGrad.addColorStop(0, '#C4922B');
gildGrad.addColorStop(0.5, '#F2C249');
gildGrad.addColorStop(0.8, '#FAE0A2');
gildGrad.addColorStop(1, '#C4922B');
}
return gildGrad;
}
function morphD(m) {
if (!ridgePts || !emblemPts) return '';
let d = '';
for (let i = 0; i < N; i++) {
const x = ridgePts[i][0] + (emblemPts[i][0] - ridgePts[i][0]) * m;
const y = ridgePts[i][1] + (emblemPts[i][1] - ridgePts[i][1]) * m;
d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
}
return d;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v, a, b) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function drawPlate(img, alpha) {
if (!img || alpha <= 0.001) return;
ctx.globalAlpha = Math.min(1, alpha);
ctx.drawImage(img, 0, 0, PLATE_W, PLATE_H);
ctx.globalAlpha = 1;
}
const soft = document.createElement('canvas'); soft.width = 1280; soft.height = 720;
const softCtx = soft.getContext('2d', { alpha: false });
if (softCtx) { softCtx.imageSmoothingEnabled = true; softCtx.imageSmoothingQuality = 'high'; }
function drawSoftPair(srcA, srcE, mix, r, alpha) {
if (alpha <= 0.002 || !softCtx) return;
const k = Math.min(1, Math.max(0, r));
const w = Math.max(44, Math.round(1280 * Math.pow(0.034, k)));
const h = Math.max(25, Math.round(w * 720 / 1280));
const a = srcE ? Math.min(1, Math.max(0, mix)) : 0;
const base = (a >= 0.999) ? srcE : srcA;
if (!base) return;
softCtx.globalAlpha = 1;
softCtx.drawImage(base, 0, 0, w, h);
if (a > 0.001 && a < 0.999 && srcE) {
softCtx.globalAlpha = a; softCtx.drawImage(srcE, 0, 0, w, h); softCtx.globalAlpha = 1;
}
ctx.globalAlpha = Math.min(1, alpha);
ctx.drawImage(soft, 0, 0, w, h, 0, 0, PLATE_W, PLATE_H);
ctx.globalAlpha = 1;
}
function haze(g) { return Math.pow(Math.sin(Math.PI * clamp01(g)), 0.62); }
let renderCount = 0, frameCount = 0;
function render() {
if (!ctx || !plates.A || !vw || !vh) return;
renderCount++;
computeCamera();
const { s, tx, ty } = cam;
const on = S.draw > 0;
const g = S.glass;
const eIn = plates.E ? fadeK(eAt) : 0;
const wE = smooth(g, 0.34, 0.66) * eIn;
const hz = g > 0.001 ? haze(g) : 0;
const fadeA = 1 - smooth(g, 0, 0.4);
ctx.setTransform(s * dpr, 0, 0, s * dpr, tx * dpr, ty * dpr);
ctx.globalAlpha = 1;
const walkIn = walkHas ? fadeK(walkAt) : 0;
const walkA = walkActive() ? smooth(S.walk, 0, 0.05) * walkIn : 0;
const walkCovers = walkA >= 0.999;
if (walkCovers) {
} else if (wE < 0.999 || !plates.E) {
ctx.drawImage(plates.A, 0, 0, PLATE_W, PLATE_H);
if (plates.D && S.dusk > 0.001) drawPlate(plates.D, S.dusk);
const vigK = Math.max(smooth(S.fill, 0, 1) * 0.55, Math.min(1, S.shapes)) * 0.85 * fadeA;
if (vigK > 0.001 && embVig) {
ctx.save();
ctx.globalAlpha = vigK;
ctx.fillStyle = embVig;
ctx.fillRect(0, 0, PLATE_W, PLATE_H);
ctx.restore();
}
if (S.fill > 0.001 && gildPath && fadeA > 0.001) {
const k = Math.min(1, S.fill) * 0.9 * (1 - 0.35 * S.shapes) * fadeA;
const useExact = S.morph >= 0.999 && gildExact;
const passes = useExact
? [[gildPath, 1 - S.shapes, 'nonzero'], [gildExact, S.shapes, 'evenodd']]
: [[gildPath, 1, 'nonzero']];
ctx.save();
passes.forEach(([path, w, rule]) => {
if (w <= 0.001) return;
ctx.globalCompositeOperation = 'color';
ctx.globalAlpha = k * w;
ctx.fillStyle = gildGradient();
ctx.fill(path, rule);
ctx.globalCompositeOperation = 'overlay';
ctx.globalAlpha = k * w * 0.8;
ctx.fillStyle = '#F2C249';
ctx.fill(path, rule);
if (embKey) {
ctx.globalCompositeOperation = 'soft-light';
ctx.globalAlpha = k * w * 0.9;
ctx.fillStyle = embKey;
ctx.fill(path, rule);
}
});
ctx.restore();
}
if (wE > 0.001 && plates.E) drawPlate(plates.E, wE);
} else {
ctx.drawImage(plates.E, 0, 0, PLATE_W, PLATE_H);
}
if (!walkCovers && hz > 0.002) {
drawSoftPair(blur.A40 || plates.D || plates.A, blur.E40 || plates.E, wE, hz, hz);
}
if (walkA > 0.001) {
const a = walkA;
const M = walkMatrix();
ctx.setTransform(M.s * dpr, 0, 0, M.s * dpr, M.tx * dpr, M.ty * dpr);
ctx.globalAlpha = a;
ctx.drawImage(walkFrame, 0, 0, WALK_W, WALK_H);
ctx.globalAlpha = 1;
}
const office = smooth(g, 0.5, 1);
const live = 1 - Math.min(1, S.navy);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
const gradeK = (0.16 + 0.16 * office) * live;
if (gradeK > 0.001) {
ctx.globalCompositeOperation = 'soft-light';
ctx.globalAlpha = gradeK; ctx.fillStyle = gradeGrad; ctx.fillRect(0, 0, vw, vh);
}
if (S.dusk > 0.001 && fadeA > 0.001 && duskBand) {
ctx.setTransform(s * dpr, 0, 0, s * dpr, tx * dpr, ty * dpr);
ctx.globalCompositeOperation = 'soft-light';
ctx.globalAlpha = 0.22 * S.dusk * fadeA * live; ctx.fillStyle = duskBand; ctx.fillRect(0, 0, PLATE_W, PLATE_H);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
const keyK = 0.12 * office * live * (1 - 0.6 * S.dolly);
if (keyK > 0.001) {
ctx.globalCompositeOperation = 'screen';
ctx.globalAlpha = keyK; ctx.fillStyle = keyGrad; ctx.fillRect(0, 0, vw, vh);
}
const vigK = (0.16 + 0.10 * S.dusk + 0.24 * office + 0.12 * S.dolly) * live;
if (vigK > 0.001) {
ctx.globalCompositeOperation = 'multiply';
ctx.globalAlpha = vigK; ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, vw, vh);
}
ctx.globalCompositeOperation = 'source-over';
ctx.globalAlpha = 1;
if (S.navy > 0.001) {
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.globalAlpha = Math.min(1, S.navy);
ctx.fillStyle = SKIN_BG;
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalAlpha = 1;
}
if (!firstFrame && S.p > 0.002) { firstFrame = true; if (poster) poster.classList.add('is-hidden'); }
const m = 'matrix(' + s + ',0,0,' + s + ',' + tx + ',' + ty + ')';
worldLight.setAttribute('transform', m);
worldSolid.setAttribute('transform', m);
svgLight.style.opacity = String(fadeA);
const solidO = (1 - S.navy) * (1 - S.logoFade);
svgSolid.style.opacity = String(solidO);
svgSolid.style.visibility = solidO > 0.002 ? 'visible' : 'hidden';
svgLight.style.visibility = (S.glass >= 0.999 || solidO <= 0.002) && S.p > SLICE_END ? 'hidden' : 'visible';
if (edgePath && ridgePts) {
const strokes = [edgePath, edgeBody, edgeShadow, glowPath, glow2, glow3, sparkTail].filter(Boolean);
if (S.morph !== lastMorph) {
lastD = morphD(S.morph);
const closed = lastD + ' L' + emblemBase().join(' ') + ' Z';
strokes.forEach(el => el.setAttribute('d', lastD));
fillPoly.setAttribute('d', closed);
gildPath = new Path2D(closed);
edgeLen = edgePath.getTotalLength();
lastMorph = S.morph;
}
const main = [edgePath, edgeBody, edgeShadow, glowPath, glow2, glow3].filter(Boolean);
if (S.draw < 0.999) {
const dash = edgeLen;
main.forEach(el => { el.style.strokeDasharray = dash + ' ' + dash; el.style.strokeDashoffset = String(dash * (1 - S.draw)); });
} else {
main.forEach(el => { el.style.strokeDasharray = 'none'; });
}
edgePath.style.opacity = S.draw > 0 ? 0.95 * fadeA : 0;
const gl = on ? S.glow * fadeA : 0;
glowPath.style.opacity = 0.14 * gl;
glow2.style.opacity = 0.22 * gl;
glow3.style.opacity = 0.38 * gl;
if (edgeShadow) edgeShadow.style.opacity = on ? (0.55 * (1 - S.fill) * fadeA) : 0;
if (spark) {
if (S.draw > 0.002 && S.draw < 0.998) {
const pt = edgePath.getPointAtLength(edgeLen * S.draw);
spark.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
spark.style.opacity = 0.95;
const tail = Math.min(edgeLen * 0.12, 260);
sparkTail.style.strokeDasharray = tail + ' ' + edgeLen;
sparkTail.style.strokeDashoffset = String(-(edgeLen * S.draw - tail));
sparkTail.style.opacity = 0.7;
} else {
spark.style.opacity = 0;
sparkTail.style.opacity = 0;
}
}
}
if (swooshMaskPath && swooshLen) {
const L = swooshLen;
swooshMaskPaths.forEach(p => { p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = String(L * (1 - S.swoosh)); });
swooshLight.style.opacity = S.swoosh > 0 ? Math.max(0, (1 - S.head * 0.6) * (1 - S.fill)) : 0;
swooshGroup.style.opacity = S.swoosh > 0 ? Math.min(1, S.swoosh * 1.4) : 0;
headGroup.style.opacity = S.head;
headGroup.setAttribute('transform', headTransform(S.head));
}
fillPoly.style.opacity = 0;
shapesGroup.style.opacity = S.shapes * (0.86 + 0.14 * Math.min(1, S.logoSit));
snowGroup.style.opacity = 0;
edgeBody.style.opacity = on ? (0.95 - 0.6 * S.shapes) * fadeA : 0;
lettersGroup.style.opacity = S.letters > 0 ? 1 : 0;
letterPaths.forEach((p, i) => {
const k = smooth(S.letters, i * 0.14, 0.58 + i * 0.14);
p.style.opacity = k.toFixed(3);
p.setAttribute('transform', 'translate(0,' + ((1 - k) * 12).toFixed(2) + ')');
});
taglineGroup.style.opacity = S.tagline;
lettersShadow.style.opacity = (0.42 * Math.min(1, S.letters) * (1 - Math.min(1, S.logoSit))).toFixed(3);
etchLight.style.opacity = (0.55 * Math.min(1, S.logoSit)).toFixed(3);
etchDark.style.opacity = (0.28 * Math.min(1, S.logoSit)).toFixed(3);
if (S.logoSit > 0.001 && panelM) {
const t = S.logoSit;
const M = logoM.map((v, i) => lerp(v, panelM[i], t));
const attr = 'matrix(' + M.join(',') + ')';
logoGroups.forEach(gr => gr.setAttribute('transform', attr));
headGroup.setAttribute('transform', attr);
} else if (logoSat) {
logoGroups.forEach(gr => gr.setAttribute('transform', logoT));
}
logoSat = S.logoSit > 0.001;
setClass(root, 'is-glass', S.logoSit > 0.5);
if (grain) {
const gx = Math.round(((S.p * 41.3) % 1) * 256), gy = Math.round(((S.p * 27.7) % 1) * 256);
grain.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
setVar(grain, 'opacity', ((0.10 + 0.06 * S.dusk + 0.05 * smooth(g, 0.1, 0.6) * (1 - office) + 0.03 * office) * (1 - 0.6 * S.navy)).toFixed(3));
}
setProp(stage, '--hs-scrim', ((1 - 0.5 * S.dusk) * (1 - S.markOut)).toFixed(3));
if (head) setProp(head, '--brand-o', (1 - S.markOut).toFixed(3));
if (skip) { const gone = S.walk > 0.5 || smooth(S.dolly, 0, 0.5) > 0.5 || S.screenIn > 0.2; if (setClass(skip, 'is-gone', gone)) skip.inert = gone; }
renderScreen();
if (hint) setVar(hint, 'opacity', S.p > 0.03 ? '0' : '1');
if (hud) hud.textContent = 'p=' + S.p.toFixed(3) + ' zoom=' + (cam.zoom || S.zoom).toFixed(2) + ' glass=' + S.glass.toFixed(2) + ' hz=' + hz.toFixed(2) + ' walk=' + S.walk.toFixed(2) + (walkReady ? '' : '!') + ' scr=' + S.screenIn.toFixed(2) + ' full=' + S.full.toFixed(2) + ' pgin=' + PG.in.toFixed(2) + (locked ? ' LOCK' : '');
}
let logoSat = false;
const lastProp = new WeakMap();
function memo(el, key, v) {
let m = lastProp.get(el);
if (!m) { m = Object.create(null); lastProp.set(el, m); }
if (m[key] === v) return false;
m[key] = v; return true;
}
function setProp(el, name, v) { if (el && memo(el, name, v)) el.style.setProperty(name, v); }
function setVar(el, name, v) { if (el && memo(el, name, v)) el.style[name] = v; }
function setClass(el, name, on) { if (!el || !memo(el, '.' + name, on)) return false; el.classList.toggle(name, on); return true; }
function adj(m) {
return [
m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
];
}
function multmm(a, b) {
const c = new Array(9);
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
let v = 0;
for (let k = 0; k < 3; k++) v += a[3 * i + k] * b[3 * k + j];
c[3 * i + j] = v;
}
return c;
}
function multmv(m, v) {
return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
function basisToPoints(p1, p2, p3, p4) {
const m = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1];
const v = multmv(adj(m), [p4[0], p4[1], 1]);
return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
function homography(src, dst) {
const H = multmm(basisToPoints(dst[0], dst[1], dst[2], dst[3]), adj(basisToPoints(src[0], src[1], src[2], src[3])));
const w = H[8] || 1;
return H.map(v => v / w);
}
function matrix3d(h) {
return 'matrix3d(' + [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, h[8]].map(v => v.toFixed(6)).join(',') + ')';
}
function rectifyQuad(Q, t) {
if (t <= 0.001) return Q;
const cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4, cy = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4;
const w = (Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]) + Math.hypot(Q[2][0] - Q[3][0], Q[2][1] - Q[3][1])) / 2;
const h = (Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]) + Math.hypot(Q[2][0] - Q[1][0], Q[2][1] - Q[1][1])) / 2;
const R = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
return Q.map((q, i) => [lerp(q[0], R[i][0], t), lerp(q[1], R[i][1], t)]);
}
const PG = { in: 0 };
let pgWaveOn = false;
function renderScreen() {
if (!screen || !quads) return;
const QV = screenQuadView();
const QV_IN = QV && (S.full > 0.02 || quadInsideView(QV));
const vis = S.screenIn > 0.002 && !!QV_IN;
setClass(screen, 'is-on', vis);
if (screenGlow) setClass(screenGlow, 'is-on', vis);
if (!vis) return;
const f = S.full;
const Q = rectifyQuad(QV, 0.85 * smooth(f, 0, 0.4));
const T = [[0, 0], [vw, 0], [vw, vh], [0, vh]];
const C = Q.map((q, i) => [lerp(q[0], T[i][0], f), lerp(q[1], T[i][1], f)]);
const src = [[0, 0], [vw, 0], [vw, vh], [0, vh]];
const tr = (f >= 0.999) ? 'none' : matrix3d(homography(src, C));
setVar(screen, 'transform', tr);
setVar(screen, 'opacity', S.screenIn.toFixed(3));
setProp(screen, '--scr-far', (1 - Math.max(f, smooth(S.walk, 0.62, 1) * 0.55)).toFixed(3));
const flat = f >= 0.999;
setVar(screen, 'clipPath', flat ? 'none' : 'inset(0 round ' + (6 * (1 - f)).toFixed(2) + 'px)');
setClass(screen, 'is-flat', flat);
if (screenGlow) {
setVar(screenGlow, 'transform', tr);
setVar(screenGlow, 'opacity', S.screenIn.toFixed(3));
setProp(screenGlow, '--wake', S.screenIn.toFixed(3));
setProp(screenGlow, '--full', f.toFixed(3));
const a = S.screenIn * 0.3 * (1 - f);
setVar(screenGlow, 'boxShadow', '0 0 ' + Math.round(120 * S.screenIn) + 'px ' + Math.round(20 * S.screenIn) + 'px rgba(242,194,73,' + a.toFixed(3) + ')'
+ ', 0 60px 120px 20px rgba(12,27,58,' + (a * 1.4).toFixed(3) + ')');
}
if (pg) {
if (!pgWaveOn) {
pgWaveOn = true;
if (hasGsap && !reduced && loopOn) gsap.to(PG, { in: 1, duration: 0.7, ease: 'expo.out', onUpdate: kick });
else PG.in = 1;
}
setProp(pg, '--pg-in', PG.in.toFixed(3));
}
if (pgLangLine) setProp(pgLangLine, '--lang-zoom', LANG.zoom.toFixed(4));
setClass(screen, 'is-live', f >= 0.999 || locked);
}
const EMB = { left: 0, top: 0, w: 0, h: 0, sx: 1, sy: 1 };
let headTip = [0, 0], swooshScale = 1;
function emblemBase() {
return [EMB.left + EMB.w, EMB.top + EMB.h, EMB.left, EMB.top + EMB.h];
}
const LOGO_BLOCK_W = 1050;
let logoT = '';
let logoM = null;
let panelM = null;
let lx0 = 0, ly0 = 0, ls = 1;
function placeLogo() {
const blk = logo.mountains_block;
const bw = blk[2] - blk[0], bh = blk[3] - blk[1];
const lMasis = logo.anchors.masis_apex;
const pMasis = anchors.masis_apex;
ls = LOGO_BLOCK_W / bw;
EMB.sx = EMB.sy = ls;
EMB.left = pMasis[0] - (lMasis[0] - blk[0]) * ls;
EMB.top = pMasis[1];
EMB.w = bw * ls; EMB.h = bh * ls;
lx0 = EMB.left - blk[0] * ls; ly0 = EMB.top - blk[1] * ls;
logoT = 'translate(' + lx0 + ',' + ly0 + ') scale(' + ls + ')';
logoM = [ls, 0, 0, ls, lx0, ly0];
logoGroups.forEach(g => g.setAttribute('transform', logoT));
if (mainD && typeof DOMMatrix !== 'undefined') {
const M = new DOMMatrix([ls, 0, 0, ls, lx0, ly0]);
gildExact = new Path2D();
gildExact.addPath(new Path2D(mainD), M);
if (thirdD) gildExact.addPath(new Path2D(thirdD), M);
if (lowerD) gildExact.addPath(new Path2D(lowerD), M);
}
const te = logo.top_edge.map(p => [lx0 + p[0] * ls, ly0 + p[1] * ls]);
emblemPts = resampleByX(te, EMB.left, EMB.left + EMB.w);
const rx0 = ridgePts[0][0], rx1 = ridgePts[ridgePts.length - 1][0];
ridgePts = resampleByX(ridgePts, rx0, rx1);
const st = logo.anchors.swoosh_start, tip = logo.anchors.arrowhead_tip;
const S0 = [lx0 + st[0] * ls, ly0 + st[1] * ls];
headTip = [lx0 + tip[0] * ls, ly0 + tip[1] * ls];
swooshScale = ls;
const C = [S0[0] + (headTip[0] - S0[0]) * 0.72, S0[1] - (S0[1] - headTip[1]) * 0.08];
const dMask = 'M' + S0[0] + ' ' + S0[1] + ' Q' + C[0] + ' ' + C[1] + ' ' + headTip[0] + ' ' + headTip[1];
swooshMaskPaths.forEach(p => { p.setAttribute('d', dMask); p.setAttribute('pathLength', '1000'); p.style.strokeWidth = String(Math.round(150 * ls)); });
swooshLen = swooshMaskPath ? 1000 : 0;
gildGrad = null;
lastMorph = -1;
if (ctx) buildGrades();
}
const LOGO_BOX = [67.78, 169.36, 956.22, 854.64];
let logoPanelCenter = null;
function placeLogoOnPanel() {
const q = quads.panel_quad;
const TL = q[0], TR = q[1], BR = q[2], BL = q[3];
const ex = [TR[0] - TL[0], TR[1] - TL[1]];
const ey = [BL[0] - TL[0], BL[1] - TL[1]];
const lenx = Math.hypot(ex[0], ex[1]), leny = Math.hypot(ey[0], ey[1]);
const ux = [ex[0] / lenx, ex[1] / lenx], uy = [ey[0] / leny, ey[1] / leny];
const fr = quads.panel_free_region;
const areaW = fr ? (fr.x1 - fr.x0) : lenx;
const areaH = fr ? (fr.y1 - fr.y0) : leny;
const lw = LOGO_BOX[2] - LOGO_BOX[0], lh = LOGO_BOX[3] - LOGO_BOX[1];
const k = (quads.baked_logo && fr) ? Math.min(areaW / lw, areaH / lh) : Math.min(LOGO_FIT * areaW / lw, 0.80 * areaH / lh);
const C = fr ? [(fr.x0 + fr.x1) / 2, (fr.y0 + fr.y1) / 2]
: [(TL[0] + TR[0] + BR[0] + BL[0]) / 4, (TL[1] + TR[1] + BR[1] + BL[1]) / 4];
const c0 = [(LOGO_BOX[0] + LOGO_BOX[2]) / 2, (LOGO_BOX[1] + LOGO_BOX[3]) / 2];
const a = k * ux[0], b = k * ux[1], c = k * uy[0], d = k * uy[1];
const e = C[0] - (a * c0[0] + c * c0[1]);
const f = C[1] - (b * c0[0] + d * c0[1]);
panelM = [a, b, c, d, e, f];
logoPanelCenter = C;
}
function quadCenter(q) { return [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4]; }
function monitorZoom() {
const q = quads.screen_quad;
const w = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
return 0.85 * vw / (w * coverScale());
}
function headTransform(h) {
const sc = ls * (0.6 + 0.4 * h);
const tip = logo.anchors.arrowhead_tip;
return 'translate(' + (headTip[0] - tip[0] * sc) + ',' + (headTip[1] - tip[1] * sc) + ') scale(' + sc + ')';
}
function resampleByX(pts, x0, x1) {
const sorted = pts.slice().sort((a, b) => a[0] - b[0]);
const out = [];
for (let i = 0; i < N; i++) {
const x = x0 + (x1 - x0) * i / (N - 1);
let j = 0;
while (j < sorted.length - 2 && sorted[j + 1][0] < x) j++;
const a = sorted[j], b = sorted[j + 1];
const t = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (x - a[0]) / (b[0] - a[0])));
out.push([x, a[1] + (b[1] - a[1]) * t]);
}
return out;
}
const K1 = SLICE_END / 0.56;
const a1 = (t) => +(t * K1).toFixed(4);
function buildTimeline() {
const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
tl.to(S, { zoom: 1.5, cx: 1180, cy: 500, duration: a1(0.16), ease: 'power2.inOut' }, 0);
tl.to(S, { zoom: 1.46, cx: 1215, cy: 505, duration: a1(0.14) }, a1(0.16));
tl.to(S, { dusk: 1, duration: a1(0.05), ease: 'sine.inOut' }, a1(0.16));
tl.to(S, { draw: 1, duration: a1(0.09), ease: 'power2.inOut' }, a1(0.21));
tl.to(S, { glow: 1, duration: a1(0.04) }, a1(0.21));
tl.to(S, { swoosh: 1, duration: a1(0.07), ease: 'power2.inOut' }, a1(0.30));
tl.to(S, { head: 1, duration: a1(0.025), ease: 'back.out(1.6)' }, a1(0.355));
tl.to(S, { zoom: 1.15, cx: 1330, cy: 600, duration: a1(0.08), ease: 'power2.inOut' }, a1(0.30));
tl.to(S, { morph: 1, duration: a1(0.08), ease: 'power3.inOut' }, a1(0.38));
tl.to(S, { fill: 1, duration: a1(0.07), ease: 'power1.in' }, a1(0.39));
tl.to(S, { zoom: 1.0, cx: 1280, cy: 720, duration: a1(0.09), ease: 'power2.inOut' }, a1(0.38));
tl.to(S, { shapes: 1, duration: a1(0.07), ease: 'sine.inOut' }, a1(0.44));
tl.to(S, { glow: 0.3, duration: a1(0.05) }, a1(0.44));
tl.to(S, { letters: 1, duration: a1(0.05), ease: 'power2.out' }, a1(0.47));
tl.to(S, { tagline: 1, duration: a1(0.03) }, a1(0.505));
tl.to(S, { zoom: 1.03, cy: 700, duration: a1(0.05) }, a1(0.51));
const pc = logoPanelCenter || quadCenter(quads.panel_quad);
const fc = (quads.walk_video && quads.walk_video.first_frame_camera) || null;
const GL = GLASS_END - SLICE_END;
tl.to(S, { glass: 1, duration: GL, ease: 'none' }, SLICE_END);
tl.to(S, { zoom: fc ? fc.zoom : 1.6, cx: fc ? fc.cx : pc[0], cy: fc ? fc.cy : pc[1], duration: GL, ease: 'sine.inOut' }, SLICE_END);
tl.to(S, { logoSit: 1, duration: GL * 0.8, ease: 'power2.inOut' }, SLICE_END + GL * 0.08);
tl.to(S, { glow: 0, duration: GL * 0.3 }, SLICE_END);
if (quads.baked_logo) tl.to(S, { logoFade: 1, duration: GL * 0.22, ease: 'sine.inOut' }, SLICE_END + GL * 0.5);
const WK = WALK_END - GLASS_END;
tl.to(S, { walk: 1, duration: WK, ease: 'none' }, GLASS_END);
tl.to(S, { zoom: 1.0, cx: 1280, cy: 720, duration: WK * 0.36, ease: 'power2.inOut' }, GLASS_END);
tl.to(S, { markOut: 1, duration: WK * 0.2, ease: 'sine.inOut' }, GLASS_END + WK * 0.34);
tl.to(S, { zoom: DOLLY_FROM.zoom, cx: DOLLY_FROM.cx, cy: DOLLY_FROM.cy, duration: WK * 0.08, ease: 'sine.inOut' }, GLASS_END + WK * 0.42);
tl.to(S, { dolly: 1, duration: WK * 0.44, ease: 'power2.inOut' }, GLASS_END + WK * 0.56);
const TS = trackStart();
const scrFrom = (TS < 1) ? (GLASS_END + WK * TS) : (WALK_END - 0.05);
tl.to(S, { screenIn: 1, duration: Math.min(0.05, Math.max(0.02, (WALK_END - scrFrom) * 0.28)), ease: 'power1.out' }, scrFrom);
tl.to(S, { full: 1, duration: HERO_END - WALK_END, ease: 'power2.inOut' }, WALK_END);
tl.to(S, { navy: 1, duration: (HERO_END - WALK_END) * 0.5, ease: 'sine.in' }, WALK_END + 0.005);
tl.to(S, { p: HERO_END, duration: HERO_END }, 0);
return tl;
}
function injectLogo(svgText) {
const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
const pick = (id) => doc.getElementById(id);
const grad = pick('gold');
if (grad) {
const g = grad.cloneNode(true); g.setAttribute('id', 'hsGoldLogo');
svgSolid.querySelector('defs').appendChild(g);
}
const brand = grad ? 'url(#hsGoldLogo)' : 'url(#hsGold)';
const cloneInto = (id, target, fill) => {
const src = pick(id);
if (!src || !target) return null;
const c = src.cloneNode(true);
c.removeAttribute('id');
const f = fill || brand;
c.querySelectorAll('[fill]').forEach(el => el.setAttribute('fill', f));
c.setAttribute('fill', f);
target.appendChild(c);
return c;
};
const main = pick('mountain-main'), third = pick('mountain-third');
const snowD = ['snow-sis', 'snow-masis'].map(id => (pick(id) || {}).getAttribute ? pick(id).getAttribute('d') : '').filter(Boolean).join(' ');
const mkPath = (d, rule, fill) => {
const p = document.createElementNS(NS, 'path');
p.setAttribute('d', d); p.setAttribute('fill', fill || brand);
if (rule) p.setAttribute('fill-rule', rule);
return p;
};
if (main) {
mainD = main.getAttribute('d') + ' ' + snowD;
shapesGroup.appendChild(mkPath(mainD, 'evenodd'));
}
if (third) {
thirdD = third.getAttribute('d');
shapesGroup.appendChild(mkPath(thirdD));
}
const lower = pick('swoosh-lower');
if (lower) {
lowerD = lower.getAttribute('d');
shapesGroup.appendChild(mkPath(lowerD));
}
cloneInto('swoosh-upper', swooshGroup);
cloneInto('swoosh-upper', swooshLight, '#FAE0A2');
cloneInto('arrowhead', headGroup);
const lettersClone = cloneInto('letters', lettersGroup);
letterPaths = lettersClone ? Array.from(lettersClone.querySelectorAll('path')) : [];
cloneInto('tagline', taglineGroup);
const shadowIn = document.createElementNS(NS, 'g'); shadowIn.setAttribute('transform', 'translate(1.5,4.2)');
lettersShadow.appendChild(shadowIn);
cloneInto('letters', shadowIn, 'currentColor'); cloneInto('tagline', shadowIn, 'currentColor');
shadowIn.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
[[etchLight, 'translate(-1.1,-1.1)'], [etchDark, 'translate(1.5,1.8)']].forEach(([grp, tr]) => {
const inner = document.createElementNS(NS, 'g'); inner.setAttribute('transform', tr);
grp.appendChild(inner);
if (mainD) inner.appendChild(mkPath(mainD, 'evenodd', 'inherit'));
if (thirdD) inner.appendChild(mkPath(thirdD, null, 'inherit'));
if (lowerD) inner.appendChild(mkPath(lowerD, null, 'inherit'));
['swoosh-upper', 'arrowhead', 'letters', 'tagline'].forEach(id => cloneInto(id, inner, 'inherit'));
inner.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
});
const symLetters = document.getElementById('hsLogoLetters');
const symMark = document.getElementById('hsLogoMark');
if (symLetters && !symLetters.childNodes.length) cloneInto('letters', symLetters, 'currentColor');
if (symMark && !symMark.childNodes.length) {
if (mainD) symMark.appendChild(mkPath(mainD, 'evenodd', 'currentColor'));
if (thirdD) symMark.appendChild(mkPath(thirdD, null, 'currentColor'));
if (lowerD) symMark.appendChild(mkPath(lowerD, null, 'currentColor'));
cloneInto('swoosh-upper', symMark, 'currentColor');
cloneInto('arrowhead', symMark, 'currentColor');
cloneInto('letters', symMark, 'currentColor');
}
}
let trigger = null, timeline = null;
let pRaw = 0, pSmooth = 0, loopId = null, loopOn = false, lastT = 0;
function kick() {
if (loopId !== null || !loopOn) return;
loopId = requestAnimationFrame(tick);
}
function tick(now) {
loopId = null;
const t = now || performance.now();
const dt = lastT ? Math.min(64, t - lastT) : LERP_HZ;
lastT = t;
const d = pRaw - pSmooth;
if (P_LERP >= 1 || Math.abs(d) < 1e-4) pSmooth = pRaw;
else pSmooth += d * (1 - Math.pow(1 - P_LERP, dt / LERP_HZ));
if (timeline) timeline.progress(pSmooth);
const busy = walkSync(dt);
render();
gateAhead();
const fading = assetFading();
if (Math.abs(pRaw - pSmooth) > 1e-4 || busy || fading) kick();
}
function gateY() { return trigger ? trigger.start + (trigger.end - trigger.start) * GATE_P : Infinity; }
let wheelGuardOn = false;
function onWheelGuard(e) {
if (!armed || reduced || chosen || locked) return;
if (e.deltaY <= 0) return;
const dy = e.deltaMode === 1 ? e.deltaY * 16 : (e.deltaMode === 2 ? e.deltaY * vh : e.deltaY);
if (window.scrollY + dy >= gateY() - 1) { e.preventDefault(); gate(1); }
}
function gateAhead() {
if (!armed || reduced || chosen || locked || !trigger) return;
if (!wheelGuardOn && pRaw >= 0.86) {
wheelGuardOn = true;
window.addEventListener('wheel', onWheelGuard, { passive: false });
}
const L = window.__lenis;
if (!L || typeof L.targetScroll !== 'number') return;
const span = trigger.end - trigger.start;
if (span <= 0) return;
const tp = (L.targetScroll - trigger.start) / span;
if (tp >= 0.999 && pRaw >= 0.90) gate(1);
}
function nextScreen() { return document.querySelector('.after') || document.getElementById('after'); }
function scrollToScreen() {
const el = nextScreen();
if (!el) { scrollToY(Math.round(window.scrollY + vh * 0.9), 1.1); return; }
const y = Math.round(window.scrollY + el.getBoundingClientRect().top);
scrollToY(Math.max(0, y), 1.1);
}
function scrollToY(y, dur) {
if (window.__lenis) window.__lenis.scrollTo(y, { duration: dur });
else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}
const REARM_P = 0.80;
let locked = false, chosen = !!(location.hash && !/^#(hero|triGate)?$/i.test(location.hash)), armed = !chosen;
const GATE = { p: 0 };
const LANG = { zoom: 1 };
let touchY = 0;
const onTouchStart = (e) => { touchY = (e.touches && e.touches[0]) ? e.touches[0].clientY : 0; };
const onWheelLocked = (e) => {
if (e.deltaY < 0) { unlockBack(); return; }
e.preventDefault();
};
const onTouchLocked = (e) => {
const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : touchY;
if (y - touchY > 8) { unlockBack(); return; }
e.preventDefault();
};
const BACK_KEYS = { ArrowUp: 1, PageUp: 1, Home: 1 };
const NAV_KEYS = { ' ': 1, PageDown: 1, ArrowDown: 1, End: 1, Spacebar: 1 };
function onKey(e) {
if (!locked) return;
if (e.key === 'Escape') { unlock(true); return; }
if (BACK_KEYS[e.key]) { e.preventDefault(); unlockBack(); return; }
if (NAV_KEYS[e.key]) e.preventDefault();
}
function lock() {
if (locked || chosen || reduced) return;
locked = true;
if (window.__lenis) window.__lenis.stop();
html.classList.add('is-gate-locked');
if (wheelGuardOn) { window.removeEventListener('wheel', onWheelGuard, { passive: false }); wheelGuardOn = false; }
window.addEventListener('wheel', onWheelLocked, { passive: false });
window.addEventListener('touchstart', onTouchStart, { passive: true });
window.addEventListener('touchmove', onTouchLocked, { passive: false });
window.addEventListener('keydown', onKey);
root.classList.add('is-gate');
if (pgHint) { pgHint.hidden = false; requestAnimationFrame(() => pgHint.classList.add('is-in')); }
GATE.p = pRaw;
if (hasGsap) gsap.to(GATE, { p: 1, duration: 0.5, ease: 'power2.out', onUpdate: () => { pRaw = GATE.p; kick(); } });
else { pRaw = 1; kick(); }
if (hasGsap && pgLangLine) {
gsap.to(LANG, { zoom: 1.3, duration: 0.6, ease: 'back.out(1.8)', onUpdate: kick });
gsap.fromTo(pgLangItems, { yPercent: 22, opacity: 0.4 },
{ yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'expo.out', clearProps: 'opacity,transform' });
} else { LANG.zoom = 1.3; }
if (pg) pg.classList.add('is-choosing');
const active = langChoices.find(el => el.classList.contains('is-active')) || langChoices[0];
if (active) { try { active.focus({ preventScroll: true }); } catch (err) { active.focus(); } }
}
function releaseLock() {
if (!locked) return;
locked = false;
window.removeEventListener('wheel', onWheelLocked, { passive: false });
window.removeEventListener('touchstart', onTouchStart, { passive: true });
window.removeEventListener('touchmove', onTouchLocked, { passive: false });
window.removeEventListener('keydown', onKey);
html.classList.remove('is-gate-locked');
if (window.__lenis) window.__lenis.start();
root.classList.remove('is-gate');
if (pgHint) { pgHint.classList.remove('is-in'); pgHint.hidden = true; }
if (pg) pg.classList.remove('is-choosing');
if (hasGsap) gsap.to(LANG, { zoom: 1, duration: 0.45, ease: 'power2.out', onUpdate: kick });
else LANG.zoom = 1;
kick();
}
function unlock(fromUser) { if (!locked) return; chosen = !!fromUser; releaseLock(); }
window.__heroUnlock = function () { chosen = true; releaseLock(); };
function unlockBack() {
if (!locked) return;
releaseLock();
scrollToY(Math.max(0, Math.round(window.scrollY - vh * 0.55)), 0.9);
}
function gate(pr) {
if (reduced) return;
if (pr < REARM_P) armed = true;
if (chosen || locked || !armed) return;
if (pr >= GATE_P - 1e-4) { armed = false; lock(); }
}
const PAGE_LANG = (html.getAttribute('data-skin') || html.getAttribute('lang') || 'ru').slice(0, 2);
langChoices.forEach(el => {
el.addEventListener('click', (e) => {
const lg = (el.getAttribute('data-lang') || '').slice(0, 2);
if (lg !== PAGE_LANG) return;
e.preventDefault();
if (locked) unlock(true); else chosen = true;
scrollToScreen();
});
});
if (skip) {
skip.addEventListener('click', (e) => {
const t = document.querySelector(skip.getAttribute('href'));
if (!t || !window.__lenis) return;
e.preventDefault();
window.__lenis.scrollTo(t, { duration: 1.6 });
});
}
if (screen) {
screen.addEventListener('focusin', () => {
if (locked || !trigger || trigger.progress > GATE_P - 0.01) return;
scrollToY(Math.round(trigger.start + (trigger.end - trigger.start) * GATE_P), 1.2);
});
}
function revealAfter() {
if (document.documentElement.hasAttribute('data-site')) return;
const items = Array.from(document.querySelectorAll('.after [data-reveal]'));
if (!items.length || reduced || !hasGsap) return;
gsap.fromTo(items, { opacity: 0, y: 40, scale: 0.96 }, {
opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'expo.out', clearProps: 'all',
scrollTrigger: { trigger: '.after', start: 'top 80%', once: true },
});
}
const idle = window.requestIdleCallback ? (cb) => window.requestIdleCallback(cb, { timeout: 1500 }) : (cb) => setTimeout(cb, 300);
if (isMobile) {
root.classList.add('is-mobile', 'is-static', 'is-ready');
if (head) head.classList.add('is-past');
fetch(ASSETS + 'logo.svg').then(r => r.text()).then(injectLogo).catch(err => console.error('[hero-scroll]', err));
revealAfter();
return;
}
Promise.all([
posterReady().catch(() => loadBitmap(ASSETS + 'lcp/A-1280.webp')),
fetch(ASSETS + 'ridge.json').then(r => r.json()),
fetch(ASSETS + 'logo.json').then(r => r.json()),
fetch(ASSETS + 'logo.svg').then(r => r.text()),
loadQuads(),
]).then(([A, ridge, lg, svgText, E]) => {
plates.A = A; quads = E.quads;
ridgePts = ridge.points; anchors = ridge.anchors; logo = lg;
injectLogo(svgText);
placeLogo();
placeLogoOnPanel();
resize();
root.classList.add('is-ready');
if (reduced || !hasGsap) {
Object.assign(S, { p: HERO_END, zoom: 1.0, cx: 1280, cy: 720, dusk: 1, draw: 1, glow: 0,
swoosh: 1, head: 1, morph: 1, fill: 1, shapes: 1, snow: 1, letters: 1, tagline: 1,
glass: 1, logoSit: 1, dolly: 1, screenIn: 1, full: 1, navy: 1, markOut: 1, choose: 0, logoFade: (quads.baked_logo ? 1 : 0), walk: 1 });
root.classList.add('is-static');
if (head) head.classList.add('is-past');
render();
return;
}
let deferredStarted = false;
let chainResolve = null;
const chain = new Promise(res => { chainResolve = res; });
const startDeferredAssets = () => {
if (deferredStarted) return;
deferredStarted = true;
['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => window.removeEventListener(ev, startDeferredAssets));
idle(walkLoad);
idle(() => {
const wA = lodW(MAX_ZOOM);
const haveW = A.width || A.naturalWidth || 0;
const needA = haveW < wA ? loadPlate('A', wA).then(b => { plates.A = b; render(); }).catch(() => {}) : Promise.resolve();
needA
.then(() => loadPlate('A-dusk', wA).catch(() => null))
.then(D => { plates.D = D; render(); return loadPlate(E.base, lodW(1.6)).catch(() => null); })
.then(bmp => { plates.E = bmp; if (bmp) { eAt = arrived(); kick(); } render(); })
.then(() => new Promise(res => idle(res)))
.then(() => {
const srcA = plates.D || plates.A;
return Promise.all([
loadBlur('A-dusk', 40, srcA).then(b => { blur.A40 = b; }),
loadBlur(E.base, 40, plates.E).then(b => { blur.E40 = b; }),
]).then(render);
})
.then(() => { if (chainResolve) chainResolve(); })
.catch(err => { console.error('[hero-scroll] plates', err); if (chainResolve) chainResolve(); });
});
};
if (/[?&]p=([\d.]+)/.test(location.search) || window.scrollY > 4) {
startDeferredAssets();
} else {
['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, startDeferredAssets, { passive: true, once: true }));
}
gsap.registerPlugin(ScrollTrigger);
const tl = buildTimeline();
if (debug) window.__hero = {
S, cam, render, video: walkVideo, get p() { return pSmooth; }, get locked() { return locked; },
get counts() { return { renders: renderCount, videoFrames: frameCount }; },
get gateState() { return { locked, chosen, armed, pRaw: +pRaw.toFixed(4), langChoices: langChoices.length }; },
get frameSync() {
const fps = trackFps(), n = (quads.walk_track && quads.walk_track.quads.length) || 1;
const shown = shownFrame();
const want = Math.min(n - 1, Math.max(0, Math.round(Math.min(Math.max(S.walk, 0), 1) * (n - 1))));
return { shown, want, lag: shown - want, frameT: +walkFrameT.toFixed(4), curT: +walkVideo.currentTime.toFixed(4),
targetT: +walkTarget().toFixed(4), seeking: walkSeeking, seekFrame: walkSeekFrame, seekMs: +walkSeekMs.toFixed(2), seeks: walkSeeks, paused: walkVideo.paused, fps, walk: +S.walk.toFixed(4) };
},
get quadView() { return screenQuadView(); },
gate, unlockBack, unlock,
seek: (v) => new Promise(res => {
pRaw = pSmooth = Math.min(1, Math.max(0, v));
tl.progress(pSmooth); walkGrab(); walkSync();
if (!walkSeeking) { render(); return res(); }
const on = () => { walkVideo.removeEventListener('seeked', on); walkGrab(); render(); res(); };
walkVideo.addEventListener('seeked', on);
}),
};
const still = /[?&]p=([\d.]+)/.exec(location.search);
if (still) {
root.classList.add('is-static');
timeline = tl;
pRaw = pSmooth = Math.min(1, parseFloat(still[1]) / HERO_END);
tl.progress(pSmooth);
window.addEventListener('resize', resize, { passive: true });
const still1 = () => { walkGrab(); walkSync(); render(); };
walkVideo.addEventListener('seeked', still1);
walkVideo.addEventListener('loadedmetadata', still1);
chain.then(still1);
still1();
return;
}
timeline = tl;
loopOn = true;
const hasDeepTarget = !!(location.hash && !/^#(hero|triGate)?$/i.test(location.hash)) || /[?&]at=[\w-]+/.test(location.search);
if (hasDeepTarget) {
chosen = true;
armed = false;
releaseLock();
pRaw = pSmooth = 1;
tl.progress(1);
if (head) head.classList.add('is-past');
render();
if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
window.__lenis.scrollTo(0, { immediate: true, force: true });
}
window.scrollTo(0, 0);
}
trigger = ScrollTrigger.create({
trigger: root,
start: 'top top',
end: '+=' + PIN_PCT + '%',
pin: stage,
pinSpacing: true,
invalidateOnRefresh: true,
onUpdate: (st) => { if (!locked) pRaw = st.progress; gate(st.progress); kick(); },
onLeave: () => { gate(1); if (!locked) { pRaw = 1; kick(); } if (head) head.classList.add('is-past'); },
onEnterBack: () => { if (head) head.classList.remove('is-past'); },
});
window.addEventListener('resize', resize, { passive: true });
ScrollTrigger.addEventListener('refresh', () => {
if (vw !== window.innerWidth || vh !== window.innerHeight) resize();
});
if (window.__lenis && typeof window.__lenis.resize === 'function') window.__lenis.resize();
const jumpToDeepTarget = () => {
const atMatch = /[?&]at=([\w-]+)/.exec(location.search);
const rawId = atMatch ? atMatch[1] : ((location.hash && !/^#(hero|triGate)?$/i.test(location.hash)) ? location.hash.slice(1).split('?')[0] : '');
const target = rawId ? document.getElementById(rawId) : null;
if (!target) return;
if (typeof window.__heroUnlock === 'function') window.__heroUnlock();
document.body.classList.add('is-landed');
document.documentElement.classList.add('hdr-on');
if (head) head.classList.add('is-past');
const hdrEl = document.getElementById('hdr');
if (hdrEl) hdrEl.classList.add('is-shown');
pRaw = pSmooth = 1;
tl.progress(1);
ScrollTrigger.refresh();
if (window.__lenis && typeof window.__lenis.resize === 'function') window.__lenis.resize();
const offset = (hdrEl ? hdrEl.offsetHeight : 72) + 8;
const y = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - offset));
if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
window.__lenis.scrollTo(y, { immediate: true, force: true });
}
window.scrollTo(0, y);
ScrollTrigger.update();
window.dispatchEvent(new Event('scroll'));
};
if (hasDeepTarget) {
jumpToDeepTarget();
setTimeout(jumpToDeepTarget, 60);
setTimeout(jumpToDeepTarget, 240);
}
revealAfter();
}).catch(err => {
console.error('[hero-scroll]', err);
root.classList.add('is-failed');
revealAfter();
});
})();
