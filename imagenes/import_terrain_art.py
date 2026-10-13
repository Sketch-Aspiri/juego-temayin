"""Conserva el suelo generado y lo exporta a WebP sin pérdidas; no modifica sus píxeles."""
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CELL = 256
COLUMNS = 6
ROWS = 4


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    source = ROOT / 'imagenes/nuevos/terreno/suelo-pantano.png'
    runtime = ROOT / 'public/assets/terreno/suelo-pantano.webp'
    if source.exists() or runtime.exists():
        raise FileExistsError('El suelo ya existe; conserva los originales.')
    source.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as image:
        assert image.size == (CELL * COLUMNS, CELL * ROWS), image.size
        assert image.mode == 'RGB', image.mode
        image.save(runtime, format='WEBP', lossless=True, exact=True)
        with Image.open(runtime) as exported:
            assert exported.tobytes() == image.tobytes(), 'La exportación debe conservar cada píxel.'
    shutil.copy2(args.source, source)
    frames = [
        {'state': f'{"superficie" if row == 0 else "tierra"}-{row}-{col}',
         'x': col * CELL, 'y': row * CELL, 'width': CELL, 'height': CELL}
        for row in range(ROWS) for col in range(COLUMNS)
    ]
    atlas = {'image': source.name, 'width': CELL * COLUMNS, 'height': CELL * ROWS,
             'alpha': False, 'generator': 'image_gen integrado', 'frames': frames,
             'qa': 'PNG original intacto; WebP sin pérdidas verificado píxel a píxel; 24 recortes contiguos.'}
    for target in [source, runtime]:
        target.with_suffix('.atlas.json').write_text(
            json.dumps(atlas, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'file': str(runtime.relative_to(ROOT)), 'frames': len(frames),
                      'bytes': runtime.stat().st_size}))


if __name__ == '__main__':
    main()
