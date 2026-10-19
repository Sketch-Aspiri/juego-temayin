"""Verifica el selector real con perfiles locales de QA, teclado y pantallas táctiles."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')
OUTPUT = Path('imagenes/verificacion/mapa-peninsula')
OUTPUT.mkdir(parents=True, exist_ok=True)


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def screenshot(page, name):
    page.screenshot(path=str(OUTPUT / name), animations='disabled')


def open_map(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.locator('.atlas').wait_for()
    page.locator('.level-map-menu:not([inert])').wait_for()


def curtain_frame(page, fraction, name):
    page.locator('.map-curtain__bank').evaluate_all('''(banks, fraction) => banks.forEach(bank => {
      const animation = bank.getAnimations()[0];
      animation.pause();
      animation.currentTime = animation.effect.getTiming().duration * fraction;
    })''', fraction)
    page.screenshot(path=str(OUTPUT / name))


def animation_checks(page, results):
    page.get_by_role('button', name='← Volver', exact=True).click()
    check(page.locator('.level-map-menu').get_attribute('inert') is not None, 'Bloquea entradas al cubrir el mapa')
    curtain_frame(page, .5, 'nubes-cerrando.png')
    curtain_frame(page, 1, 'nubes-cierre-completo.png')
    page.get_by_role('button', name='Jugar', exact=True).wait_for()
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.locator('.atlas').wait_for()
    curtain_frame(page, 0, 'nubes-apertura-cubierta.png')
    curtain_frame(page, .5, 'nubes-abriendo.png')
    curtain_frame(page, 1, 'nubes-mapa-revelado.png')
    page.locator('.level-map-menu:not([inert])').wait_for()
    results.append('Cortina completa de nubes al entrar y salir: fotogramas cerrado, intermedio y abierto; entradas bloqueadas durante la transición.')


def fixture(page, mode):
    page.evaluate('''async mode => {
      const { useAppStore } = await import('/src/store/appStore.ts');
      const { ALL_LEVELS, WORLDS } = await import('/src/data/worlds.ts');
      const state = useAppStore.getState();
      const levels = mode === 'migrado' ? { '5-3': { stars: 2, bestScore: 1200, completions: 1 } }
        : Object.fromEntries((mode === 'completo' ? ALL_LEVELS : WORLDS[0].levels).map(level =>
          [level.id, { stars: 2, bestScore: 1200, completions: 1 }]));
      localStorage.setItem('temayin:v3', JSON.stringify({
        progress: { levels, tickets: mode === 'completo' ? WORLDS.map(world => world.id) : [] },
        settings: { ...state.settings, introSeen: true }, wallet: { cacao: 150, pending: {} }
      }));
    }''', mode)
    open_map(page)


def fresh_checks(page, results):
    check(page.locator('[data-cloud-world]').count() == 6, 'Cinco mundos futuros y Calakmul bajo nubes')
    check(page.locator('.atlas-pin--lit').count() == 1, 'Solo Palenque está iluminado')
    page.locator('[data-station="1-2"]').click()
    check(page.get_by_role('button', name='Estación bloqueada').is_disabled(), 'No permite jugar un nivel bloqueado')
    page.get_by_role('button', name='+ Acercar al tramo').click()
    check(page.locator('.atlas').get_attribute('data-map-view') == 'tramo', 'Acercamiento al tramo')
    screenshot(page, 'tramo-inicial.png')
    page.locator('[data-station="1-1"]').click()
    page.get_by_role('button', name='Jugar 1-1 →').click()
    page.locator('.intro-stage').wait_for()
    page.evaluate("async () => (await import('/src/store/appStore.ts')).useAppStore.getState().go('levels')")
    page.locator('.atlas').wait_for()
    results.append('Partida nueva: iluminación, nubes, bloqueo, zoom y entrada al prólogo de Palenque.')


def progress_checks(page, results):
    fixture(page, 'mundo2')
    check(page.locator('[data-cloud-world="golfo-campeche"]').count() == 0, 'Mundo 2 despejado')
    check(page.locator('[data-cloud-world="yucatan-haciendas"]').count() == 1, 'Mundo 3 sigue cubierto')
    check(page.locator('.atlas__train').get_attribute('aria-label') == 'Tren en Carrillo Puerto', 'Tren en el siguiente destino')
    screenshot(page, 'mundo2-descubierto.png')
    results.append('Tras Escárcega: se retiran las nubes del Mundo 2 y el tren aparece en Carrillo Puerto.')
    fixture(page, 'migrado')
    check(page.locator('[data-station="5-3"]').count() == 1, 'Récord propio revela su mundo')
    check(page.locator('[data-cloud-world="golfo-campeche"]').count() == 1, 'No desbloquea mundos intermedios')
    results.append('Guardado con récord aislado de Playa del Carmen: conserva acceso y bloqueos intermedios.')
    fixture(page, 'completo')
    check(page.locator('[data-cloud-world]').count() == 1, 'Solo Calakmul futuro mantiene nubes')
    check(page.locator('.atlas-pin--lit').count() == 35, 'Todas las estaciones de campaña encendidas')
    screenshot(page, 'campana-descubierta.png')
    page.locator('.atlas').screenshot(path=str(OUTPUT / 'peninsula-completa.png'))
    for number in range(1, 7):
        page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').nth(number - 1).click()
        if page.locator('.map-panel').get_attribute('hidden') is not None:
            page.get_by_role('button', name='Estaciones', exact=True).click()
        check(page.locator('.map-itinerary .level-tile').is_enabled(), f'Secreto del Mundo {number} accesible')
        screenshot(page, f'tramo-{number}.png')
    page.locator('.map-itinerary .level-tile').click()
    page.locator('.game').wait_for()
    page.evaluate("async () => (await import('/src/store/appStore.ts')).useAppStore.getState().go('levels')")
    page.locator('.atlas').wait_for()
    page.locator('.level-map-menu:not([inert])').wait_for()
    results.append('Seis tramos, seis boletos y acceso real al secreto del Mundo 6.')


def responsive_checks(page, results):
    for width, height in [(390, 844), (320, 740), (844, 390)]:
        page.set_viewport_size({'width': width, 'height': height})
        if page.locator('.map-panel').get_attribute('hidden') is None:
            page.get_by_role('button', name='Cerrar itinerario').click()
        screenshot(page, f'movil-{width}x{height}.png')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Sin desborde horizontal')
        bounds = page.locator('.atlas').bounding_box()
        check(abs(bounds['width'] - width) < 1 and abs(bounds['height'] - height) < 1, 'Mapa a pantalla completa')
        for selector, minimum in [('.menu__stars', 28), ('.menu__wallet', 19)]:
            check(page.locator(selector).evaluate('(element) => parseFloat(getComputedStyle(element).fontSize)') >= minimum, 'Estrellas y cacao grandes')
        page.get_by_role('button', name='+ Acercar al tramo').click()
        check(page.locator('.atlas').get_attribute('data-map-view') == 'tramo', 'Zoom en móvil')
        page.get_by_role('button', name='− Ver península').click()
        page.get_by_role('button', name='Estaciones', exact=True).click()
        screenshot(page, f'itinerario-{width}x{height}.png')
    page.emulate_media(reduced_motion='reduce')
    check(page.locator('.atlas__train').evaluate('(element) => getComputedStyle(element).transitionDuration') == '0s', 'Respeta movimiento reducido')
    world_button = page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').nth(2)
    world_button.focus()
    page.keyboard.press('Enter')
    check(page.locator('.map-itinerary__heading h3').inner_text() == 'Yucatán de las haciendas', 'Selección de mundo por teclado')
    page.locator('.map-itinerary__stops button').nth(3).focus()
    page.keyboard.press('Enter')
    check(page.locator('.map-departure h4').inner_text() == 'Teya', 'Selección de estación por teclado')
    page.get_by_role('button', name='← Volver', exact=True).click()
    page.get_by_role('button', name='Jugar', exact=True).wait_for()
    check(page.locator('.map-curtain').count() == 0, 'Cierre inmediato con movimiento reducido')
    results.append('320/390 px vertical y 844 px horizontal: mapa a pantalla completa, textos y saldos grandes, zoom, itinerario, movimiento reducido y teclado.')


def touch_checks(browser, state, results):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, storage_state=state)
    page = context.new_page()
    open_map(page)
    page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').nth(4).tap()
    page.locator('[data-station="5-3"]').tap()
    check(page.locator('.map-departure h4').inner_text() == 'Playa del Carmen', 'Toque sobre punto geográfico')
    page.get_by_role('button', name='Jugar 5-3 →').tap()
    page.locator('.game').wait_for()
    context.close()
    results.append('Emulación táctil de Chromium: cambio de mundo, selección de punto y entrada a Playa del Carmen mediante toques.')


def main():
    results, errors = [], []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1080})
        page.on('pageerror', lambda error: errors.append(str(error)))
        open_map(page)
        animation_checks(page, results)
        screenshot(page, 'inicial.png')
        fresh_checks(page, results)
        progress_checks(page, results)
        responsive_checks(page, results)
        touch_checks(browser, page.context.storage_state(), results)
        check(not errors, f'Errores de navegador: {errors}')
        browser.close()
    (OUTPUT / 'informe.json').write_text(json.dumps({'comprobaciones': results, 'errores': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
