"""Exporta sin pérdidas el atlas generado y mide sus dieciséis siluetas sin recortarlas."""
import json
from pathlib import Path
from collections import deque
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "imagenes/nuevos/personajes/temayin-hanal-movimientos.png"
TARGET = ROOT / "public/assets/temporada/hanal-pixan/temayin-movimientos.webp"
IDS = ["idle1", "idle2", "run1", "run2", "run3", "run4", "jump", "fall",
       "land", "throw", "hang", "swing", "swim1", "swim2", "death", "win"]
# Anclas anatómicas medidas sobre el original: pies, manos o centro del nadador.
ANCHORS = [(205, 305), (514, 305), (828, 293), (1138, 293),
           (204, 609), (519, 570), (806, 604), (1137, 606),
           (212, 900), (500, 900), (795, 625), (1102, 627),
           (186, 1112), (495, 1112), (800, 1210), (1135, 1240)]
HEAD_WIDTHS = [184, 185, 181, 180, 179, 190, 181, 174, 177, 166, 160, 160, 165, 165, 180, 175]
ALPHA_MIN = 8
MIN_BODY_PIXELS = 8000


def silhouettes(image):
    mask = np.asarray(image)[:, :, 3] >= ALPHA_MIN
    height, width = mask.shape
    boxes = []
    for y in range(height):
        for x in np.flatnonzero(mask[y]):
            if not mask[y, x]:
                continue
            queue = deque([(int(x), y)])
            mask[y, x] = False
            left = right = int(x)
            top = bottom = y
            area = 0
            while queue:
                px, py = queue.popleft()
                area += 1
                left, right = min(left, px), max(right, px)
                top, bottom = min(top, py), max(bottom, py)
                for nx, ny in [(px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)]:
                    if 0 <= nx < width and 0 <= ny < height and mask[ny, nx]:
                        mask[ny, nx] = False
                        queue.append((nx, ny))
            if area >= MIN_BODY_PIXELS:
                boxes.append([left, top, right + 1, bottom + 1])
    # La posición real manda: no se corta una mano por asumir celdas perfectas.
    boxes.sort(key=lambda b: (int(((b[1] + b[3]) / 2) / (height / 4)), b[0]))
    return boxes


def main():
    image = Image.open(SOURCE).convert("RGBA")
    boxes = silhouettes(image)
    assert len(boxes) == len(IDS), boxes
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    image.save(TARGET, lossless=True, exact=True)
    restored = np.asarray(Image.open(TARGET).convert("RGBA"))
    assert np.array_equal(np.asarray(image), restored), "La exportacion debe ser sin perdidas"
    frames = {}
    for index, (name, box) in enumerate(zip(IDS, boxes)):
        x, y, right, bottom = box
        frames[name] = {"x": x, "y": y, "w": right - x, "h": bottom - y,
                        "ax": ANCHORS[index][0], "ay": ANCHORS[index][1] if 10 <= index <= 13 else bottom,
                        "headWidth": HEAD_WIDTHS[index]}
    atlas = {"file": str(TARGET.relative_to(ROOT / "public/assets")).replace("\\", "/"),
             "width": image.width, "height": image.height, "frames": frames}
    TARGET.with_suffix(".atlas.json").write_text(json.dumps(atlas, indent=2) + "\n", encoding="utf-8")
    lines = ["import type { AtlasFrame } from '../engine/render/enemies/atlas';", "",
             "/** Recortes completos y anclas medidos por imagenes/import_hanal_motion.py. */",
             "export const HANAL_MOTION_FILE = 'temporada/hanal-pixan/temayin-movimientos.webp';",
             "export interface HanalMotionFrame extends AtlasFrame { readonly headWidth: number }",
             "export const HANAL_MOTION_FRAMES = {"]
    for name, frame in frames.items():
        props = ", ".join(f"{key}: {value}" for key, value in frame.items())
        lines.append(f"  {name}: {{ {props} }},")
    lines.extend(["} as const satisfies Readonly<Record<string, HanalMotionFrame>>;",
                  "export type HanalMotionId = keyof typeof HANAL_MOTION_FRAMES;", ""])
    (ROOT / "src/data/hanalPixanPlayer.ts").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps(atlas, indent=2))


if __name__ == "__main__":
    main()
