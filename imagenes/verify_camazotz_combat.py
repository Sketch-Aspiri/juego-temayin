"""Revisa el combate completo y el desenlace con contacto protegido, sin quitar PV por script."""
import json
from playwright.sync_api import sync_playwright
import verify_world7 as qa


def main():
    qa.OUTPUT = qa.ROOT / 'imagenes/verificacion/camazotz-v2'
    qa.OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 900}, has_touch=True, reduced_motion='reduce')
        page.on('pageerror', lambda error: qa.errors.append(str(error)))
        page.on('response', lambda response: qa.errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
        page.goto(qa.URL); page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Jugar', exact=True).wait_for()
        page.evaluate((qa.ROOT / 'imagenes/world7_qa.js').read_text(encoding='utf-8'))
        page.evaluate('''() => {
          const store = world7qa.store;
          const progress = store.getState().progress;
          const record = {stars: 2, completions: 1, bestScore: 2000};
          store.setState({progress: {...progress, levels: {...progress.levels,
            '7-1': record, '7-2': record, '7-3': record}}});
        }''')
        page.get_by_role('button', name='Jugar', exact=True).click()
        page.locator('.level-map-menu:not([inert])').wait_for()
        qa.drive_level(page, '7-4')
        qa.cinematic_checks(page)
        assert not qa.errors, qa.errors
        expected = ['picada-en-vuelo', 'picada-tercera', 'enjambre', 'viento-y-ondas', 'lluvia-camara', 'rayo-triple']
        assert all(name in qa.reports[0]['shots'] for name in expected), qa.reports[0]
        browser.close()
    report = {'errores': qa.errors, 'recorridos': qa.reports, 'asistencia': 'Contacto protegido; movimiento, salto y fuego reales, sin daño automático al jefe.'}
    (qa.OUTPUT / 'informe.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True))


if __name__ == '__main__':
    main()
