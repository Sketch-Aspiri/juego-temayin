"""Exporta sin pérdidas el arte del Mundo 7 y verifica el alfa original."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path('imagenes/nuevos/mundo7')
OUTPUT = Path('public/assets/mundo7')
FRAMES = {
    'bolt': [0, 108, 581, 355], 'shard': [644, 0, 413, 526],
    'mote': [1103, 35, 433, 464], 'gust': [0, 550, 543, 444],
    'wave': [546, 568, 568, 416], 'sun': [1117, 536, 419, 473],
}


def main():
    OUTPUT.mkdir(exist_ok=True)
    report = []
    for name in ['efectos-camazotz', 'reencuentro', 'xpujil-rio-bec', 'calakmul-amanecer', 'brasero-jade']:
        image = Image.open(ROOT / f'{name}.png').convert('RGBA')
        if name in ['efectos-camazotz', 'reencuentro', 'brasero-jade']:
            assert image.getchannel('A').getextrema()[0] == 0, f'{name}: falta transparencia'
        target = Path('public/assets/backgrounds/rioBec.webp') if name == 'xpujil-rio-bec' else OUTPUT / f'{name}.webp'
        image.save(target, lossless=True, exact=True)
        exported = Image.open(target).convert('RGBA')
        assert exported.tobytes() == image.tobytes(), f'{name}: exportación alterada'
        report.append({'archivo': str(target), 'tamaño': image.size, 'alfa': image.getchannel('A').getextrema()})
    (OUTPUT / 'efectos-camazotz.atlas.json').write_text(json.dumps({
        'image': 'efectos-camazotz.webp', 'width': 1536, 'height': 1024, 'frames': FRAMES,
        'nota': 'Recortes independientes; conservan glows y partículas, no aislar por componente.',
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUTPUT / 'brasero-jade.atlas.json').write_text(json.dumps({
        'image': 'brasero-jade.webp', 'width': 1261, 'height': 1247,
        'frames': {'brazier': [256, 24, 752, 1128]},
    }, indent=2), encoding='utf-8')
    (ROOT / 'exportacion.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True))


if __name__ == '__main__':
    main()
