"""Exporta las hojas narrativas de image_gen sin pérdidas y genera sus recortes.

Uso: python imagenes/import_cinematic_art.py
Los PNG y prompts originales se conservan en imagenes/nuevos/cinematicas/.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'imagenes/nuevos/cinematicas'
DEST = ROOT / 'public/assets/cinematicas'
ALPHA_THRESHOLD = 8
MIN_GUTTER = 20
BOSSES = ('kaiman', 'huayChivo', 'huayPek', 'sargazo', 'lorencillo')
HERO_SHEETS = {
    'temayin-emociones': ('celebrate', 'grateful'),
    'temayin-aventura': ('listen', 'journey'),
    'temayin-viaje': ('swim', 'seated'),
}


def split_frames(image):
    """Busca el pasillo transparente central sin cortar colas ni aletas."""
    alpha = image.getchannel('A').point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
    projection = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is None for x in range(image.width)]
    gaps, start = [], None
    for x, empty in enumerate(projection + [False]):
        if empty and start is None:
            start = x
        if not empty and start is not None:
            if x - start >= MIN_GUTTER and start > image.width * .25 and x < image.width * .75:
                gaps.append((start, x))
            start = None
    assert gaps, 'La hoja necesita dos siluetas separadas por transparencia.'
    gap = min(gaps, key=lambda pair: abs(sum(pair) / 2 - image.width / 2))
    split = sum(gap) // 2
    frames = []
    for left, right in ((0, split), (split, image.width)):
        box = alpha.crop((left, 0, right, image.height)).getbbox()
        assert box, 'Falta una pose.'
        x0, y0, x1, y1 = box
        frames.append([x0 + left, y0, x1 - x0, y1 - y0])
    return frames


def export_sheet(name, states):
    image = Image.open(SOURCE / f'{name}.png').convert('RGBA')
    assert image.getchannel('A').getextrema() == (0, 255), 'Se requiere alfa real.'
    frames = split_frames(image)
    target = DEST / f'{name}.webp'
    image.save(target, lossless=True, exact=True)
    assert Image.open(target).convert('RGBA').tobytes() == image.tobytes()
    atlas = {'image': target.name, 'width': image.width, 'height': image.height,
             'alpha': True, 'generator': 'image_gen integrado',
             'frames': [{'state': state, 'frame': frame} for state, frame in zip(states, frames)]}
    for path in (target.with_suffix('.atlas.json'), SOURCE / f'{name}.atlas.json'):
        path.write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return {state: "{ file: 'cinematicas/%s.webp', sheetW: %d, sheetH: %d, frame: %s }" %
            (name, image.width, image.height, json.dumps(frame)) for state, frame in zip(states, frames)}


def export_background(name):
    image = Image.open(SOURCE / f'{name}.png').convert('RGB')
    target = DEST / f'{name}.webp'
    image.save(target, lossless=True, exact=True)
    assert Image.open(target).convert('RGB').tobytes() == image.tobytes()
    atlas = {'image': target.name, 'width': image.width, 'height': image.height,
             'alpha': False, 'generator': 'image_gen integrado'}
    target.with_suffix('.atlas.json').write_text(json.dumps(atlas, indent=2) + '\n', encoding='utf-8')


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    lines = ["import type { BossId } from '../engine/types';", "import type { SpriteRef } from './intro';", '',
             '/** Generado por imagenes/import_cinematic_art.py a partir del alfa original. */',
             'export const BOSS_VICTORY_SPRITES = {']
    for boss in BOSSES:
        poses = export_sheet(f'{boss}-victoria', ('defeated', 'farewell'))
        lines.append(f'  {boss}: {{')
        lines.extend(f'    {key}: {value},' for key, value in poses.items())
        lines.append('  },')
    lines.extend(["} as const satisfies Readonly<Record<Exclude<BossId, 'puas'>, Readonly<Record<'defeated' | 'farewell', SpriteRef>>>>;",
                  '', 'export const TEMAYIN_CINEMATIC_POSES = {'])
    for sheet, states in HERO_SHEETS.items():
        lines.extend(f'  {key}: {value},' for key, value in export_sheet(sheet, states).items())
    lines.extend(['} as const satisfies Readonly<Record<string, SpriteRef>>;', '',
                  "export const CINEMATIC_DECK_BACKGROUND = 'cinematicas/cubierta-chetumal.webp';",
                  "export const CINEMATIC_TRAIN_BACKGROUND = 'cinematicas/interior-tren.webp';", ''])
    (ROOT / 'src/data/bossVictoryArt.ts').write_text('\n'.join(lines), encoding='utf-8')
    for name in ('cubierta-chetumal', 'interior-tren'):
        export_background(name)
    print('Exportadas 16 poses transparentes y dos fondos; WebP idénticos a los PNG.')


if __name__ == '__main__':
    main()
