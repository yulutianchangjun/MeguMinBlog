# -*- coding: utf-8 -*-
"""Precision slicer for the Megumin UI art boards.

For each configured box:
  * crop
  * trim the page background away  (exact panel / artwork edge)
  * if the crop is uniformly surrounded by a flat background, flood that colour
    to transparency from the border (keeps inner whites intact)
  * optional contact-sheet preview
"""
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PAGE_TOL = 7        # tolerance against the sampled page background
FLAT_STD = 6.0      # border ring std below which the ring counts as uniform bg

def page_bg(img):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    b = 6
    ring = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3),
                           a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    return np.median(ring, axis=0)

def mask_near(a, col, tol):
    return (np.abs(a - col) <= tol).all(axis=2)

def ring_uniform(a, w=3):
    ring = np.concatenate([a[:w].reshape(-1, 3), a[-w:].reshape(-1, 3),
                           a[:, :w].reshape(-1, 3), a[:, -w:].reshape(-1, 3)])
    return float(ring.std()) < FLAT_STD and float(ring.mean()) > 195

def trim_to_content(img):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    bg = mask_near(a, page_bg(img), PAGE_TOL)
    content = ~bg
    h, w = content.shape
    if content.sum() < 20:
        return img, (0, 0, w, h), False
    rows = np.where(content.any(axis=1))[0]
    cols = np.where(content.any(axis=0))[0]
    y0, y1, x0, x1 = int(rows[0]), int(rows[-1]) + 1, int(cols[0]), int(cols[-1]) + 1
    surrounded = (x0 > 0 and y0 > 0 and x1 < w and y1 < h)
    return img.crop((x0, y0, x1, y1)), (x0, y0, x1 - x0, y1 - y0), surrounded

def flood_alpha(img, tol=None):
    im = img.convert("RGBA")
    a = np.asarray(im).astype(np.int16)
    rgb = a[:, :, :3]
    h, w = rgb.shape[:2]
    col = page_bg(im.convert("RGB"))
    t = PAGE_TOL if tol is None else tol
    bg = mask_near(rgb, col, t)
    seen = np.zeros((h, w), bool)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True; stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True; stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; stack.append((ny, nx))
    out = np.asarray(im).copy()
    out[seen, 3] = 0
    return Image.fromarray(out, "RGBA")

def run(cfg):
    src = Image.open(cfg["sheet"]).convert("RGB")
    outdir = cfg["outdir"]
    os.makedirs(outdir, exist_ok=True)
    manifest = []
    for it in cfg["items"]:
        x, y, w, h = it["b"]
        x2, y2 = min(x + w, src.width), min(y + h, src.height)
        crop = src.crop((max(0, x), max(0, y), x2, y2))
        crop, used, surrounded = trim_to_content(crop)
        mode = it.get("alpha", "auto")
        do_alpha = (mode is True) or (mode == "auto" and (surrounded or ring_uniform(
            np.asarray(crop.convert("RGB")).astype(np.int16))))
        if do_alpha:
            crop = flood_alpha(crop)
        name = it["n"] + ".png"
        crop.save(os.path.join(outdir, name))
        manifest.append({
            "name": it["n"], "file": name,
            "abs": [max(0, x) + used[0], max(0, y) + used[1], used[2], used[3]],
            "size": list(crop.size), "alpha": bool(do_alpha),
            "note": it.get("note", ""),
        })
        print(f"{it['n']:38s} {crop.size[0]:4d}x{crop.size[1]:<4d} alpha={int(do_alpha)}")
    json.dump(manifest, open(os.path.join(outdir, "_manifest.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"{len(manifest)} slices -> {outdir}")
    return manifest

def contact_sheet(outdir, out, cols=4, cell=(280, 250)):
    m = json.load(open(os.path.join(outdir, "_manifest.json"), encoding="utf-8"))
    cw, ch = cell
    lab = 26
    rows = (len(m) + cols - 1) // cols
    W, H = cw * cols, (ch + lab) * rows
    canvas = Image.new("RGB", (W, H), (250, 248, 247))
    d = ImageDraw.Draw(canvas)
    f = None
    for p in ("C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(p):
            try:
                f = ImageFont.truetype(p, 12); break
            except Exception:
                pass
    for i, it in enumerate(m):
        r, c = divmod(i, cols)
        ox, oy = c * cw, r * (ch + lab)
        d.rectangle([ox + 2, oy + 2, ox + cw - 3, oy + ch - 3], fill=(255, 255, 255),
                    outline=(228, 220, 218))
        im = Image.open(os.path.join(outdir, it["file"]))
        scale = min((cw - 16) / im.width, (ch - 16) / im.height, 1.0)
        im2 = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        if im2.mode == "RGBA":
            canvas.paste(im2, (ox + (cw - im2.width) // 2, oy + (ch - im2.height) // 2), im2)
        else:
            canvas.paste(im2, (ox + (cw - im2.width) // 2, oy + (ch - im2.height) // 2))
        t = it["name"]
        d.text((ox + 6, oy + ch + 4), t, font=f, fill=(90, 60, 60))
    canvas.save(out, quality=92)
    print("contact sheet", out, canvas.size)

if __name__ == "__main__":
    arg = sys.argv[1]
    if arg == "sheet":
        contact_sheet(sys.argv[2], sys.argv[3])
    elif arg == "all":
        cfgs = json.load(open(sys.argv[2], encoding="utf-8"))
        for cfg in cfgs:
            print("=" * 70)
            print(cfg["outdir"])
            run(cfg)
    else:
        run(json.load(open(arg, encoding="utf-8")))
