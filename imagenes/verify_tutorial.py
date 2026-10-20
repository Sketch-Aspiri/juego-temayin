"""Comprueba portada sin scroll, práctica real, pausa, rotación y guardado aislado."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).parent / '.temp' / 'tutorial'
URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5173')
SIZES = [(1440, 900), (1366, 768), (1024, 600), (390, 844), (360, 640), (320, 568), (844, 390), (667, 375), (568, 320)]


def layout_checks(page):
    layouts = []
    for width, height in SIZES:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(120)
        result = page.locator('.title').evaluate('''el => ({
          width: innerWidth, height: innerHeight, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth, buttons: [...el.querySelectorAll('nav button')].map(b => {
            const r = b.getBoundingClientRect();
            return {text: b.textContent, x: r.x, y: r.y, width: r.width, height: r.height};
          })
        })''')
        page.screenshot(path=str(OUTPUT / f'menu-{width}x{height}.png'))
        assert result['scrollHeight'] <= result['clientHeight'] + 1, result
        assert result['scrollWidth'] <= width + 1, result
        for button in result['buttons']:
            assert button['x'] >= 0 and button['y'] >= 0, result
            assert button['y'] + button['height'] <= height + 1, result
            assert button['x'] + button['width'] <= width + 1, result
            assert button['height'] >= 44, result
        assert result['buttons'][3]['text'] == 'Cómo jugar', result
        layouts.append(result)
    return layouts


def keyboard_route(page):
    page.get_by_role('button', name='Comenzar minitutorial').click()
    page.locator('.tutorial__overlay').wait_for(state='hidden')
    page.keyboard.press('KeyC')
    page.keyboard.down('ArrowRight')
    page.keyboard.down('ShiftLeft')
    page.wait_for_timeout(1150)
    for _ in range(16):
        page.keyboard.down('Space')
        page.wait_for_timeout(350)
        page.keyboard.up('Space')
        page.wait_for_timeout(300)
        if page.get_by_text('¡Listo para la aventura!', exact=True).is_visible():
            break
    page.keyboard.up('ArrowRight')
    page.keyboard.up('ShiftLeft')
    page.get_by_text('¡Listo para la aventura!', exact=True).wait_for(timeout=15000)
    page.screenshot(path=str(OUTPUT / 'practica-completa.png'))


def run():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_load_state('networkidle')
        page.locator('.title').wait_for()
        page.evaluate('document.fonts.ready')
        page.evaluate('''async () => {
          const { useAppStore } = await import('/src/store/appStore.ts');
          const s = useAppStore.getState();
          localStorage.setItem('temayin:v3', JSON.stringify({
            progress: {...s.progress, levels: {'1-1': {bestScore: 683550, stars: 3, completions: 2}}},
            settings: s.settings, wallet: {cacao: 137, pending: {}}
          }));
        }''')
        page.reload()
        page.locator('.title').wait_for()
        layouts = layout_checks(page)
        page.set_viewport_size({'width': 1440, 'height': 900})
        saved = page.evaluate('localStorage.getItem("temayin:v3")')
        page.get_by_role('button', name='Cómo jugar', exact=True).click()
        page.screenshot(path=str(OUTPUT / 'guia-escritorio.png'))
        keyboard_route(page)
        assert page.evaluate('localStorage.getItem("temayin:v3")') == saved
        page.get_by_role('button', name='Practicar otra vez').click()
        page.locator('.tutorial__overlay').wait_for(state='hidden')
        page.keyboard.press('Escape')
        page.get_by_text('Un respiro en el claro').wait_for()
        page.screenshot(path=str(OUTPUT / 'pausa.png'))
        page.get_by_role('button', name='Seguir practicando').click()
        page.locator('.tutorial__overlay').wait_for(state='hidden')
        page.get_by_role('button', name='Volver al menú').click()
        assert page.evaluate('localStorage.getItem("temayin:v3")') == saved
        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        phone = mobile.new_page()
        phone.on('pageerror', lambda error: errors.append(str(error)))
        phone.goto(URL)
        phone.locator('.title').wait_for()
        phone.get_by_role('button', name='Cómo jugar', exact=True).tap()
        phone.screenshot(path=str(OUTPUT / 'guia-movil.png'))
        phone.get_by_role('button', name='Comenzar minitutorial').tap()
        phone.locator('.tutorial__overlay').wait_for(state='hidden')
        phone.get_by_role('button', name='Correr', exact=True).tap()
        phone.get_by_role('button', name='Saltar', exact=True).tap()
        phone.wait_for_timeout(150)
        phone.get_by_role('button', name='Fuego', exact=True).tap()
        phone.wait_for_function("document.querySelector('.tutorial__guide').innerText.includes('2 DE 5')")
        phone.screenshot(path=str(OUTPUT / 'practica-movil.png'))
        assert '2 DE 5' in phone.locator('.tutorial__guide').inner_text()
        phone.set_viewport_size({'width': 844, 'height': 390})
        phone.wait_for_timeout(200)
        phone.screenshot(path=str(OUTPUT / 'practica-horizontal.png'))
        assert '2 DE 5' in phone.locator('.tutorial__guide').inner_text()
        for button in phone.locator('.touch button').all():
            box = button.bounding_box()
            assert box['y'] >= 0 and box['y'] + box['height'] <= 390, box
        browser.close()
    assert not errors, errors
    (OUTPUT / 'revision.json').write_text(json.dumps({'layouts': layouts, 'errores': errors, 'recorrido': 'Teclado real, sin asistencia; meta, pausa, reinicio, táctil, rotación y persistencia verificados.'}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Portada y tutorial verificados en Chromium; capturas en', OUTPUT)


if __name__ == '__main__':
    run()
