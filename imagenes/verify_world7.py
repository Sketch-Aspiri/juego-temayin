"""Recorridos y desenlace del Mundo 7 en Chromium; contacto protegido, entradas reales."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'imagenes/verificacion/mundo7'
URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')
OUTPUT.mkdir(parents=True, exist_ok=True)
errors, reports = [], []


def screenshot(page, name):
    page.evaluate('''() => {
      if (window.world7qa?.hold && world7qa.world) world7qa.world.player.inv = 0;
      const intro = document.querySelector('.boss-intro');
      if (intro) { intro.style.animation = 'none'; intro.style.opacity = '1'; }
    }''')
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    page.screenshot(path=str(OUTPUT / f'{name}.png'), animations='disabled')


def drive_level(page, level):
    page.evaluate('(id) => world7qa.start(id)', level)
    while True:
        page.wait_for_function('world7qa.pending || world7qa.world?.phase === "done" || world7qa.metrics.deaths > 0', timeout=60000)
        report = page.evaluate('world7qa.report()')
        assert report['deaths'] == 0, report
        pending = page.evaluate('world7qa.pending')
        if pending:
            screenshot(page, f'{level}-{pending}')
            if level == '7-4' and pending in ['camara-antorchas', 'rayo-y-pilares']:
                for width, height in [(390, 844), (844, 390)]:
                    page.set_viewport_size({'width': width, 'height': height})
                    screenshot(page, f'{level}-{pending}-{width}x{height}')
                page.set_viewport_size({'width': 1280, 'height': 900})
            page.evaluate('world7qa.resume()')
        if report['phase'] == 'done':
            break
    assert report['checkpoint'], report
    assert all(name in report['shots'] for name in ['inicio', 'checkpoint', 'meta']), report
    if level == '7-4':
        assert report['hp'] == 0 and report['stages'] == [1, 2, 3], report
        assert sorted(report['echoes']) == list(range(6)), report
    reports.append({key: value for key, value in report.items() if key != 'progress'})


def ticket_checks(page):
    page.evaluate('world7qa.prepareTicket()')
    page.wait_for_function('world7qa.pending === "boleto-recogido"', timeout=30000)
    screenshot(page, 'boleto-camino-alto')
    page.wait_for_function('world7qa.store.getState().progress.tickets.includes("calakmul")')
    page.evaluate('world7qa.driving = false; world7qa.store.getState().go("levels")')
    page.locator('.level-map-menu:not([inert])').wait_for()
    page.get_by_role('button', name='Estaciones', exact=True).click()
    assert page.locator('.map-itinerary .level-tile').is_enabled()
    screenshot(page, 'mapa-boleto-y-secreto')
    reports.append({'caso': 'boleto', 'recogida': 'salto real desde plataforma alta preparada', 'persistencia': True})


def cinematic_checks(page):
    for scene in range(1, 5):
        page.get_by_label(f'Escena {scene} de 4', exact=True).wait_for()
        for width, height in [(1280, 900), (390, 844), (844, 390)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(150)
            screenshot(page, f'final-escena-{scene}-{width}x{height}')
        page.set_viewport_size({'width': 1280, 'height': 900})
        if scene < 4:
            page.get_by_role('button', name='Continuar →', exact=True).click()
        else:
            page.get_by_role('button', name='Ver resultados', exact=True).click()
    page.get_by_text('¡Temayin ha completado toda la aventura!', exact=True).wait_for()
    assert page.evaluate('world7qa.store.getState().progress.levels["7-4"].completions') == 1
    screenshot(page, 'aventura-completada')
    reports.append({'caso': 'desenlace', 'escenas': 4, 'tamaños': ['1280x900', '390x844', '844x390'], 'finalizacionUnica': True})


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900}, has_touch=True, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
        page.goto(URL); page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Jugar', exact=True).wait_for()
        page.evaluate((ROOT / 'imagenes/world7_qa.js').read_text(encoding='utf-8'))
        page.get_by_role('button', name='Jugar', exact=True).click()
        page.locator('.level-map-menu:not([inert])').wait_for()
        assert page.get_by_role('navigation', name='Mundos de la aventura').get_by_role('button').count() == 7
        screenshot(page, 'mapa-mundo7-desbloqueado')
        for level in ['7-1', '7-2', '7-3']:
            drive_level(page, level)
        ticket_checks(page)
        drive_level(page, '7-extra')
        drive_level(page, '7-4')
        cinematic_checks(page)
        assert not errors, errors
        browser.close()
    (OUTPUT / 'informe.json').write_text(json.dumps({'recorridos': reports, 'errores': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(reports, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
