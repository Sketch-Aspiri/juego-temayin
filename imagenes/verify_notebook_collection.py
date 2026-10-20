"""Revisa las cien recogidas, imágenes, lecturas y persistencia en Chromium aislado."""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright
from verify_explorer_notebook import INSTALL, URL, collect, opened, ready_art, start

OUTPUT = Path('imagenes/.temp/cuaderno-100')
ERRORS = []


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def catalog(page):
    return page.evaluate('''async () => {
      const { NOTEBOOK_ENTRIES } = await import('/src/data/explorerNotebook/index.ts');
      const { WORLDS } = await import('/src/data/worlds.ts');
      qa.store.setState({ progress: { ...qa.store.getState().progress, tickets: WORLDS.map(world => world.id) } });
      return NOTEBOOK_ENTRIES.map(({id, levelId, place, format}) => ({id, levelId, place, format}));
    }''')


def collect_all(page, entries):
    by_level = {}
    for entry in entries:
        by_level.setdefault(entry['levelId'], []).append(entry['id'])
    for level_id, ids in by_level.items():
        start(page, level_id)
        for entry_id in ids:
            collect(page, entry_id)
        if level_id in ['1-2', '1-extra', '7-extra']:
            page.screenshot(path=str(OUTPUT / f'plumas-{level_id}.png'))
        page.evaluate('qa.store.getState().go("levels")')
        page.locator('.level-map-menu:not([inert])').wait_for()
        print(f'{level_id}: {len(ids)} páginas recogidas', flush=True)
    check(page.evaluate('qa.store.getState().progress.discoveries.length') == 100, 'Las cien páginas se guardan por contacto')


def read_all(page, entries):
    page.locator('.map-dock').get_by_role('button', name='Cuaderno de Toh', exact=False).click()
    opened(page)
    photos = numerals = 0
    for entry in entries:
        page.locator(f'[data-discovery="{entry["id"]}"]').click()
        page.locator(f'[data-notebook-page="{entry["id"]}"]').wait_for()
        if entry['place'] == 'Códice maya':
            check(page.locator('.notebook-numerals svg[role="img"]').count() == 1, entry['id'])
            numerals += 1
        else:
            page.wait_for_function('document.querySelector(".notebook-page .station-photo img")?.naturalWidth > 0')
            check(page.locator('.notebook-page .station-photo__credit').inner_text().startswith('Foto:'), entry['id'])
            photos += 1
        if entry['id'] in ['boca-farallones', 'tenabo-tejidos', 'felipe-mayapax', 'codice-cuarenta-tres', 'codice-haab']:
            ready_art(page)
            page.screenshot(path=str(OUTPUT / f'pagina-{entry["id"]}.png'))
    check(photos == 78 and numerals == 22, '78 fotografías y 22 ilustraciones del códice')
    check(page.locator('progress[aria-label="Descubrimientos registrados"]').get_attribute('max') == '100', 'Contador total de cien')
    check(page.locator('progress[aria-label="Descubrimientos registrados"]').get_attribute('value') == '100', 'Colección completa')
    page.keyboard.press('Escape')
    return photos, numerals


def reload_and_mobile(browser, page):
    saved = page.evaluate('localStorage.getItem("temayin:v3")')
    page.reload()
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    opened(page)
    check(page.locator('[data-discovery]:disabled').count() == 0, 'Recarga conserva las cien páginas')
    check(page.locator('.notebook-entry em').count() == 0, 'Recarga conserva las cien lecturas')
    for width, height in [(390, 844), (320, 740), (844, 390)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True,
                                      is_mobile=True, reduced_motion='reduce')
        mobile = context.new_page()
        mobile.on('pageerror', lambda error: ERRORS.append(str(error)))
        mobile.goto(URL)
        mobile.evaluate('saved => localStorage.setItem("temayin:v3", saved)', saved)
        mobile.reload()
        mobile.wait_for_load_state('networkidle')
        mobile.get_by_role('button', name='Cuaderno de Toh', exact=True).tap()
        for entry_id in ['tenabo-tejidos', 'codice-cuarenta-tres']:
            mobile.locator(f'[data-discovery="{entry_id}"]').tap()
            mobile.locator(f'[data-notebook-page="{entry_id}"]').wait_for()
            ready_art(mobile)
            visual = '.notebook-numerals' if entry_id.startswith('codice-') else '.notebook-page .station-photo'
            mobile.locator(visual).scroll_into_view_if_needed()
            check(mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Lectura sin desbordamiento')
            mobile.screenshot(path=str(OUTPUT / f'{entry_id}-{width}x{height}.png'))
            if width <= 600:
                mobile.get_by_role('button', name='Ver páginas', exact=False).tap()
        mobile.get_by_role('button', name='Cerrar cuaderno', exact=True).tap()
        check(mobile.locator('dialog').count() == 0, 'Cierre táctil')
        context.close()
    return saved


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
        page.on('pageerror', lambda error: ERRORS.append(str(error)))
        page.goto(URL)
        page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
        opened(page)
        check(page.locator('[data-discovery]:disabled').count() == 100, 'Cien páginas pendientes al iniciar')
        page.screenshot(path=str(OUTPUT / 'coleccion-inicial.png'))
        page.keyboard.press('Escape')
        page.evaluate(INSTALL)
        entries = catalog(page)
        collect_all(page, entries)
        photos, numerals = read_all(page, entries)
        saved = reload_and_mobile(browser, page)
        (OUTPUT / 'guardado-qa.json').write_text(saved, encoding='utf-8')
        check(len(json.loads(saved)['progress']['readDiscoveries']) == 100, 'Cien lecturas persistidas')
        browser.close()
    check(not ERRORS, str(ERRORS))
    report = {'pages': len(entries), 'photos': photos, 'numerals': numerals, 'errors': ERRORS,
              'scope': 'Cien aproximaciones preparadas por contacto con física y oxígeno activos; tres tamaños táctiles emulados. No mide dificultad humana ni sustituye un teléfono físico.'}
    (OUTPUT / 'revision.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
