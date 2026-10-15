"""Comprueba la carga real, el tren animado, pantallas pequeñas y movimiento reducido."""
import argparse
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / 'verificacion/carga'
VIEWS = [('escritorio', 1280, 800), ('vertical', 390, 844),
         ('horizontal', 667, 375), ('estrecho', 320, 568), ('bajo', 568, 320)]


def inspect(page):
    return page.evaluate("""()=>{
      const root=document.querySelector('.loading-screen'),train=document.querySelector('.loading-screen__train');
      const text=document.querySelector('.loading-screen__status'),r=train.getBoundingClientRect(),s=text.getBoundingClientRect();
      return {viewport:[innerWidth,innerHeight],train:[r.x,r.y,r.width,r.height],
        status:[s.x,s.y,s.width,s.height],overflow:root.scrollWidth>root.clientWidth,
        animations:document.getAnimations().filter(a=>a.playState==='running').length,
        transform:getComputedStyle(train).transform,text:text.innerText,
        sprite:getComputedStyle(train).backgroundImage};
    }""")


def touch_scroll(context, page):
    session = context.new_cdp_session(page)
    session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 280, 'y': 280}]})
    for y in [250, 220, 180, 140, 100]:
        session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 280, 'y': y}]})
        page.wait_for_timeout(25)
    session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    page.wait_for_timeout(100)
    amount = page.locator('.loading-screen').evaluate('(element)=>element.scrollTop')
    assert amount > 0, 'La carga baja debe poder desplazarse con un dedo'
    session.detach()
    return amount


def verify_cycle(page):
    return page.evaluate("""()=>{
      const animation=document.querySelector('.loading-screen__landscape').getAnimations()[0];
      animation.pause();
      animation.currentTime=0;
      const style=getComputedStyle(animation.effect.target),start=new DOMMatrixReadOnly(style.transform).m41;
      animation.currentTime=21999;
      const finish=new DOMMatrixReadOnly(style.transform).m41;
      animation.play();
      return {distance:finish-start,tile:900};
    }""")


def capture(browser, url, name, width, height, motion, errors):
    context = browser.new_context(viewport={'width': width, 'height': height},
                                  is_mobile=width < 700, has_touch=width < 700, reduced_motion=motion)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    held = []
    # Solo QA retiene un recurso del arranque: producción no tiene demora artificial.
    page.route('**/assets/guepardo.webp', lambda route: held.append(route))
    page.goto(url, wait_until='domcontentloaded')
    page.get_by_role('heading', name='Preparando tu aventura…').wait_for()
    page.evaluate("""async()=>{
      await document.fonts.ready;
      const image=new Image();image.src='/assets/complementos/tren.webp';await image.decode();
      const background=new Image();background.src='/assets/backgrounds/jungle.webp';await background.decode();
    }""")
    page.wait_for_timeout(250)
    scroll = touch_scroll(context, page) if height <= 320 else 0
    first = inspect(page)
    page.screenshot(path=str(OUT / f'{name}-{motion}.png'))
    page.wait_for_timeout(170)
    second = inspect(page)
    assert not first['overflow'], first
    assert first['train'][2] > 100 and first['train'][3] > 30, first
    assert 0 <= first['status'][1] and sum(first['status'][1::2]) <= height, first
    assert 'tren.webp' in first['sprite'], first
    if motion == 'reduce':
        assert first['animations'] == 0 and first['transform'] == second['transform'], (first, second)
    else:
        assert first['animations'] > 0 and first['transform'] != second['transform'], (first, second)
    cycle = verify_cycle(page) if name == 'escritorio' else None
    if cycle:
        assert abs(cycle['distance'] - cycle['tile']) < 1, cycle
    assert held, 'La comprobación debe capturar una carga todavía pendiente'
    for route in held:
        route.continue_()
    page.wait_for_selector('.title', timeout=15000)
    assert page.locator('.loading-screen').count() == 0
    context.close()
    return {'view': name, 'motion': motion, 'titleReached': True, 'touchScroll': scroll, 'cycle': cycle, **first}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        url = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5197')
        reports = [capture(browser, url, name, w, h, 'no-preference', errors) for name, w, h in VIEWS]
        reports.append(capture(browser, url, 'vertical', 390, 844, 'reduce', errors))
        browser.close()
    report = {'mode': 'Carga real reteniendo un recurso solo en QA; sin cambios de tiempos en producción.',
              'views': reports, 'errors': errors}
    (OUT / 'revision.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    assert not errors, errors


if __name__ == '__main__':
    main()
