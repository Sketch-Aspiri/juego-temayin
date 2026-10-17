"""Exporta el arte de image_gen a WebP sin pérdidas y mide las siluetas por alfa.

Conserva los PNG originales. Uso: python imagenes/import_world6_art.py
"""
import json
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def components(image):
    """Mide componentes alfa: evita incorporar poses vecinas o el cangrejo decorativo."""
    width, height = image.size
    alpha = bytearray(image.getchannel('A').tobytes())
    result = []
    for start in range(len(alpha)):
        if alpha[start] < 8:
            continue
        queue = deque([start])
        alpha[start] = 0
        x0 = x1 = start % width
        y0 = y1 = start // width
        count = 0
        while queue:
            pos = queue.popleft()
            x, y = pos % width, pos // width
            count += 1
            x0, x1 = min(x0, x), max(x1, x)
            y0, y1 = min(y0, y), max(y1, y)
            for adj in (pos - width, pos + width, pos - 1, pos + 1):
                if not 0 <= adj < width * height or abs(adj % width - x) > 1:
                    continue
                if alpha[adj] >= 8:
                    alpha[adj] = 0
                    queue.append(adj)
        if count > 5000:
            result.append({'frame': [x0, y0, x1 - x0 + 1, y1 - y0 + 1], 'pixels': count})
    return result


def export(source, target):
    image = Image.open(ROOT / source).convert('RGBA')
    dest = ROOT / 'public/assets' / target
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, lossless=True, exact=True)
    assert Image.open(dest).convert('RGBA').tobytes() == image.tobytes()
    metadata = {'image': Path(source).name, 'width': image.width, 'height': image.height,
                'alpha': image.getchannel('A').getextrema()[0] < 255, 'generator': 'image_gen integrado',
                'frames': [{'state': 'completo', 'x': 0, 'y': 0, 'width': image.width, 'height': image.height}]}
    dest.with_suffix('.atlas.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    return image


def main():
    image = export('imagenes/nuevos/jefes/lorencillo-acciones.png', 'bosses/lorencillo-acciones.webp')
    atlas = {'size': list(image.size), 'components': components(image)}
    (ROOT / 'imagenes/nuevos/jefes/lorencillo-acciones.atlas.json').write_text(
        json.dumps(atlas, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(atlas))
    for source, target in [
        ('escenarios/jarcia-lorencillo.png', 'escenarios/jarcia-lorencillo.webp'),
        ('escenarios/bahia-chetumal.png', 'backgrounds/bay.webp'),
        ('terreno/vagon-costa-maya.png', 'terreno/vagon-costa-maya.webp'),
    ]:
        if (ROOT / 'imagenes/nuevos' / source).exists():
            art = export('imagenes/nuevos/' + source, target)
            print(target, art.size, art.getbbox())


if __name__ == '__main__':
    main()
