"""Mide alfa >= 8 y exporta arte de Huay Chivo sin pérdidas; conserva los PNG originales."""
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ACTION_NAMES = ['paw', 'crouch', 'leap', 'land', 'rear', 'call', 'hurt', 'nightfall']
# Regiones de búsqueda: la composición es irregular, no se corta a los personajes por celdas nominales.
ACTION_REGIONS = [(0, 0, 465, 410), (465, 0, 914, 410), (914, 0, 1320, 410),
                  (1320, 0, 1774, 410), (0, 410, 460, 887), (460, 410, 924, 887),
                  (924, 410, 1325, 887), (1325, 410, 1774, 887)]
EFFECT_NAMES = ['smoke0', 'smoke1', 'smoke2', 'wave', 'stucco', 'torchOff', 'torchOn']
EFFECT_REGIONS = [(0, 0, 490, 567), (490, 0, 965, 567), (965, 0, 1536, 567),
                  (0, 567, 715, 1024), (715, 567, 1020, 1024),
                  (1020, 600, 1290, 1024), (1290, 550, 1536, 1024)]


def import_sheet(source, family, name, names, regions):
    original = ROOT / 'imagenes/nuevos' / ('jefes' if family == 'bosses' else family) / f'{name}.png'
    runtime = ROOT / 'public/assets' / family / f'{name}.webp'
    original.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != original.resolve():
        if original.exists():
            raise FileExistsError(original)
        shutil.copy2(source, original)
    with Image.open(original) as image:
        assert image.mode == 'RGBA' and image.getchannel('A').getextrema()[0] == 0
        alpha = image.getchannel('A').point(lambda a: 255 if a >= 8 else 0)
        frames = []
        for state, region in zip(names, regions):
            box = alpha.crop(region).getbbox()
            assert box, state
            x, y = region[0] + box[0], region[1] + box[1]
            frames.append({'state': state, 'x': x, 'y': y, 'width': box[2] - box[0],
                           'height': box[3] - box[1], 'alphaThreshold': 8})
        image.save(runtime, 'WEBP', lossless=True, exact=True)
        with Image.open(runtime) as exported:
            assert exported.convert('RGBA').tobytes() == image.tobytes(), 'La exportación debe ser idéntica'
        atlas = {'image': runtime.name, 'width': image.width, 'height': image.height,
                 'alpha': True, 'generator': 'image_gen integrado', 'frames': frames,
                 'qa': 'PNG original intacto; recortes alfa >= 8; WebP RGBA idéntico píxel a píxel.'}
        for path in [original, runtime]:
            path.with_suffix('.atlas.json').write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'file': str(runtime.relative_to(ROOT)), 'frames': frames}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actions', type=Path, required=True)
    parser.add_argument('--effects', type=Path, required=True)
    parser.add_argument('--night', type=Path, required=True)
    args = parser.parse_args()
    import_sheet(args.actions, 'bosses', 'huayChivo-acciones', ACTION_NAMES, ACTION_REGIONS)
    import_sheet(args.effects, 'proyectiles', 'huayChivo-efectos', EFFECT_NAMES, EFFECT_REGIONS)
    import_sheet(args.night, 'escenarios', 'arcada-izamal-noche', ['arcadeNight'], [(0, 0, 1536, 1024)])


if __name__ == '__main__':
    main()
