"""Comprueba la galería y captura el arte integrado con un servidor Vite activo."""

import json
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright


output = Path(__file__).resolve().parent / "verificacion"
output.mkdir(exist_ok=True)
errors = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((Path(__file__).resolve().parent / "galeria.html").as_uri())
    page.wait_for_load_state("networkidle")
    # Cargamos las hojas diferidas para detectar rutas rotas también fuera de pantalla.
    page.locator(".preview").evaluate_all("images => images.forEach(image => image.loading = 'eager')")
    page.wait_for_function("Array.from(document.querySelectorAll('.preview')).every(image => image.complete && image.naturalWidth > 0)")
    assert page.locator(".card").count() > 0
    page.locator("#search").fill("objetos")
    page.get_by_role("button", name="Ver hoja").first.click()
    page.locator("dialog[open]").wait_for()
    page.locator("#frame").select_option(index=1)
    page.screenshot(path=str(output / "galeria-objetos.png"))
    page.get_by_role("button", name="Cerrar").click()
    page.locator("#search").fill("")
    page.screenshot(path=str(output / "galeria.png"))
    page.goto(os.environ.get("TEMAYIN_QA_URL", "http://127.0.0.1:5173"))
    page.wait_for_load_state("networkidle")
    title_image = page.get_by_alt_text("Temayin, el jaguar aventurero")
    title_image.wait_for()
    assert title_image.evaluate("image => image.complete && image.naturalWidth > 0")
    page.screenshot(path=str(output / "titulo.png"))
    page.get_by_role("button", name="Jugar", exact=True).click()
    level = page.get_by_role("button").filter(has_text="1-1").first
    level.click()
    # La campaña actual abre una cinemática antes de la primera partida.
    skip = page.get_by_role("button", name=re.compile("^Saltar"))
    if skip.count():
        skip.click()
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
