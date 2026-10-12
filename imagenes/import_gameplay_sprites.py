"""Importa originales de image_gen; cambia solo el formato de servicio, sin editar píxeles."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
IDS = {'pua': 'quill', 'fruto': 'fruit', 'fuego-fatuo': 'wisp', 'bola-sargazo': 'algaeBall',
       'ola-agua': 'waterWave', 'onda-espectral': 'spectralWave', 'toldo': 'awning'}


def main():
    entries = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    definitions = []
    for entry in entries:
        name = entry['id']
        family = 'complementos' if name == 'toldo' else 'proyectiles'
        source = ROOT / 'nuevos' / family / f'{name}.png'
        runtime = PROJECT / 'public' / 'assets' / family / f'{name}.webp'
        source.parent.mkdir(parents=True, exist_ok=True)
        runtime.parent.mkdir(parents=True, exist_ok=True)
        if source.exists() or runtime.exists():
            raise FileExistsError(f'El recurso ya existe: {name}')
        shutil.copy2(entry['path'], source)
        source.with_suffix('.prompt.txt').write_text(entry['prompt'] + '\n', encoding='utf-8')
        with Image.open(source) as image:
            assert image.mode == 'RGBA', (name, image.mode)
            alpha = image.getchannel('A')
            assert alpha.getextrema()[0] == 0, f'{name}: falta transparencia'
            box = alpha.point(lambda a: 255 if a >= 40 else 0).getbbox()
            assert box, f'{name}: sprite vacío'
            x, y, right, bottom = box
            width, height = right - x, bottom - y
            image.save(runtime, format='WEBP', lossless=True, exact=True)
            metadata = {'image': source.name, 'width': image.width, 'height': image.height,
                        'mode': 'RGBA', 'alpha': True, 'generator': 'image_gen integrado',
                        'frames': [{'state': name, 'x': x, 'y': y, 'width': width, 'height': height}],
                        'qa': 'Recorte medido con alfa >= 40; PNG original intacto; WebP sin pérdidas.'}
            source.with_suffix('.atlas.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
            runtime.with_suffix('.atlas.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
        anchor = '[0.5, 1]' if name in ['ola-agua', 'onda-espectral'] else '[0, 0]' if name == 'toldo' else '[0.5, 0.5]'
        definitions.append(f"  {IDS[name]}: {{ file: '{family}/{name}.webp', frame: [{x}, {y}, {width}, {height}], anchor: {anchor} }},")
        print(f'{name}: {width} x {height}, {runtime.stat().st_size} bytes')
    module = "import type { GameplaySprite } from './gameplaySprites';\n\n/** Arte generado para los elementos que carecían de sprite independiente. */\nexport const NEW_GAMEPLAY_SPRITES = {\n"
    module += '\n'.join(definitions) + '\n} as const satisfies Readonly<Record<string, GameplaySprite>>;\n\nexport type NewGameplaySpriteId = keyof typeof NEW_GAMEPLAY_SPRITES;\n'
    (PROJECT / 'src' / 'data' / 'newGameplaySprites.ts').write_text(module, encoding='utf-8')


if __name__ == '__main__':
    main()
