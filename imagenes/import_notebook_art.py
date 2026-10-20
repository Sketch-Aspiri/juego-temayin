"""Exporta el arte del cuaderno a WebP sin pérdidas y verifica sus píxeles."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'imagenes/nuevos/cuaderno-toh'
OUTPUT = ROOT / 'public/assets/cuaderno'


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []
    for name in ['pergamino', 'toh-guia']:
        source = Image.open(SOURCE / f'{name}.png').convert('RGBA')
        target = OUTPUT / f'{name}.webp'
        source.save(target, 'WEBP', lossless=True, exact=True, method=6)
        exported = Image.open(target).convert('RGBA')
        if source.size != exported.size or source.tobytes() != exported.tobytes():
            raise ValueError(f'La exportación cambió los píxeles de {name}')
        if name == 'toh-guia' and source.getchannel('A').getextrema() != (0, 255):
            raise ValueError('El retrato de Toh necesita transparencia real')
        records.append({'file': target.relative_to(ROOT).as_posix(), 'size': source.size,
                        'bytes': target.stat().st_size, 'rgba_equal': True})
    print(json.dumps(records))


if __name__ == '__main__':
    main()
