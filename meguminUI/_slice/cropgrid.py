# -*- coding: utf-8 -*-
"""Crop a region of a sheet and overlay a 50px coordinate grid labelled in ABSOLUTE
sheet coordinates, so slice boxes can be read off with ~2px accuracy."""
import sys, os
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for p in ("C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def run(path, out, x0, y0, w, h, scale=1.0, minor=50, major=100):
    im = Image.open(path).convert("RGB").crop((x0, y0, x0 + w, y0 + h))
    if scale != 1.0:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    W, H = im.size
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    f = font(12)
    for ax in range((x0 // minor) * minor, x0 + w + minor, minor):
        px = (ax - x0) * scale
        if px < -1 or px > W: continue
        ismajor = ax % major == 0
        d.line([(px, 0), (px, H)], fill=(0, 130, 255, 110 if ismajor else 55), width=1)
        if ismajor:
            for ay in range(y0, y0 + h, 200):
                py = (ay - y0) * scale
                d.text((px + 2, py + 1), str(ax), font=f, fill=(0, 70, 220, 255),
                       stroke_width=2, stroke_fill=(255, 255, 255, 240))
    for ay in range((y0 // minor) * minor, y0 + h + minor, minor):
        py = (ay - y0) * scale
        if py < -1 or py > H: continue
        ismajor = ay % major == 0
        d.line([(0, py), (W, py)], fill=(0, 130, 255, 110 if ismajor else 55), width=1)
        if ismajor:
            for ax in range(x0, x0 + w, 200):
                px = (ax - x0) * scale
                d.text((px + 2, py + 1), str(ay), font=f, fill=(200, 30, 90, 255),
                       stroke_width=2, stroke_fill=(255, 255, 255, 240))
    Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB").save(out, quality=95)
    print("saved", out, (W, H))

if __name__ == "__main__":
    a = sys.argv
    run(a[1], a[2], int(a[3]), int(a[4]), int(a[5]), int(a[6]),
        float(a[7]) if len(a) > 7 else 1.0)
