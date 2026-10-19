"""Exporta los originales completos sin modificar colores ni alfa."""
import json
from pathlib import Path
from PIL import Image

SOURCE = Path('imagenes/nuevos/mundo7')
TARGET = Path('public/assets/mundo7')


def main():
    report = []
    for name in ['camazotz-combate-v2', 'camazotz-efectos-v2']:
        original = Image.open(SOURCE / f'{name}.png').convert('RGBA')
        assert original.getchannel('A').getextrema()[0] == 0
        output = TARGET / f'{name}.webp'
        original.save(output, lossless=True, exact=True)
        assert Image.open(output).convert('RGBA').tobytes() == original.tobytes()
        report.append({'archivo': str(output), 'dimensiones': original.size, 'rgbaIdentico': True})
    (SOURCE / 'camazotz-v2-exportacion.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
