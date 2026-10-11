"""Cataloga el arte sin modificar los píxeles de las imágenes."""

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
ALPHA_THRESHOLD = 16
MIN_COMPONENT_AREA = 32
GROUPS = {
    "enemigos": "enemies", "jefes": "bosses", "paisajes": "backgrounds",
    "personajes": "personajes", "objetos": "objetos",
    "mecanicas": "mecanicas", "complementos": "complementos", "escenarios": "escenarios",
}
EXPECTED = {
    "enemigos": "bat howler tarantula nauyaca ants blueCrab lionfish jellyfish barracuda moray stalactite scorpion axolotl alux shade xtabay pirateCrab wheel truck".split(),
    "jefes": "kaiman huayChivo huayPek sargazo lorencillo camazotz".split(),
    "paisajes": "jungle beach lair cave river swamp ruins fortress mangrove hacienda yellowCity xibalba reef cliff lagoon batCave deepJungle throne".split(),
    "personajes": ["toh", "temayina", "jugador-mecanicas"],
    "objetos": ["objetos"],
    "mecanicas": ["mecanicas", "efectos"],
    "complementos": "tren piramide banderas vegetacion utileria bloques historia".split(),
    "escenarios": ["arcada-izamal", "guarida-puas"],
}
SHEETS = {
    "toh": (3, 2, ["reposo", "mirar", "cola péndulo", "alas arriba", "alas abajo", "guía"]),
    "temayina": (3, 2, ["reposo", "correr", "saltar", "Sol de Jade", "esperar rescate", "saludar"]),
    "objetos": (3, 3, ["cacao", "habanero", "corazón de jade", "escudo", "snorkel", "pelota", "cuerda", "glifo", "boleto"]),
    "mecanicas": (3, 3, ["hamaca", "cuerda colgante", "tronco", "plataforma frágil", "aro", "burbujas", "sargazo", "resina", "estromatolito"]),
    "efectos": (4, 3, [f"{kind} {frame + 1}" for kind in ["fuego", "brazada", "luz"] for frame in range(4)]),
    "banderas": (4, 2, ["ondear 1", "ondear 2", "ondear 3", "ondear 4", "poste completo", "poste", "checkpoint", "remate"]),
    "vegetacion": (3, 2, ["ceiba", "palmera", "arbusto", "henequén", "mangle", "lianas"]),
    "utileria": (3, 3, ["caja", "barril", "barca", "palapa", "cañón", "antorcha", "cristales", "cartel", "tortuga"]),
    "bloques": (4, 4, ["césped", "tierra", "arena superior", "arena", "caliza superior", "caliza", "roca superior", "roca", "madera", "cristal", "ladrillo", "interrogación", "bloque usado", "tubo superior izquierdo", "tubo superior derecho", "tubo"]),
    "historia": (3, 2, ["sol dormido", "sol cargado", "sol restaurado", "jaula de sombra", "llave", "arco"]),
}


def read_properties(path):
    with Image.open(path) as image:
        result = {"width": image.width, "height": image.height, "mode": image.mode}
        alpha = np.asarray(image.getchannel("A")) if "A" in image.getbands() else None
        result["alpha"] = alpha is not None and int(alpha.min()) < 255
        if alpha is not None:
            result["transparentFraction"] = round(float(np.mean(alpha < 8)), 4)
        return result, alpha


def connected_bounds(mask):
    # Unimos tramos horizontales vecinos para medir siluetas sin dependencias nativas.
    parent, bounds, areas = [], [], []
    previous = []
    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index
    for y, row in enumerate(mask):
        transitions = np.diff(np.pad(row.astype(np.int8), (1, 1)))
        starts, ends = np.where(transitions == 1)[0], np.where(transitions == -1)[0]
        current, first = [], 0
        for left, right in zip(starts, ends):
            left, right = int(left), int(right)
            index = len(parent)
            parent.append(index)
            bounds.append([left, y, right, y + 1])
            areas.append(right - left)
            while first < len(previous) and previous[first][1] < left:
                first += 1
            for old_left, old_right, old_index in previous[first:]:
                if old_left > right:
                    break
                if old_right >= left:
                    parent[find(old_index)] = find(index)
            current.append((left, right, index))
        previous = current
    groups = {}
    for index, box in enumerate(bounds):
        root = find(index)
        if root not in groups:
            groups[root] = [*box, areas[index]]
        else:
            merged = groups[root]
            merged[0], merged[1] = min(merged[0], box[0]), min(merged[1], box[1])
            merged[2], merged[3] = max(merged[2], box[2]), max(merged[3], box[3])
            merged[4] += areas[index]
    return groups.values()


def component_frames(alpha, cols, rows, names):
    mask = alpha >= ALPHA_THRESHOLD
    height, width = alpha.shape
    grouped = [[] for _ in names]
    for x, y, right, bottom, area in connected_bounds(mask):
        if area < MIN_COMPONENT_AREA:
            continue
        col = min(cols - 1, int((x + right) / 2 * cols / width))
        row = min(rows - 1, int((y + bottom) / 2 * rows / height))
        grouped[row * cols + col].append((x, y, right, bottom))
    frames = []
    for name, boxes in zip(names, grouped):
        if not boxes:
            continue
        x = max(0, min(box[0] for box in boxes) - 3)
        y = max(0, min(box[1] for box in boxes) - 3)
        right = min(width, max(box[2] for box in boxes) + 3)
        bottom = min(height, max(box[3] for box in boxes) + 3)
        frames.append({"state": name, "x": x, "y": y, "width": right - x, "height": bottom - y})
    return frames


def make_atlas(path, properties, alpha):
    atlas_path = path.with_suffix(".atlas.json")
    if ".generated" in path.stem:
        atlas_path = path.with_name(path.stem.replace(".generated", "") + ".atlas.json")
    if atlas_path.exists() or alpha is None:
        return
    if path.stem == "tren":
        width, height = properties["width"], properties["height"]
        frames = [
            {"state": "locomotora (mira a la izquierda)", "x": 0, "y": 0, "width": width // 2, "height": height // 2},
            {"state": "vagón", "x": width // 2, "y": 0, "width": width - width // 2, "height": height // 2},
            {"state": "vía", "x": 0, "y": height // 2, "width": int(width * 0.62), "height": height - height // 2},
            {"state": "tren para mapa", "x": int(width * 0.65), "y": height // 2, "width": width - int(width * 0.65), "height": height - height // 2},
        ]
    elif path.stem == "piramide":
        y, x = np.where(alpha >= ALPHA_THRESHOLD)
        frames = [{"state": "pirámide", "x": int(x.min()), "y": int(y.min()), "width": int(x.max() - x.min() + 1), "height": int(y.max() - y.min() + 1)}]
    elif path.stem in SHEETS:
        cols, rows, names = SHEETS[path.stem]
        frames = component_frames(alpha, cols, rows, names)
    else:
        return
    atlas = {"image": path.name, **properties, "frames": frames,
             "coordinates": "Rectángulos fuente en píxeles; no redimensionan ni modifican el PNG.",
             "qa": "Recortes calculados por componentes alpha y posición esperada; la galería permite comprobar cada región. Mantener escala fija por animación."}
    atlas_path.write_text(json.dumps(atlas, ensure_ascii=False, indent=2), encoding="utf-8")


def catalog_entry(path, category):
    properties, alpha = read_properties(path)
    if category != "actualizados":
        make_atlas(path, properties, alpha)
    atlas_path = path.with_suffix(".atlas.json")
    if ".generated" in path.stem:
        atlas_path = path.with_name(path.stem.replace(".generated", "") + ".atlas.json")
    entry = {"id": path.stem, "category": category,
             "image": path.relative_to(ROOT).as_posix(), **properties}
    if category in GROUPS:
        public = PROJECT / "public" / "assets" / GROUPS[category] / path.name
        webp = public.with_suffix(".webp")
        entry["runtime"] = (webp if webp.exists() else public).relative_to(PROJECT).as_posix()
    if atlas_path.exists():
        entry["atlas"] = atlas_path.relative_to(ROOT).as_posix()
        entry["metadata"] = json.loads(atlas_path.read_text(encoding="utf-8-sig"))
    prompt = path.with_suffix(".prompt.txt")
    if ".generated" in path.stem:
        prompt = path.with_name(path.stem.replace(".generated", "") + ".prompt.txt")
    if category == "actualizados" and path.stem in ["jefe", "jefe_grande", "jaguar_titulo"]:
        prompt = path.parent / "prompts" / {"jefe": "boss_sheet.txt", "jefe_grande": "boss_portrait.txt", "jaguar_titulo": "title.txt"}[path.stem]
    if prompt.exists():
        entry["prompt"] = prompt.relative_to(ROOT).as_posix()
    if category == "paisajes":
        entry["notes"] = "Panorama opaco; repetición sin costura no garantizada."
    if category == "actualizados":
        entry["notes"] = "Hoja actualizada: usar sus recortes; revisar compatibilidad antes de sustituir sprites del motor."
    return entry


def write_catalog():
    entries = []
    missing = []
    for category, ids in EXPECTED.items():
        for asset_id in ids:
            path = ROOT / "nuevos" / category / f"{asset_id}.png"
            if path.exists():
                entries.append(catalog_entry(path, category))
            else:
                missing.append(f"{category}/{asset_id}")
    for name in ["jugador", "coati.generated", "erizo.generated", "jefe", "jefe_grande", "jaguar_titulo"]:
        path = ROOT / "actualizados" / f"{name}.png"
        if path.exists():
            entries.append(catalog_entry(path, "actualizados"))
    payload = {"generator": "image_gen integrado", "scope": "Arte y animaciones; mecánicas programadas por separado", "assets": entries, "missing": missing}
    (ROOT / "catalogo.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    template = (ROOT / "galeria.template.html").read_text(encoding="utf-8")
    embedded = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    (ROOT / "galeria.html").write_text(template.replace("__CATALOG__", embedded), encoding="utf-8")
    print(f"Catálogo: {len(entries)} imágenes. Pendientes: {len(missing)}.")
    if missing:
        print(", ".join(missing))


if __name__ == "__main__":
    write_catalog()
