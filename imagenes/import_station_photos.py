"""Descarga las fotografías acreditadas del catálogo y exporta los WebP para las fichas."""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'imagenes/fotos-estaciones/sources.json'
CACHE = ROOT / 'imagenes/.temp/fichas-estaciones/originales'
DESTINATION = ROOT / 'public/assets/estaciones'
MANIFEST = ROOT / 'src/data/stationInfo/photoManifest.ts'
MAX_SIDE = 800


def download(url, target):
    executable = shutil.which('curl.exe' if os.name == 'nt' else 'curl')
    if not executable:
        raise RuntimeError('Se necesita curl para descargar las fotografías.')
    subprocess.run([executable, '--fail', '--location', '--silent', '--show-error',
                    '--retry', '3', '--retry-delay', '10', '--max-time', '90',
                    '--output', str(target), url], check=True,
                   creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)


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
    return {'file': f'estaciones/{target.name}', 'width': width, 'height': height, **metadata}


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
    output = ('// Generado por imagenes/import_station_photos.py; créditos en imagenes/fotos-estaciones/sources.json.\n'
              "import type { StationPhoto } from './photos';\n\nexport const PHOTO_MANIFEST = "
              + json.dumps(manifest, ensure_ascii=False, indent=2)
              + ' as const satisfies Readonly<Record<string, StationPhoto>>;\n')
    MANIFEST.write_text(output, encoding='utf-8')


if __name__ == '__main__':
    main()
