"""Conserva los originales de Sargazo y exporta atlas medidos por alfa y WebP sin pérdidas."""
import argparse
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ACTION_REGIONS = [(0, 0, 490, 425), (460, 0, 900, 425), (870, 0, 1304, 425), (1290, 0, 1774, 425),
                  (0, 440, 470, 887), (455, 440, 895, 887), (885, 415, 1320, 887), (1295, 440, 1774, 887)]
ALLY_REGIONS = [(0, 0, 470, 440), (455, 0, 880, 440), (880, 0, 1335, 450), (1300, 0, 1774, 465),
                (0, 440, 490, 887), (520, 470, 825, 887), (830, 470, 1365, 887), (1370, 470, 1774, 887)]


def export(source, folder, name, states, regions, alpha=True):
    family = 'jefes' if folder == 'bosses' else folder
    original = ROOT / 'imagenes/nuevos' / family / f'{name}.png'
    runtime = ROOT / 'public/assets' / folder / f'{name}.webp'
    original.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != original.resolve():
        if original.exists():
            raise FileExistsError(original)
        shutil.copy2(source, original)
    with Image.open(original) as source_image:
        image = source_image.convert('RGBA' if alpha else 'RGB')
        frames = []
        for state, region in zip(states, regions):
            box = image.getchannel('A').crop(region).point(lambda a: 255 if a >= 8 else 0).getbbox() if alpha else (0, 0, image.width, image.height)
            assert box, state
            frames.append({'state': state, 'x': region[0] + box[0], 'y': region[1] + box[1],
                           'width': box[2] - box[0], 'height': box[3] - box[1], 'alphaThreshold': 8})
        image.save(runtime, 'WEBP', lossless=True, exact=True)
        with Image.open(runtime) as check:
            assert check.convert(image.mode).tobytes() == image.tobytes()
        atlas = {'width': image.width, 'height': image.height, 'image': runtime.name, 'alpha': alpha,
                 'frames': frames, 'generator': 'image_gen integrado', 'qa': 'PNG intacto; alfa >= 8; WebP idéntico píxel a píxel.'}
        for path in [original, runtime]:
            path.with_suffix('.atlas.json').write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'name': name, 'frames': frames}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actions', type=Path, required=True)
    parser.add_argument('--allies', type=Path, required=True)
    parser.add_argument('--arena', type=Path, required=True)
    args = parser.parse_args()
    export(args.actions, 'bosses', 'sargazo-acciones', ['swim', 'surge', 'whirlpool', 'net', 'core', 'hurt', 'rage', 'dead'], ACTION_REGIONS)
    export(args.allies, 'mecanicas', 'tortugas-akumal', ['swim', 'net', 'air', 'boost', 'whirlpool', 'seed', 'netLoop', 'pulse'], ALLY_REGIONS)
    export(args.arena, 'escenarios', 'akumal-submarino', ['arena'], [(0, 0, 1536, 1024)], False)


if __name__ == '__main__':
    main()
