# -*- coding: utf-8 -*-
"""
LCP-лестница для плиты A (первый кадр хиро) + зерно + LQIP.
  A.jpg 2560×1440 → lcp/A-{1280,1920,2560}.{avif,webp}   (sizes=100vw, DPR до 2)
  A.jpg → кроп 4:5 → lcp/A-m-{540,864}.{avif,webp}         (мобильный постер, не квадрат, не апскейл)
  grain.png — тайл 256×256, нейтрально-серое зерно под mix-blend-mode: overlay
  lqip.txt — data-URI 32 px (инлайн в CSS как фон сцены до прихода <img>)
Запуск: python phase1/assets/hero/lcp/make_lcp.py
"""
import os, io, base64
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.dirname(HERE)
src = Image.open(os.path.join(HERO, 'A.jpg')).convert('RGB')
assert src.size == (2560, 1440), src.size

def save(im, name, q_avif=58, q_webp=80):
    p = os.path.join(HERE, name)
    if name.endswith('.avif'):
        im.save(p, quality=q_avif, speed=4)
    elif name.endswith('.webp'):
        im.save(p, quality=q_webp, method=6)
    else:
        im.save(p, quality=82, optimize=True, progressive=True)
    print('%-18s %5d KB' % (name, os.path.getsize(p) // 1024))

# десктопная лестница
for w in (1280, 1920, 2560):
    im = src if w == 2560 else src.resize((w, w * 9 // 16), Image.LANCZOS)
    save(im, 'A-%d.avif' % w)
    save(im, 'A-%d.webp' % w)
save(src.resize((1280, 720), Image.LANCZOS), 'A-1280.jpg')

# мобильный постер 4:5 — кроп вокруг Арарата (масис x≈1530), верх сохраняем
mw, mh = 1152, 1440           # 4:5 из полной высоты
x0 = 1530 - mw // 2 - 120     # чуть левее Масиса, чтобы Сис остался в кадре
x0 = max(0, min(2560 - mw, x0))
mob = src.crop((x0, 0, x0 + mw, mh))
for w in (540, 864):
    im = mob.resize((w, w * 5 // 4), Image.LANCZOS)
    save(im, 'A-m-%d.avif' % w)
    save(im, 'A-m-%d.webp' % w)
save(mob.resize((864, 1080), Image.LANCZOS), 'A-m-864.jpg')

# зерно: нейтральный серый 128 ± шум, два масштаба смешаны; 16 уровней → лёгкий PNG
rng = np.random.default_rng(7)
fine = rng.normal(0, 1, (256, 256))
coarse = np.kron(rng.normal(0, 1, (64, 64)), np.ones((4, 4)))
n = 0.75 * fine + 0.25 * coarse
n = (n / n.std()) * 22 + 128
n = np.clip(np.round(n / 8) * 8, 0, 255).astype(np.uint8)   # квантование → PNG сжимается
g = Image.fromarray(n, 'L')
g.save(os.path.join(HERE, 'grain.png'), optimize=True)
print('grain.png %d KB' % (os.path.getsize(os.path.join(HERE, 'grain.png')) // 1024))

# LQIP 32×18, размытый, JPEG q40 → data URI
lq = src.resize((32, 18), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
buf = io.BytesIO(); lq.save(buf, 'JPEG', quality=40, optimize=True)
uri = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
open(os.path.join(HERE, 'lqip.txt'), 'w').write(uri)
print('lqip', len(uri), 'chars')
