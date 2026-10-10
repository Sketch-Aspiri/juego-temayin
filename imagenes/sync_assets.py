"""Sincroniza el arte de imagenes/nuevos/ con public/assets/ en WebP.

Convierte cada PNG nuevo o más reciente que su WebP (misma resolución, conserva
la transparencia) y, con --boxes, imprime las cajas de alfa de cada pieza para
copiarlas a los atlas del código (render/enemies/*.ts, props.ts...).

Uso: python imagenes/sync_assets.py [--boxes] [--force]
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "nuevos"
DST = ROOT.parent / "public" / "assets"
# Carpeta fuente -> carpeta servida (como en el commit de conversión a WebP).
FOLDERS = {
    "paisajes": "backgrounds",
    "enemigos": "enemies",
    "jefes": "bosses",
    "complementos": "complementos",
    "mecanicas": "mecanicas",
    "objetos": "objetos",
    "personajes": "personajes",
}
QUALITY = 82
ALPHA_MIN = 64
MIN_PIECE_AREA = 900


def alpha_boxes(img: Image.Image) -> list[tuple[int, int, int, int]]:
    """Cajas [x, y, w, h] de las piezas opacas (componentes conexas a baja resolución)."""
    step = 4
    small = img.getchannel("A").reduce(step)
    w, h = small.size
    px = small.load()
    seen = [[False] * w for _ in range(h)]
    boxes = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or px[x0, y0] < ALPHA_MIN:
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            x1, y1, x2, y2, n = x0, y0, x0, y0, 0
            while stack:
                x, y = stack.pop()
                n += 1
                x1, y1, x2, y2 = min(x1, x), min(y1, y), max(x2, x), max(y2, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny] >= ALPHA_MIN:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if n * step * step >= MIN_PIECE_AREA:
                boxes.append((x1 * step, y1 * step, (x2 - x1 + 1) * step, (y2 - y1 + 1) * step))
    return sorted(boxes, key=lambda b: (b[1] // 200, b[0]))


def main() -> None:
    force = "--force" in sys.argv
    show_boxes = "--boxes" in sys.argv
    for src_dir, dst_dir in FOLDERS.items():
        for png in sorted((SRC / src_dir).glob("*.png")):
            out = DST / dst_dir / f"{png.stem}.webp"
            if not force and out.exists() and out.stat().st_mtime >= png.stat().st_mtime:
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            img = Image.open(png)
            img.save(out, "WEBP", quality=QUALITY, method=6)
            print(f"{png.relative_to(ROOT)} -> {out.relative_to(DST.parent.parent)} {img.size} {img.mode}")
            if show_boxes and img.mode == "RGBA":
                for box in alpha_boxes(img):
                    print(f"  pieza {list(box)}")


if __name__ == "__main__":
    main()
