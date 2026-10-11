"""Build the web-sized images the site serves from the original art.

Run from the repo root:  python3 tools/optimize_images.py
Originals stay untouched; output goes to assets/img/web/.
"""
from pathlib import Path
from PIL import Image

SRC = Path("assets/img")
OUT = SRC / "web"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    # (source, output stem, widths, quality)
    ("books/book.png", "cover", (320, 484), 82),
    ("crest/g1.png", "crest-cats", (240, 480), 80),
    ("crest/g2.png", "crest-nomads", (240, 480), 80),
    ("crest/g3.png", "crest-socialists", (240, 480), 80),
    ("crest/g4.png", "crest-pirates", (240, 480), 80),
    ("dark/d2.png", "hero-moss", (360, 640), 74),
    ("dark/d3.jpg", "hero-alys", (360, 640), 74),
    ("dark/d4.jpg", "hero-gatekeeper", (360, 640), 74),
    ("dark/d6.jpg", "hero-spag", (360, 640), 74),
    ("dark/d1.jpg", "hero-markus", (360, 640), 74),
    ("dark/d9.jpg", "hero-axer", (360, 640), 74),
    ("main/1.jpg", "sailor-1", (360, 640), 74),
    ("main/2.jpeg", "sailor-2", (360, 640), 74),
    ("main/3.png", "sailor-3", (360, 640), 74),
    ("option1.png", "item-shards", (320,), 80),
    ("option2.png", "item-cannonballs", (320,), 80),
    ("option3.png", "item-twigs", (320,), 80),
    ("option4.png", "item-scroll", (320,), 80),
    ("fac.png", "logo", (96, 192), 85),
    ("signature.png", "signature", (240,), 85),
]

for src, stem, widths, q in JOBS:
    im = Image.open(SRC / src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{stem}-{w}.webp", "WEBP", quality=q, method=6)

# Favicons
logo = Image.open(SRC / "fac.png").convert("RGBA")
logo.resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png", optimize=True)
logo.resize((180, 180), Image.LANCZOS).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)

# Social share card, 1200 x 630: cover on the deep-void background
card = Image.new("RGB", (1200, 630), (11, 15, 26))
glow = Image.new("RGB", (1200, 630), (19, 26, 43))
mask = Image.radial_gradient("L").resize((1200, 1200)).crop((0, 285, 1200, 915))
card = Image.composite(card, glow, mask)
cover = Image.open(SRC / "books/book.png").convert("RGBA")
cover = cover.resize((round(cover.width * 560 / cover.height), 560), Image.LANCZOS)
card.paste(cover, (1200 - cover.width - 120, 35), cover)
lg = logo.resize((150, 150), Image.LANCZOS)
card.paste(lg, (120, 240), lg)
card.save(OUT / "share-card.jpg", "JPEG", quality=84, optimize=True, progressive=True)

for p in sorted(OUT.iterdir()):
    print(f"{p.name:32} {p.stat().st_size // 1024:>5} KB")
