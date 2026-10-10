"""Capture the integrated artwork in a headless browser (requires a Vite server)."""

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


output = Path(__file__).resolve().parent / "verificacion"
output.mkdir(exist_ok=True)
errors = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(os.environ.get("TEMAYIN_QA_URL", "http://127.0.0.1:5173"))
    page.wait_for_load_state("networkidle")
    title_image = page.get_by_alt("Temayin, el jaguar aventurero")
    title_image.wait_for()
    assert title_image.evaluate("image => image.complete && image.naturalWidth > 0")
    page.screenshot(path=str(output / "titulo.png"))
    page.get_by_role("button", name="Jugar", exact=True).click()
    page.get_by_role("button", name="1-1 La Selva").click()
    page.locator("canvas").wait_for()
    page.screenshot(path=str(output / "nivel-1-1.png"))
    page.keyboard.down("ArrowRight")
    page.wait_for_timeout(350)
    page.keyboard.down("Space")
    page.wait_for_timeout(180)
    page.screenshot(path=str(output / "salto.png"))
    page.keyboard.up("Space")
    page.keyboard.up("ArrowRight")
    browser.close()

(output / "browser-errors.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")
assert not errors, errors
print(f"Capturas guardadas en {output}; sin errores de JavaScript.")
