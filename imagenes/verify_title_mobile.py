"""Comprueba que Temayin y el menú caben juntos, con y sin récord, en Chromium y WebKit."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5196')
OUTPUT = Path(__file__).parent / '.temp' / 'portada-movil'
SIZES = [(320, 568), (360, 640), (369, 653), (390, 690), (390, 740),
         (390, 741), (390, 844), (430, 932), (844, 390), (568, 320), (1440, 900)]
SAVED_RECORD = {'progress': {'levels': {'1-1': {'bestScore': 213350, 'stars': 3, 'completions': 1}}}}


def check_layout(page, width, height):
    page.set_viewport_size({'width': width, 'height': height})
    result = page.locator('.title').evaluate('''el => {
      const rect = selector => el.querySelector(selector).getBoundingClientRect().toJSON();
      const hero = el.querySelector('.title__jaguar');
      const box = hero.getBoundingClientRect();
      return {width: innerWidth, height: innerHeight,
        overflow: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
        hero: rect('.title__jaguar'), panel: rect('.title__panel'),
        loaded: hero.complete && hero.naturalWidth > 0,
        visible: getComputedStyle(hero).visibility === 'visible' &&
          document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === hero,
        animation: getComputedStyle(hero).animationName,
        buttons: [...el.querySelectorAll('nav button')].map(button => ({
          text: button.textContent, ...button.getBoundingClientRect().toJSON()}))};
    }''')
    hero, panel = result['hero'], result['panel']
    assert result['loaded'] and result['visible'], result
    assert hero['width'] >= 100 and hero['height'] >= 100, result
    assert hero['x'] >= 0 and hero['y'] >= 0, result
    assert hero['right'] <= width + 1 and hero['bottom'] <= height + 1, result
    assert not result['overflow'], result
    assert (hero['bottom'] <= panel['top'] or hero['left'] >= panel['right']), result
    assert result['animation'] == 'none', result
    for button in result['buttons']:
        assert button['height'] >= 44, result
        assert button['x'] >= 0 and button['y'] >= 0, result
        assert button['right'] <= width + 1 and button['bottom'] <= height + 1, result
    return result


def check_browser(browser_type):
    browser = browser_type.launch(headless=True)
    context = browser.new_context(is_mobile=True, has_touch=True, reduced_motion='reduce')
    page = context.new_page()
    errors, layouts = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        for has_record in [False, True]:
            page.goto(URL)
            page.wait_for_load_state('networkidle')
            page.evaluate('saved => { localStorage.clear(); if (saved) localStorage.setItem("temayin:v3", JSON.stringify(saved)); }',
                          SAVED_RECORD if has_record else None)
            page.reload()
            page.wait_for_load_state('networkidle')
            page.locator('.title').wait_for()
            page.evaluate('document.fonts.ready')
            page.locator('.title__jaguar').evaluate('image => image.decode()')
            assert page.locator('.title__record').count() == int(has_record)
            for width, height in SIZES:
                result = check_layout(page, width, height)
                result['record'] = has_record
                layouts.append(result)
                page.screenshot(path=str(OUTPUT / f'{browser_type.name}-{width}x{height}-{has_record}.png'))
        page.set_viewport_size({'width': 369, 'height': 653})
        before = page.evaluate('localStorage.getItem("temayin:v3")')
        page.get_by_role('button', name='Ajustes', exact=True).tap()
        page.get_by_role('heading', name='Ajustes', exact=True).wait_for()
        page.get_by_role('button', name='← Volver', exact=True).tap()
        page.locator('.title').wait_for()
        assert page.evaluate('localStorage.getItem("temayin:v3")') == before
        assert page.locator('.title__jaguar').is_visible()
        page.get_by_role('button', name='Jugar', exact=True).tap()
        page.locator('.peninsula').first.wait_for()
        assert not errors, errors
        return {'browser': browser_type.name, 'layouts': layouts, 'errors': errors}
    finally:
        browser.close()


def run():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        results = [check_browser(browser) for browser in [playwright.chromium, playwright.webkit]]
    (OUTPUT / 'revision.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Portada verificada: Temayin visible en 11 tamaños, con y sin récord, en Chromium y WebKit.')


if __name__ == '__main__':
    run()
