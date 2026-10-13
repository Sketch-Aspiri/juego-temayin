"""Mide componentes alfa y recortes del arte existente sin modificar las imágenes."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent.parent


def components(alpha, cutoff=40):
    parents, runs = [], []
    previous = []

    def root(label):
        while parents[label] != label:
            parents[label] = parents[parents[label]]
            label = parents[label]
        return label

    for y, row in enumerate(alpha >= cutoff):
        edges = np.flatnonzero(np.diff(np.r_[False, row, False]))
        current = []
        for x0, x1 in zip(edges[::2], edges[1::2]):
            label = len(parents)
            parents.append(label)
            for px0, px1, other in previous:
                if px0 >= x1:
                    break
                if px1 > x0:
                    parents[root(other)] = root(label)
            current.append((int(x0), int(x1), label))
            runs.append((y, int(x0), int(x1), label))
        previous = current
    groups = {}
    for y, x0, x1, label in runs:
        key = root(label)
        group = groups.setdefault(key, {'pixels': 0, 'box': [x0, y, x1, y + 1], 'seed': [x0, y], 'runs': []})
        group['pixels'] += x1 - x0
        group['runs'].append((y, x0, x1))
        b = group['box']
        b[:] = [min(b[0], x0), min(b[1], y), max(b[2], x1), max(b[3], y + 1)]
    return sorted(groups.values(), key=lambda g: g['pixels'], reverse=True)


def intersect_pixels(group, frame):
    x, y, w, h = frame
    return sum(max(0, min(x1, x + w) - max(x0, x)) for ry, x0, x1 in group['runs'] if y <= ry < y + h)


def atlas_audit():
    issues, unreadable, total = [], [], 0
    for atlas_path in (ROOT / 'public/assets').rglob('*.atlas.json'):
        runtime = atlas_path.with_name(atlas_path.name.replace('.atlas.json', '.webp'))
        if not runtime.exists():
            continue
        atlas = json.loads(atlas_path.read_text(encoding='utf-8-sig'))
        try:
            groups = [g for g in components(np.asarray(Image.open(runtime).convert('RGBA').getchannel('A'))) if g['pixels'] >= 2000]
        except UnidentifiedImageError:
            unreadable.append(str(runtime.relative_to(ROOT)).replace('\\', '/'))
            continue
        for f in atlas.get('frames', []):
            total += 1
            frame = [f['x'], f['y'], f['width'], f['height']]
            covered = sorted([(intersect_pixels(g, frame), i) for i, g in enumerate(groups)], reverse=True)
            if not covered or not covered[0][0]:
                continue
            count, main = covered[0]
            missing = groups[main]['pixels'] - count
            neighbors = [{'pixels': n, 'box': groups[i]['box'], 'seed': groups[i]['seed']} for n, i in covered[1:] if n > 40]
            if missing > 20 or neighbors:
                issues.append({'file': str(runtime.relative_to(ROOT)).replace('\\', '/'),
                               'state': f['state'], 'frame': frame, 'missingBodyPixels': missing,
                               'neighborFragments': neighbors})
    return {'atlasFramesReviewed': total, 'candidates': issues, 'unreadable': unreadable}


def player_frames():
    image = np.asarray(Image.open(ROOT / 'public/assets/guepardo.webp').convert('RGBA'))
    reports = []
    for row, (state, count) in enumerate([('run', 7), ('jump', 8), ('fall', 7), ('idle', 7), ('win', 7)]):
        for index in range(count):
            cell = image[row * 160:(row + 1) * 160, index * 170:(index + 1) * 170]
            box = components(cell[:, :, 3])[0]['box']
            r, g, b, a = [cell[:, :, channel].astype(float) for channel in range(4)]
            green = (g > r * 1.25) & (g > b * 1.1) & (a >= 80)
            ys, xs = np.where(green)
            torso = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
            reports.append({'state': state, 'index': index, 'box': box, 'torso': torso,
                            'heightBefore': (box[3] - box[1]) * .6,
                            'headToCollar': torso[1] - box[1]})
    return reports


def write_player_data():
    frames = player_frames()
    lines = ["import type { AnimName } from '../engine/entities/types';",
             "import type { AtlasFrame } from '../engine/render/enemies/atlas';", '',
             'export interface PlayerSpriteFrame extends AtlasFrame { readonly scale: number }', '',
             '/** Altura visible en reposo, carrera y celebración; las poses aéreas conservan la flexión. */',
             'export const PLAYER_GROUND_ART_HEIGHT = 82;',
             'const AIR_SCALE = 0.6;', '',
             '/** Recortes alfa de guepardo.webp (1360×800), con los pies en su apoyo real. */',
             'export const PLAYER_SPRITES = {']
    for row, state in enumerate(['run', 'jump', 'fall', 'idle', 'win']):
        lines.append(f'  {state}: [')
        for f in [frame for frame in frames if frame['state'] == state]:
            x0, y0, x1, y1 = f['box']
            x, y = f['index'] * 170 + x0, row * 160 + y0
            w, h = x1 - x0, y1 - y0
            ax, ay = f['index'] * 170 + 85, row * 160 + 158
            scale = f'PLAYER_GROUND_ART_HEIGHT / {h}' if state in ['run', 'idle', 'win'] else 'AIR_SCALE'
            lines.append(f'    {{ x: {x}, y: {y}, w: {w}, h: {h}, ax: {ax}, ay: {ay}, scale: {scale} }},')
        lines.append('  ],')
    lines.append('} as const satisfies Readonly<Record<AnimName, readonly PlayerSpriteFrame[]>>;')
    (ROOT / 'src/data/playerSprites.ts').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', action='append', help='Ruta de un recurso relativa al repositorio')
    parser.add_argument('--player', action='store_true')
    parser.add_argument('--write-player', action='store_true', help='Actualiza solo los datos TypeScript del jugador')
    parser.add_argument('--all-atlases', action='store_true')
    parser.add_argument('--output', help='Ruta del informe JSON')
    args = parser.parse_args()
    if args.write_player:
        write_player_data()
    if args.all_atlases:
        report = atlas_audit()
        if args.output:
            path = ROOT / args.output
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False))
    if args.player:
        print(json.dumps(player_frames(), ensure_ascii=False))
    for name in args.file or []:
        alpha = np.asarray(Image.open(ROOT / name).getchannel('A'))
        print(json.dumps({'file': name, 'components': [{k: v for k, v in g.items() if k != 'runs'} for g in components(alpha) if g['pixels'] >= 30]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
