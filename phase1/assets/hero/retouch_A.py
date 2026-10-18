# -*- coding: utf-8 -*-
"""
Ретушь плиты A: псевдонадпись на крыше здания в нижней трети (артефакт генерации),
плита x 1186..1242, y 1348..1372 (basis 2560x1440). Клонирование соседней фактуры
с перьевой маской, без модели. Исходник сохраняется рядом как A-orig.jpg (один раз).
После ретуши: lcp/make_lcp.py, grade_dusk.py, blur/make_blur.py.
Запуск: python phase1/assets/hero/retouch_A.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'A.jpg')
ORIG = os.path.join(HERE, 'A-orig.jpg')
if not os.path.exists(ORIG):
    Image.open(SRC).save(ORIG, quality=97, subsampling=0)
im = Image.open(ORIG).convert('RGB')
assert im.size == (2560, 1440)

def clone(im, box, src_dx, feather=4, flip=False):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    patch = im.crop((x0 + src_dx, y0, x1 + src_dx, y1))
    if flip:
        patch = patch.transpose(Image.FLIP_LEFT_RIGHT)
    mask = Image.new('L', (w, h), 0)
    inner = Image.new('L', (w - 2 * feather, h - 2 * feather), 255)
    mask.paste(inner, (feather, feather))
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    im.paste(patch, (x0, y0), mask)

# псевдонадпись: клон стены справа (x+58), зеркально — швы прячутся в фактуре блоков
clone(im, (1184, 1346, 1244, 1374), 58, feather=5, flip=True)
im.save(SRC, quality=95, subsampling=0, optimize=True)
print('A.jpg retouched', im.size)
