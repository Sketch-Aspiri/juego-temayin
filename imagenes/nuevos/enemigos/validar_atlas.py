"""Inspecciona el alfa sin modificar imágenes y escribe recortes de las cuatro poses."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
STATES = {
    'nauyaca': ['enroscada', 'erguida', 'embestida', 'repliegue'],
    'ants': ['paso 1', 'paso 2', 'paso 3', 'paso 4'],
    'blueCrab': ['paso 1', 'paso 2', 'pinzas levantadas', 'pinzazo'],
    'lionfish': ['aletas abiertas', 'aletas medias', 'defensa', 'giro leve'],
    'jellyfish': ['expandida', 'contracción inicial', 'contraída', 'expansión inicial'],
    'barracuda': ['nado', 'cola ondulada', 'preparación', 'embestida'],
    'moray': ['enroscada', 'emergiendo', 'mordida', 'repliegue'],
    'stalactite': ['intacta', 'agrietada', 'caída', 'fragmentada'],
    'scorpion': ['paso 1', 'paso 2', 'alerta', 'carrera'],
    'axolotl': ['nado', 'cola ondulada', 'aparición', 'desvanecimiento'],
    'alux': ['curioso', 'recoger cacao', 'correr', 'devolver cacao'],
    'shade': ['reposo', 'desplazamiento', 'expansión', 'disolución'],
    'xtabay': ['reposo', 'flores luminosas', 'raíz extendida', 'raíz replegada'],
    'pirateCrab': ['reposo', 'salto', 'preparación', 'lanzamiento'],
    'wheel': ['giro 1', 'giro 2', 'giro 3', 'giro 4'],
    'truck': ['ruedas en cruz 1', 'ruedas diagonales 1', 'ruedas en cruz 2', 'ruedas diagonales 2'],
}


def components(alpha):
    h, w = alpha.shape
    mask = (alpha > 8).ravel().copy()
    result = []
    for start in np.flatnonzero(mask):
        if not mask[start]:
            continue
        pending = [int(start)]
        mask[start] = False
        left = right = int(start) % w
        top = bottom = int(start) // w
        count = 0
        while pending:
            index = pending.pop()
            y, x = divmod(index, w)
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            count += 1
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    neighbor = ny * w + nx
                    if mask[neighbor]:
                        mask[neighbor] = False
                        pending.append(neighbor)
        if count >= 10:
            result.append((count, [left, top, right + 1, bottom + 1]))
    return sorted(result, reverse=True)


def distance(rect, other):
    dx = max(rect[0] - other[2], other[0] - rect[2], 0)
    dy = max(rect[1] - other[3], other[1] - rect[3], 0)
    return dx * dx + dy * dy


def inspect(asset_id, states):
    with Image.open(ROOT / (asset_id + '.png')) as im:
        alpha = np.asarray(im.getchannel('A'))
        w, h = im.size
    groups = components(alpha)
    assert len(groups) >= 4, (asset_id, groups)
    boxes = [g[1].copy() for g in groups[:4]]
    # Los fragmentos, ojos y partículas próximos pertenecen al mismo fotograma.
    for _, rect in groups[4:]:
        box = min(boxes, key=lambda b: distance(b, rect))
        box[0], box[1] = min(box[0], rect[0]), min(box[1], rect[1])
        box[2], box[3] = max(box[2], rect[2]), max(box[3], rect[3])
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    boxes = sorted(boxes[:2]) + sorted(boxes[2:])
    frames = []
    for state, box in zip(states, boxes):
        left, top = max(0, box[0] - 2), max(0, box[1] - 2)
        right, bottom = min(w, box[2] + 2), min(h, box[3] + 2)
        frames.append({'state': state, 'x': left, 'y': top,
                       'width': right - left, 'height': bottom - top})
    qa = 'Revisión visual realizada. Recortes por alfa > 8; alfa residual menor se considera ruido de fondo. Usar rectángulos reales y normalizar el ancla al integrar.'
    if asset_id == 'truck':
        qa += ' Las poses 1/3 y 2/4 son parecidas; el giro visible alterna cruz y diagonal.'
    if asset_id == 'wheel':
        qa += ' Rotaciones ilustradas aproximadas; no representan ángulos exactos.'
    if asset_id in ('barracuda', 'pirateCrab'):
        qa += ' La última pose incluye la estela del ataque; no es un proyectil separado.'
    data = {'id': asset_id, 'image': asset_id + '.png', 'width': w, 'height': h,
            'alpha': bool(alpha.min() == 0 and alpha.max() == 255),
            'layout': '2x2 con rectángulos reales; no cortar por cuadrantes nominales',
            'states': states, 'frames': frames, 'qa': qa}
    (ROOT / (asset_id + '.atlas.json')).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(asset_id, len(groups), frames)


if __name__ == '__main__':
    for asset_id, states in STATES.items():
        inspect(asset_id, states)
