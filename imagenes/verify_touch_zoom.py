"""Revisa pulsaciones rápidas de Salto en Chromium y WebKit móvil emulado."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).resolve().parent / 'verificacion' / 'movil'
OUTPUT.mkdir(parents=True, exist_ok=True)
errors, reports = [], []
with sync_playwright() as p:
    for name in ['chromium', 'webkit']:
        browser = getattr(p, name).launch(headless=True)
        context = browser.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5173'))
        page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Jugar', exact=True).click()
        page.get_by_role('button').filter(has_text='1-1').first.click()
        page.get_by_role('button', name='Saltar ⏭', exact=True).click()
        page.locator('.pad--jump').wait_for()
        page.evaluate("""async () => {
            const { input } = await import('/src/engine/input.ts');
            window.zoomInput = input; window.jumpPresses = 0;
            const press = input.press.bind(input);
            input.press = (action, source) => {
                if (action === 'jump' && !input.held.jump) window.jumpPresses++;
                press(action, source);
            };
        }""")
        def tap(selector):
            box = page.locator(selector).bounding_box()
            page.touchscreen.tap(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
        tap('.pad--run')
        assert page.evaluate('zoomInput.held.run')
        scales = []
        for _ in range(12):
            tap('.pad--jump')
            scales.append(page.evaluate('visualViewport.scale'))
            assert not page.evaluate('zoomInput.held.jump')
            page.wait_for_timeout(40)
        assert page.evaluate('jumpPresses') == 12
        assert all(scale == 1 for scale in scales), scales
        page.screenshot(path=str(OUTPUT / f'{name}-salto-sin-zoom.png'))
        tap('.pause-btn')
        assert page.locator('.touch').count() == 0
        assert not any(page.evaluate('zoomInput.held').values())
        reports.append({'browser': name, 'rapidJumps': 12, 'scales': scales, 'pauseTouchWorks': True, 'errors': 0})
        context.close()
        browser.close()
(OUTPUT / 'zoom.json').write_text(json.dumps({'emulated': True, 'checks': reports, 'errors': errors}, indent=2), encoding='utf-8')
assert not errors, errors
print('Chromium y WebKit: 12 pulsaciones rápidas de Salto por navegador, escala 1 y pausa táctil correcta.')
