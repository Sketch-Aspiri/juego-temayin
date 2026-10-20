"""Revisa el arte del cuaderno sobre un build estable, sin recargas de Vite."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

import verify_explorer_notebook as qa

qa.URL = os.environ.get('TEMAYIN_NOTEBOOK_ART_URL', 'http://127.0.0.1:5195')
qa.OUTPUT = Path('imagenes/.temp/cuaderno-pergamino')
IDS = ['palenque-palacio', 'palenque-saraguatos', 'palenque-orquideas', 'campeche-muralla',
       'campeche-baluartes', 'campeche-puertas', 'bacalar-laguna', 'bacalar-estromatolitos', 'bacalar-fuerte']


def desktop_checks(page):
    page.goto(qa.URL)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    qa.opened(page)
    page.wait_for_function('Array.from(document.querySelectorAll(".notebook-toh__image")).every(image => image.complete && image.naturalWidth > 0)')
    qa.check(page.locator('.notebook-header .notebook-toh__image').is_visible(), 'Retrato del encabezado cargado')
    qa.check(page.locator('.notebook-cover .notebook-toh__image').is_visible(), 'Toh de cuerpo entero en portada')
    qa.check(page.locator('.station-photo img').count() == 0, 'Las páginas pendientes no cargan fotos')
    qa.check(page.evaluate('getComputedStyle(document.querySelector(".notebook")).borderImageSource.includes("pergamino.webp")'), 'Marco ilustrado de nueve zonas')
    width = page.evaluate('''async () => {
      const source = getComputedStyle(document.querySelector('.notebook')).borderImageSource;
      const image = new Image(); image.src = source.slice(5, -2);
      await image.decode(); return image.naturalWidth;
    }''')
    qa.check(width == 1536, 'Textura del pergamino decodificada desde su URL real en producción')
    page.screenshot(path=str(qa.OUTPUT / 'portada-escritorio.png'))
    page.keyboard.press('Escape')
    page.evaluate('''ids => {
      const saved = JSON.parse(localStorage.getItem('temayin:v3')) ?? { progress: { levels: {}, tickets: [] } };
      saved.progress.discoveries = ids;
      saved.progress.readDiscoveries = [];
      localStorage.setItem('temayin:v3', JSON.stringify(saved));
    }''', IDS)
    page.reload()
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=False).click()
    for discovery_id in IDS:
        page.locator(f'[data-discovery="{discovery_id}"]').click()
        page.wait_for_function('document.querySelector(".notebook-page .station-photo img")?.naturalWidth > 0')
    page.locator('[data-discovery="bacalar-estromatolitos"]').click()
    page.screenshot(path=str(qa.OUTPUT / 'lectura-escritorio.png'))
    for _ in range(18):
        page.keyboard.press('Tab')
        qa.check(page.evaluate('document.querySelector("dialog.notebook").contains(document.activeElement)'), 'Foco dentro del cuaderno')
    page.keyboard.press('Escape')
    qa.RESULTS.append('Build estable: portada y nueve lecturas con pergamino, retratos de Toh, fotos acreditadas y foco contenido.')
    return page.evaluate('localStorage.getItem("temayin:v3")')


def main():
    qa.OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
        page.on('pageerror', lambda error: qa.ERRORS.append(str(error)))
        page.on('response', lambda response: qa.ERRORS.append(f'{response.status}: {response.url}')
                if response.status >= 400 and '/cuaderno/' in response.url else None)
        try:
            saved = desktop_checks(page)
            qa.mobile_checks(browser, saved)
            qa.art_fallback_checks(page)
        except Exception:
            page.screenshot(path=str(qa.OUTPUT / 'fallo.png'))
            raise
        browser.close()
    qa.check(not qa.ERRORS, str(qa.ERRORS))
    report = {'checks': qa.RESULTS, 'errors': qa.ERRORS, 'scope': 'Revisión visual en Chromium emulado sobre build de producción; no mide dificultad humana.'}
    (qa.OUTPUT / 'revision.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
