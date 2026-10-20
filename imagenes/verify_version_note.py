"""Comprueba la revisión compilada y la nota de versión en escritorio y móvil."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).resolve().parent / '.temp/nota-version'
VIEWPORTS = [('escritorio', 1280, 850), ('movil-horizontal', 844, 390), ('movil-vertical', 390, 844), ('movil-pequeno', 360, 640)]


def capture(page, name, width, height, expected, production):
    page.set_viewport_size({'width': width, 'height': height})
    note = page.get_by_role('region', name='Notas de versión')
    assert page.get_by_role('heading', name='Temayin', exact=True).count() == 1
    note.scroll_into_view_if_needed()
    assert note.is_visible()
    assert note.get_by_text(f'commit {expected[:7]}', exact=True).is_visible()
    assert note.get_by_text('Versión desplegada' if production else 'Versión local', exact=True).is_visible()
    assert note.locator('code').get_attribute('title') == f'Commit {expected}'
    page.wait_for_timeout(100)
    page.screenshot(path=str(OUTPUT / f'{name}.png'))
    overflow = note.evaluate('(el)=>el.scrollWidth>el.clientWidth')
    assert not overflow, name
    title = page.locator('.logo').bounding_box()
    assert title['x'] >= 0 and title['x'] + title['width'] <= width, title
    return {'viewport': name, 'commit': expected, 'horizontalOverflow': overflow}


def verify_details_and_menu(page):
    toggle = page.get_by_text('Ver cambios de esta versión', exact=True)
    if toggle.count():
        toggle.click()
        assert page.locator('.version-note__details').get_attribute('open') is not None
        assert page.locator('.version-note li').first.is_visible()
        page.locator('.version-note').screenshot(path=str(OUTPUT / 'cambios-desplegados.png'))
        toggle.click()
    page.get_by_role('button', name='Jugar', exact=True).scroll_into_view_if_needed()
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.get_by_role('button', name='← Volver', exact=True).wait_for(state='visible')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:5198')
    parser.add_argument('--expected-commit', required=True)
    parser.add_argument('--production', action='store_true')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        page.goto(args.url)
        page.wait_for_load_state('networkidle')
        page.locator('.title__version > summary').click()
        page.wait_for_selector('.version-note')
        fonts = page.evaluate("""async()=>{
          await document.fonts.ready;
          return ['Lilita One','Bree Serif'].map(family=>({family,
            loaded:[...document.fonts].some(font=>font.family===family&&font.status==='loaded')}));
        }""")
        assert all(font['loaded'] for font in fonts), fonts
        reports = [capture(page, name, w, h, args.expected_commit, args.production) for name, w, h in VIEWPORTS]
        verify_details_and_menu(page)
        browser.close()
    payload = {'screens': reports, 'fonts': fonts, 'errors': errors, 'menuWorks': True}
    (OUTPUT / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assert not errors, errors
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == '__main__':
    main()
