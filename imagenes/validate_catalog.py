"""Verifica cobertura del catálogo y que cada recorte tenga píxeles visibles."""

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf-8"))
assert not catalog["missing"], catalog["missing"]
frame_count = 0
for asset in catalog["assets"]:
    path = ROOT / asset["image"]
    with Image.open(path) as image:
        image.load()
        assert image.size == (asset["width"], asset["height"]), path
        if asset["category"] != "paisajes":
            assert "A" in image.getbands(), path
            alpha = np.asarray(image.getchannel("A"))
            assert int(alpha.min()) == 0 and int(alpha.max()) > 64, path
        else:
            alpha = None
        metadata = asset.get("metadata", {})
        frames = metadata.get("frames", [])
        if not frames:
            for key in ["run", "dead", "hit"]:
                frames.extend({"x": r[0], "y": r[1], "width": r[2], "height": r[3]} for r in metadata.get(key, []))
        for frame in frames:
            x, y, w, h = [frame[key] for key in ["x", "y", "width", "height"]]
            assert x >= 0 and y >= 0 and w > 0 and h > 0, (path, frame)
            assert x + w <= image.width and y + h <= image.height, (path, frame)
            assert alpha is None or bool(np.any(alpha[y:y+h, x:x+w] >= 8)), (path, frame)
            frame_count += 1
    assert asset.get("prompt") and (ROOT / asset["prompt"]).is_file(), path
    if asset["category"] in ["enemigos", "jefes", "personajes", "objetos", "mecanicas", "complementos"]:
        assert frames, path
        assert (ROOT.parent / asset["runtime"]).is_file(), asset["runtime"]

report = {"images": len(catalog["assets"]), "visibleFrames": frame_count,
          "missing": 0, "decoded": True, "alphaVerified": True, "sourceRectsValid": True}
(ROOT / "verificacion").mkdir(exist_ok=True)
(ROOT / "verificacion" / "catalogo-qa.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"Verificadas {report['images']} imágenes y {frame_count} recortes visibles.")
