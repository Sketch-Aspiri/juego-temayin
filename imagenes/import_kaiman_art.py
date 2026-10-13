"""Importa sprites de Kaimán: conserva el PNG y sirve WebP sin pérdidas ni edición."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def main():
    entries = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    for entry in entries:
        family, name = entry['family'], entry['name']
        source_family = 'jefes' if family == 'bosses' else family
        source = ROOT / 'imagenes/nuevos' / source_family / f'{name}.png'
        runtime = ROOT / 'public/assets' / family / f'{name}.webp'
        source.parent.mkdir(parents=True, exist_ok=True)
        runtime.parent.mkdir(parents=True, exist_ok=True)
        if source.exists() or runtime.exists():
            raise FileExistsError(name)
        shutil.copy2(entry['path'], source)
        source.with_suffix('.prompt.txt').write_text(entry['prompt'] + '\n', encoding='utf-8')
        with Image.open(source) as image:
            assert image.mode == 'RGBA', (name, image.mode)
            alpha = image.getchannel('A')
            assert alpha.getextrema()[0] == 0, f'{name}: falta transparencia'
            x, y, right, bottom = alpha.point(lambda a: 255 if a >= 40 else 0).getbbox()
            frame = [x, y, right - x, bottom - y]
            image.save(runtime, format='WEBP', lossless=True, exact=True)
            atlas = {'image': source.name, 'width': image.width, 'height': image.height,
                     'alpha': True, 'generator': 'image_gen integrado',
                     'frames': [{'state': name, 'x': x, 'y': y,
                                 'width': frame[2], 'height': frame[3]}],
                     'qa': 'Alfa >= 40; PNG original intacto; WebP sin pérdidas.'}
            for target in [source, runtime]:
                target.with_suffix('.atlas.json').write_text(
                    json.dumps(atlas, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'file': f'{family}/{name}.webp', 'frame': frame,
                          'bytes': runtime.stat().st_size}))


if __name__ == '__main__':
    main()
