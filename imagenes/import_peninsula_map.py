"""Recorta la cartografía pública de Natural Earth para el selector, sin dependencias."""
import json
import math
from pathlib import Path
from urllib.request import urlopen

SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'
CACHE = Path('imagenes/.temp/countries.geojson')
WEST, EAST, SOUTH, NORTH = -92.65, -86.25, 16.95, 22.10
WIDTH = 1000
HEIGHT = WIDTH * (NORTH - SOUTH) / ((EAST - WEST) * math.cos(math.radians(20)))


def clip(ring):
    for axis, edge, sign in [(0, -98, 1), (0, -80, -1), (1, 10, 1), (1, 28, -1)]:
        result = []
        for previous, current in zip(ring[-1:] + ring[:-1], ring):
            inside = sign * (current[axis] - edge) >= 0
            was_inside = sign * (previous[axis] - edge) >= 0
            if inside != was_inside:
                ratio = (edge - previous[axis]) / (current[axis] - previous[axis])
                result.append([previous[i] + ratio * (current[i] - previous[i]) for i in range(2)])
            if inside:
                result.append(current)
        ring = result
        if not ring:
            break
    return ring


def project(point):
    lon, lat = point
    return ((lon - WEST) / (EAST - WEST) * WIDTH, (NORTH - lat) / (NORTH - SOUTH) * HEIGHT)


def path(rings):
    output = []
    for ring in rings:
        points = [project(p) for p in clip(ring)]
        if len(points) < 3:
            continue
        # Se conserva la costa con resolución subpíxel en la vista general.
        kept = [points[0]]
        for point in points[1:]:
            if math.dist(kept[-1], point) >= 0.65:
                kept.append(point)
        output.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x, y in kept) + 'Z')
    return ''.join(output)


def main():
    CACHE.parent.mkdir(exist_ok=True)
    if not CACHE.exists():
        CACHE.write_bytes(urlopen(SOURCE, timeout=60).read())
    countries = json.loads(CACHE.read_text(encoding='utf-8'))
    shapes = []
    for feature in countries['features']:
        name = feature['properties']['ADMIN']
        if name not in ['Mexico', 'Belize', 'Guatemala', 'Honduras', 'Cuba', 'El Salvador', 'Nicaragua']:
            continue
        geometry = feature['geometry']
        polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
        shapes.append({'name': name, 'path': path([ring for polygon in polygons for ring in polygon])})
    target = Path('src/data/peninsulaGeography.ts')
    target.write_text('// Costa y fronteras: Natural Earth 1:10m (dominio público).\n'
                      '// Generado por imagenes/import_peninsula_map.py; comparte proyección con stations.ts.\n'
                      'export const PENINSULA_LAND = ' + json.dumps(shapes, ensure_ascii=False, indent=2)
                      + ' as const;\n', encoding='utf-8')
    print(f'Cartografía exportada: {target}, altura {HEIGHT:.6f}')


if __name__ == '__main__':
    main()
