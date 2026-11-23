# Keys the flat paper background of single-object illustrations to pure white,
# leaving the subject untouched (soft distance mask from the border median colour).
# Usage: python3 scripts/whiten-illustration-bg.py <dir-with-source-jpg-png> src/assets/images
# Requires: pillow, numpy. Output: same basename as .webp (q82).
import sys, os, statistics as st
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for name in sorted(os.listdir(src)):
    a = np.asarray(Image.open(os.path.join(src,name)).convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[:3].reshape(-1,3), a[-3:].reshape(-1,3), a[:, :3].reshape(-1,3), a[:, -3:].reshape(-1,3)])
    bg = np.median(border, axis=0)
    sd = border.std(axis=0).max()
    # distance of each pixel from the background colour (max channel)
    d = np.abs(a - bg).max(axis=2)
    d0 = 2.5*sd + 4          # inside this: pure background
    d1 = d0 + 28             # beyond this: untouched subject
    t = np.clip((d - d0) / (d1 - d0), 0, 1)
    t = t*t*(3-2*t)          # smoothstep for a soft watercolour edge
    balanced = np.clip(a / bg * 255.0, 0, 255)  # background -> white, keeps relative tint
    out = balanced*(1-t[...,None]) + a*t[...,None]
    im = Image.fromarray(np.clip(out+0.5,0,255).astype(np.uint8))
    if max(im.size) > 1600: im.thumbnail((1600,1600), Image.LANCZOS)
    im.save(os.path.join(dst, os.path.splitext(name)[0]+'.webp'), 'WEBP', quality=82, method=6)
    print(f"{name[:40]:40} bg={tuple(int(x) for x in bg)} sd={sd:.1f} subject-untouched={100*(t>=1).mean():.0f}%")
