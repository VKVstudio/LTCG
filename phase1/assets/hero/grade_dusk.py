"""grade_dusk.py -- deterministic dusk grade for hero plate A (numpy + PIL only).

Reads the plate (source photo crop if present, else A.jpg next to this file) and ridge.json
(sky/mountain boundary per column + haze_y), and writes:
  A-dusk.jpg / A-dusk.webp / A-dusk-1280.jpg     moderate strength (s=1.0)
  A-dusk2.jpg / A-dusk2.webp / A-dusk2-1280.jpg  strong strength   (s=1.5)

The grade is a pure function of (pixel colour, y, ridge line, haze line):
  sky      : peach -> amber in the horizon band, peach/rose in the mid sky (keeps 93% luminance),
             upper sky blended toward indigo by height (soft), top dimmed; cloud structure preserved
             (indigo target scales with L)
  mountain : lit snow / lit slopes keep warm light, darkened 9% (moderate) / 11.7% (strong),
             luminance-neutral rose shift; shadow rock darkened 22%/33% and cooled (blue-grey)
  haze band: mountain grade ramps into the city grade over haze_y+5 .. haze_y+125, so the haze stays light
  city     : luminance -40% (moderate) / -50% (strong), shadows cooled toward blue-grey, 12% desaturation.
             No lights are added.
Usage: python grade_dusk.py            (writes both strengths)
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"C:\LTCG\Ararat_1.jpeg"
CROP = (85, 48, 85 + 2560, 48 + 1440)


def load_plate():
    # A.jpg — ретушированная плита (retouch_A.py); исходник Ararat_1.jpeg берётся только если A.jpg нет
    if os.path.exists(os.path.join(HERE, "A.jpg")):
        return Image.open(os.path.join(HERE, "A.jpg")).convert("RGB")
    if os.path.exists(SRC):
        im = Image.open(SRC).convert("RGB")
        if im.size == (2730, 1536):
            return im.crop(CROP)
    return Image.open(os.path.join(HERE, "A.jpg")).convert("RGB")


def ss(x, a, b):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def lum(c):
    return 0.299 * c[..., :1] + 0.587 * c[..., 1:2] + 0.114 * c[..., 2:3]


def grade(rgb, ridge_y, haze_y, s):
    """rgb: float32 HxWx3 in 0..1. ridge_y: per-column boundary y (W,). haze_y: scalar. s: strength."""
    H, W, _ = rgb.shape
    y = np.arange(H, dtype=np.float32)[:, None]
    L = lum(rgb)
    sky_w = ss(ridge_y[None, :] - y, -4.0, 4.0)[..., None]      # 1 above the ridge, 8 px feather
    city_w = ss(y, haze_y + 5.0, haze_y + 125.0)[..., None]     # 0 above the haze line, 1 in the city
    # ---- sky
    h = np.clip((640.0 - y) / 640.0, 0.0, 1.0)[..., None]      # 0 at the horizon band, 1 at the top edge
    up = ss(h, 0.15, 0.80)                                      # 0 in the horizon band, 1 in the upper sky
    tint = (np.array([1.00, 0.90, 0.68], np.float32) * (1.0 - up)
            + np.array([1.00, 0.95, 0.88], np.float32) * up)     # amber at the horizon -> peach/rose higher up
    amber = rgb * tint
    amber = amber * (0.93 * L / np.maximum(lum(amber), 1e-4))   # keep 93% of the original luminance
    indigo_w = min(0.5 * s, 0.8) * ss(h, 0.25, 0.95)
    ind_dark = np.array([0.09, 0.09, 0.24], np.float32)
    ind_light = np.array([0.58, 0.56, 0.78], np.float32)
    indigo = ind_dark + (ind_light - ind_dark) * L
    sky = amber * (1.0 - indigo_w) + indigo * indigo_w
    sky = sky * (1.0 - 0.18 * s * ss(h, 0.30, 1.0))
    # ---- mountain
    lit = ss(L, 0.45, 0.66)
    c_lit = rgb * np.array([1.00, 0.955, 0.94], np.float32)     # alpenglow: slight rose shift ...
    c_lit = c_lit * (L / np.maximum(lum(c_lit), 1e-4))           # ... at unchanged luminance
    c_lit = c_lit * (1.0 - 0.09 * min(s, 1.3))                   # lit snow/slopes: -9% (moderate) / -11.7% (strong)
    c_shd = rgb * np.array([0.90, 0.94, 1.06], np.float32) * (1.0 - 0.22 * s)
    mnt = c_shd * (1.0 - lit) + c_lit * lit
    # ---- city
    k = (s * (1.0 - L))[..., 0]
    city = rgb * (1.0 - 0.40 * min(s, 1.25))
    city = city * np.stack([1.0 - 0.12 * k, 1.0 - 0.03 * k, 1.0 + 0.16 * k], axis=-1)
    city = city * (1.0 - 0.12 * s) + lum(city) * (0.12 * s)
    ground = mnt * (1.0 - city_w) + city * city_w
    out = sky * sky_w + ground * (1.0 - sky_w)
    return np.clip(out, 0.0, 1.0)


def ridge_from_json(path, W):
    j = json.load(open(path))
    d = j.get("dense")
    if d:
        x0, ys = int(d["x0"]), np.array(d["y"], np.float32)
        full = np.empty(W, np.float32)
        full[:] = np.nan
        full[x0:x0 + len(ys)] = ys
    else:
        pts = np.array(j["points"], np.float32)
        full = np.interp(np.arange(W), pts[:, 0], pts[:, 1]).astype(np.float32)
        full[: int(pts[0, 0])] = np.nan
        full[int(pts[-1, 0]) + 1:] = np.nan
    idx = np.where(~np.isnan(full))[0]
    full[: idx[0]] = full[idx[0]]
    full[idx[-1] + 1:] = full[idx[-1]]
    return full, float(j["anchors"]["haze_y"])


def save_set(arr, base):
    im = Image.fromarray(np.rint(arr * 255.0).astype(np.uint8), "RGB")
    im.save(os.path.join(HERE, base + ".jpg"), "JPEG", quality=90, progressive=True, optimize=True, subsampling=1)
    im.save(os.path.join(HERE, base + ".webp"), "WEBP", quality=86, method=6)
    # LOD-лестница под движок (k_кропа <= scale): 1280 / 1920 / 2560 в AVIF и WebP
    im.save(os.path.join(HERE, base + ".avif"), "AVIF", quality=58, speed=4)
    for w in (1280, 1920):
        lod = im.resize((w, w * 9 // 16), Image.LANCZOS)
        lod.save(os.path.join(HERE, base + "-%d.avif" % w), "AVIF", quality=58, speed=4)
        lod.save(os.path.join(HERE, base + "-%d.webp" % w), "WEBP", quality=84, method=6)
    im.resize((1280, 720), Image.LANCZOS).save(os.path.join(HERE, base + "-1280.jpg"), "JPEG",
                                               quality=88, progressive=True, optimize=True, subsampling=1)


if __name__ == "__main__":
    plate = load_plate()
    rgb = np.asarray(plate).astype(np.float32) / 255.0
    ridge_y, haze_y = ridge_from_json(os.path.join(HERE, "ridge.json"), rgb.shape[1])
    for base, s in (("A-dusk", 1.0), ("A-dusk2", 1.5)):
        save_set(grade(rgb, ridge_y, haze_y, s), base)
        print("wrote", base, "strength", s)
