# -*- coding: utf-8 -*-
"""
Предразмытые плиты для «матового стекла» (p 0.56–0.62): кроссфейд готовых уровней,
без runtime-blur на весь экран.
  A-dusk (2560×1440) → 1280×720, blur 14 / 28 / 40 px  → blur/A-dusk-b14.jpg …
  E, E-temp          → 1280×720, blur 40 / 20 px        → blur/E-b40.jpg, blur/E-temp-b40.jpg …
Радиусы — в пикселях 1280-basis. Запуск: python phase1/assets/hero/blur/make_blur.py
"""
import os
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.dirname(HERE)
JOBS = {
    'A-dusk': (14, 28, 40),
    'E': (40, 20),
}
for base, radii in JOBS.items():
    src = os.path.join(HERO, base + '.jpg')
    if not os.path.exists(src):
        print('skip', base, '(нет файла)')
        continue
    im = Image.open(src).convert('RGB').resize((1280, 720), Image.LANCZOS)
    for r in radii:
        # чтобы края не темнели, размываем с зеркальным запасом
        pad = r * 3
        big = Image.new('RGB', (1280 + 2 * pad, 720 + 2 * pad))
        big.paste(im, (pad, pad))
        big.paste(im.transpose(Image.FLIP_LEFT_RIGHT).crop((1280 - pad, 0, 1280, 720)), (0, pad))
        big.paste(im.transpose(Image.FLIP_LEFT_RIGHT).crop((0, 0, pad, 720)), (1280 + pad, pad))
        top = big.crop((0, pad, 1280 + 2 * pad, 2 * pad)).transpose(Image.FLIP_TOP_BOTTOM)
        bot = big.crop((0, 720, 1280 + 2 * pad, 720 + pad)).transpose(Image.FLIP_TOP_BOTTOM)
        big.paste(top, (0, 0)); big.paste(bot, (0, 720 + pad))
        out = big.filter(ImageFilter.GaussianBlur(r)).crop((pad, pad, pad + 1280, pad + 720))
        name = os.path.join(HERE, '%s-b%d.jpg' % (base, r))
        out.save(name, quality=82)
        print('ok', name)
