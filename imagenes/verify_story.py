"""Revisa las seis expresiones de Temayin dentro de la historia real."""

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


OUTPUT = Path(__file__).resolve().parent / "verificacion" / "historia"
EXPRESSIONS = ["alegre", "carinoso", "sorprendido", "preocupado", "decidido", "atento"]
OUTPUT.mkdir(parents=True, exist_ok=True)
errors = []
report = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for label, width, height in [("escritorio", 1280, 800), ("movil", 844, 390)]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(os.environ.get("TEMAYIN_QA_URL", "http://127.0.0.1:5173"))
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="Historia", exact=True).click()
        page.get_by_role("button", name="Ver: El eclipse de Camazotz", exact=True).click()
        for index, expression in enumerate(EXPRESSIONS):
            page.get_by_label(f"Escena {index + 1} de 6").wait_for()
            actor = page.locator(f'.intro-actor .intro-sprite[style*="temayin-{expression}.webp"]')
            actor.wait_for()
            loaded = actor.evaluate("""async element => {
                const source = getComputedStyle(element).backgroundImage.slice(5, -2);
                const image = new Image(); image.src = source;
                await image.decode();
                return image.naturalWidth > 0 && image.naturalHeight > 0;
            }""")
            assert loaded, expression
            page.wait_for_timeout(1300)
            actor_box = actor.bounding_box()
            caption_box = page.locator(".intro-caption").bounding_box()
            # La zona del rostro debe quedar por encima de la cartela también en móvil.
            assert actor_box["y"] + actor_box["height"] * 0.47 < caption_box["y"], expression
            page.screenshot(path=str(OUTPUT / f"{label}-{index + 1}-{expression}.png"))
            report.append({"viewport": label, "scene": index + 1, "expression": expression, "loaded": loaded})
            if index < len(EXPRESSIONS) - 1:
                page.keyboard.press("Enter")
        page.get_by_role("button", name="Volver a Historia", exact=True).click()
        page.get_by_role("button", name="← Volver al menú", exact=True).click()
        page.get_by_role("button", name="Historia", exact=True).wait_for()
        page.close()
    browser.close()

(OUTPUT / "revision.json").write_text(json.dumps({"scenes": report, "errors": errors}, ensure_ascii=False, indent=2), encoding="utf-8")
assert not errors, errors
print(f"Historia revisada en escritorio y móvil: 12 escenas, sin errores. Capturas: {OUTPUT}")
