"""Revisa las 39 fichas, fotos locales, accesibilidad y bloqueos en Chromium emulado."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')
OUTPUT = Path('imagenes/.temp/fichas-estaciones/revision')
ERRORS = []
RESULTS = []


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def open_map(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.locator('.level-map-menu:not([inert])').wait_for()


def selected(page, level_id):
    page.locator(f'[data-station-info="{level_id}"]').wait_for()
    page.wait_for_function('''id => {
      const image = document.querySelector(`[data-station-info="${id}"] img`);
      return image && image.complete && image.naturalWidth > 0;
    }''', arg=level_id, timeout=15000)
    check(page.locator('.map-itinerary__scroll').evaluate('(e) => e.scrollTop') == 0,
          'La ficha vuelve al inicio al seleccionar un destino')


def fixture(page, mode):
    page.evaluate('''async mode => {
      const loaded = path => performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname === path).at(-1)?.name ?? path;
      const { ALL_LEVELS, WORLDS } = await import(loaded('/src/data/worlds.ts'));
      const { useAppStore } = await import(loaded('/src/store/appStore.ts'));
      const levels = mode === 'migrado' ? { '5-3': { stars: 2, bestScore: 1200, completions: 1 } }
        : Object.fromEntries(ALL_LEVELS.map(level => [level.id, { stars: 2, bestScore: 1200, completions: 1 }]));
      localStorage.setItem('temayin:v3', JSON.stringify({ progress: { levels, tickets: mode === 'completo' ? WORLDS.map(world => world.id) : [] },
        settings: { ...useAppStore.getState().settings, introSeen: true }, wallet: { cacao: 150, pending: {} } }));
    }''', mode)
    open_map(page)


def fresh_checks(page):
    initial = page.evaluate("localStorage.getItem('temayin:v3')")
    page.locator('[data-station="1-1"]').click()
    selected(page, '1-1')
    page.screenshot(path=str(OUTPUT / 'palenque-escritorio.png'))
    page.locator('.station-info__more summary').click()
    check(page.locator('.station-info__more').get_attribute('open') is not None, 'Se expanden los datos adicionales')
    page.locator('.map-itinerary__stops button').nth(1).click()
    selected(page, '1-2')
    check(page.get_by_role('button', name='Estación bloqueada').is_disabled(), 'Se conserva el bloqueo de jugar')
    check(page.locator('.station-info__more').get_attribute('open') is None, 'Se reinicia la expansión al cambiar de ficha')
    check(page.locator('h3:focus').inner_text() == 'Boca del Cerro', 'El teclado conserva un foco visible en la nueva ficha')
    check(page.locator('.map-itinerary .level-tile').inner_text().find('Destino secreto') >= 0, 'El secreto permanece oculto')
    page.keyboard.press('Escape')
    check(page.locator('.map-panel').is_hidden(), 'Escape cierra la ficha')
    check(page.get_by_role('button', name='Estaciones', exact=True).evaluate('(e) => e === document.activeElement'), 'El cierre devuelve el foco')
    check(page.evaluate("localStorage.getItem('temayin:v3')") == initial, 'Consultar las fichas no escribe el progreso')
    RESULTS.append('Partida nueva: fichas bloqueadas legibles, expansión, selección, foco, Escape, secreto y progreso intactos.')


def campaign_checks(page):
    fixture(page, 'completo')
    saved = page.evaluate("localStorage.getItem('temayin:v3')")
    counts = [6, 7, 5, 5, 6, 6, 4]
    for world, count in enumerate(counts, 1):
        page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').nth(world - 1).click()
        for index in range(count):
            level_id = f'{world}-{index + 1}'
            page.locator('.map-itinerary__stops button').nth(index).click()
            selected(page, level_id)
            check(page.locator('.station-photo__credit a').count() == 2, 'Cada fotografía muestra autor y licencia')
            check(page.locator('.station-info__source').first.get_attribute('href').startswith('https://www.trenmaya.gob.mx/'), 'Se muestra la referencia cultural')
            check(page.locator('.map-departure .btn').is_enabled(), 'Los récords conservan acceso al nivel')
        page.screenshot(path=str(OUTPUT / f'mundo-{world}.png'))
    check(page.evaluate("localStorage.getItem('temayin:v3')") == saved, 'La consulta completa no altera el guardado')
    RESULTS.append('Campaña: 39 fichas con fotografía local cargada, autor, licencia, datos y enlaces culturales.')


def responsive_checks(browser):
    for width, height in [(390, 844), (320, 740), (844, 390)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True,
                                      is_mobile=True, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: ERRORS.append(str(error)))
        open_map(page)
        page.locator('[data-station="1-1"]').tap()
        selected(page, '1-1')
        button = page.locator('.map-departure .btn')
        before = button.bounding_box()
        page.locator('.map-itinerary__scroll').evaluate('(e) => e.scrollTop = e.scrollHeight')
        after = button.bounding_box()
        check(before == after, 'El botón Jugar permanece fijo al desplazar la ficha')
        check(after['y'] + after['height'] <= height, 'El botón de salida cabe en pantalla')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Sin desbordamiento horizontal')
        page.locator('.map-itinerary__stops button').nth(1).tap()
        selected(page, '1-2')
        page.screenshot(path=str(OUTPUT / f'movil-{width}x{height}.png'))
        context.close()
    RESULTS.append('Móvil táctil emulado: 390×844, 320×740 y 844×390; selección, desplazamiento y salida fija.')


def resilience_checks(page):
    fixture(page, 'migrado')
    page.get_by_role('button', name='Estaciones', exact=True).click()
    page.locator('.map-itinerary__stops button').nth(2).click()
    selected(page, '5-3')
    check(page.locator('.map-departure .btn').is_enabled(), 'El récord aislado sigue siendo jugable')
    check(page.locator('[data-cloud-world]').count() == 5, 'No revela mundos intermedios')
    fixture(page, 'completo')
    page.route('**/assets/estaciones/6-5.webp', lambda route: route.abort())
    page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').nth(5).click()
    page.locator('.map-itinerary__stops button').nth(4).click()
    page.get_by_text('Fotografía no disponible.', exact=False).wait_for()
    check(page.locator('.station-info__toh').is_visible(), 'Un fallo de imagen conserva la información')
    page.unroute('**/assets/estaciones/6-5.webp')
    page.locator('.map-itinerary__stops button').nth(3).click()
    page.locator('.map-itinerary__stops button').nth(4).click()
    selected(page, '6-5')
    page.route('https://**/*', lambda route: route.abort())
    page.locator('.map-itinerary__stops button').nth(0).click()
    selected(page, '6-1')
    page.unroute('https://**/*')
    page.locator('.map-departure .btn').click()
    page.locator('.game').wait_for()
    RESULTS.append('Récord aislado conservado; foto fallida recuperable, lectura con terceros bloqueados y entrada real a Tulum.')


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        page.set_default_timeout(15000)
        page.on('pageerror', lambda error: ERRORS.append(str(error)))
        open_map(page)
        fresh_checks(page)
        print('Partida nueva: OK', flush=True)
        campaign_checks(page)
        print('39 fichas y fotos: OK', flush=True)
        responsive_checks(browser)
        print('Tres tamaños táctiles: OK', flush=True)
        resilience_checks(page)
        browser.close()
    check(not ERRORS, f'Errores de JavaScript: {ERRORS}')
    (OUTPUT / 'resultados.json').write_text(json.dumps({'pruebas': RESULTS, 'errores': ERRORS}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'pruebas': len(RESULTS), 'errores': ERRORS}, ensure_ascii=True))


if __name__ == '__main__':
    main()
