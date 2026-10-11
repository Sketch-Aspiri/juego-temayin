"""Comprueba dedos simultáneos reales mediante eventos táctiles de Chromium."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).resolve().parent / 'verificacion' / 'movil'
OUTPUT.mkdir(parents=True, exist_ok=True)
errors, report = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height in [(844, 390), (390, 844), (320, 568)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5173'))
        page.wait_for_load_state('networkidle')
        page.evaluate("""async () => {
            const { World } = await import('/src/engine/World.ts');
            const update = World.prototype.update;
            World.prototype.update = function(dt) { window.touchWorld = this; update.call(this, dt); };
        }""")
        page.get_by_role('button', name='Jugar', exact=True).click()
        page.get_by_role('button').filter(has_text='1-1').first.click()
        page.get_by_role('button', name='Saltar ⏭', exact=True).click()
        page.locator('.touch').wait_for()
        page.wait_for_timeout(200)
        boxes = {a: page.locator(f'[data-action="{a}"]').bounding_box() for a in ['run', 'left', 'right', 'jump', 'fire']}
        for box in boxes.values():
            assert box['x'] >= 0 and box['y'] >= 0
            assert box['x'] + box['width'] <= width and box['y'] + box['height'] <= height
            assert box['width'] >= 44 and box['height'] >= 44
        for a, first in boxes.items():
            for b, second in boxes.items():
                if a != b:
                    assert first['x'] + first['width'] <= second['x'] or second['x'] + second['width'] <= first['x'] or first['y'] + first['height'] <= second['y'] or second['y'] + second['height'] <= first['y']
        def point(action, identifier):
            box = boxes[action]
            return {'x': box['x'] + box['width'] / 2, 'y': box['y'] + box['height'] / 2, 'id': identifier}
        def held():
            return page.evaluate("async () => ({ ...(await import('/src/engine/input.ts')).input.held })")
        run = point('run', 9)
        page.touchscreen.tap(run['x'], run['y'])
        assert held()['run']
        assert page.get_by_role('button', name='Correr', exact=True).get_attribute('aria-pressed') == 'true'
        cdp = context.new_cdp_session(page)
        initial = page.evaluate('() => { touchWorld.player.fire = true; return { x: touchWorld.player.x, y: touchWorld.player.y }; }')
        fingers = [point('right', 1), point('jump', 2), point('fire', 3)]
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': fingers})
        assert held() == {'left': False, 'right': True, 'jump': True, 'run': True, 'fire': True}
        page.wait_for_timeout(150)
        result = page.evaluate('() => ({ x: touchWorld.player.x, y: touchWorld.player.y, fireballs: touchWorld.fireballs.length })')
        assert result['x'] > initial['x'] and result['y'] < initial['y'] and result['fireballs'] > 0, result
        page.screenshot(path=str(OUTPUT / f'{width}x{height}-combinacion.png'))
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': [fingers[1]]})
        fingers = [fingers[0], fingers[2]]
        assert held() == {'left': False, 'right': True, 'jump': False, 'run': True, 'fire': True}, held()
        fingers[0] = point('left', 1)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': fingers})
        assert held()['left'] and not held()['right'] and held()['fire']
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchCancel', 'touchPoints': []})
        assert held() == {'left': False, 'right': False, 'jump': False, 'run': True, 'fire': False}
        page.get_by_role('button', name='Pausa', exact=True).click()
        assert not any(held().values())
        assert page.locator('.touch').count() == 0
        report.append({'viewport': [width, height], 'multitouch': True, 'slide': True, 'cancel': True, 'pauseReset': True, 'accessibleTargets': True, 'moveJumpFire': True, 'fireEnabledForCheck': True})
        context.close()
    browser.close()
(OUTPUT / 'revision.json').write_text(json.dumps({'checks': report, 'errors': errors}, indent=2), encoding='utf-8')
assert not errors, errors
print('Controles móviles verificados: tres tamaños, carrera, tres dedos, deslizamiento, cancelación y pausa.')
