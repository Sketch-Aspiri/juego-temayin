"""Descarga las fotografías acreditadas del cuaderno de Toh y exporta los WebP y su manifiesto."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_station_photos import MAX_SIDE, download  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'imagenes/fotos-cuaderno/sources.json'
CACHE = ROOT / 'imagenes/.temp/cuaderno-fotos/originales'
DESTINATION = ROOT / 'public/assets/cuaderno/fotos'
MANIFEST = ROOT / 'src/data/explorerNotebook/photoManifest.ts'


def export_photo(entry, offline):
    source_hash = hashlib.sha256(entry['originalUrl'].encode()).hexdigest()[:12]
    original = CACHE / f"{entry['id']}-{source_hash}.jpg"
    if not original.exists():
        if offline:
            raise FileNotFoundError(f'Falta el original descargado: {original}')
        download(entry['downloadUrl'], original)
    target = DESTINATION / f"{entry['id']}.webp"
    with Image.open(original) as source:
        image = ImageOps.exif_transpose(source).convert('RGB')
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=78, method=6)
        width, height = image.size
    metadata = {key: entry[key] for key in ['caption', 'alt', 'scope', 'author', 'sourceUrl', 'license', 'licenseUrl']}
    return {'file': f'cuaderno/fotos/{target.name}', 'width': width, 'height': height, **metadata}


def format_manifest(manifest):
    """Agrupa propiedades del manifiesto generado para mantener el archivo legible y compacto."""
    groups = [('file', 'width', 'height'), ('caption',), ('alt',),
              ('scope', 'author', 'license'), ('sourceUrl',), ('licenseUrl',)]
    entries = []
    for entry_id, photo in manifest.items():
        rows = [', '.join(f'{json.dumps(key)}: {json.dumps(photo[key], ensure_ascii=False)}' for key in group)
                for group in groups]
        entries.append('  ' + json.dumps(entry_id) + ': {\n    ' + ',\n    '.join(rows) + '\n  }')
    return '{\n' + ',\n'.join(entries) + '\n}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Usa únicamente los originales ya descargados.')
    args = parser.parse_args()
    entries = json.loads(SOURCES.read_text(encoding='utf-8'))
    CACHE.mkdir(parents=True, exist_ok=True)
    DESTINATION.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for entry in entries:
        if entry['id'] in manifest:
            raise ValueError(f"Id de fotografía duplicado: {entry['id']}")
        manifest[entry['id']] = export_photo(entry, args.offline)
        print(entry['id'], flush=True)
    output = ('// Generado por imagenes/import_notebook_photos.py; créditos en imagenes/fotos-cuaderno/sources.json.\n'
              "import type { StationPhoto } from '../stationInfo/photos';\n\nexport const NOTEBOOK_PHOTO_MANIFEST = "
              + format_manifest(manifest)
              + ' as const satisfies Readonly<Record<string, StationPhoto>>;\n')
    MANIFEST.write_text(output, encoding='utf-8')


if __name__ == '__main__':
    main()
