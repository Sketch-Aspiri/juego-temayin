"""Revisa todas las victorias, poses, encuadres y fin de nivel en Chromium.

Uso: python imagenes/verify_boss_cinematics.py --url http://127.0.0.1:5197
La finalización se prepara en la bandera: comprueba la integración de UI, no la dificultad del combate.
"""
import argparse
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
RECORD = {'bestScore': 6000, 'stars': 2, 'completions': 1}
LEVELS = ('2-7', '3-5', '4-5', '5-6', '6-6')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
parser.add_argument('--output', default='imagenes/.temp/cinematicas-jefes')
parser.add_argument('--gallery-only', action='store_true')
parser.add_argument('--completion-only', action='store_true')
parser.add_argument('--legacy-only', action='store_true')
args = parser.parse_args()
OUT = ROOT / args.output
OUT.mkdir(parents=True, exist_ok=True)
errors, reports = [], []


def check_exports():
    for path in (ROOT / 'public/assets/cinematicas').glob('*.webp'):
        atlas = json.loads(path.with_suffix('.atlas.json').read_text(encoding='utf-8'))
        image = Image.open(path).convert('RGBA')
        source = Image.open(ROOT / 'imagenes/nuevos/cinematicas' / f'{path.stem}.png').convert('RGBA')
        assert image.size == (atlas['width'], atlas['height'])
        assert image.tobytes() == source.tobytes(), path.name
        if not atlas['alpha']:
            continue
        alpha = image.getchannel('A').point(lambda value: 255 if value >= 8 else 0)
        assert image.getchannel('A').getextrema() == (0, 255)
        covered = 0
        for pose in atlas['frames']:
            x, y, w, h = pose['frame']
            assert x >= 0 and y >= 0 and w > 0 and h > 0
            assert x + w <= image.width and y + h <= image.height
            crop = alpha.crop((x, y, x + w, y + h))
            assert crop.getbbox() == (0, 0, w, h)
            covered += sum(crop.histogram()[1:])
        assert covered == sum(alpha.histogram()[1:]), path.name
    reports.append({'case': 'arte', 'poses': 16, 'lossless': True, 'alphaPreserved': True})


def new_page(browser, width=1280, height=900, levels=None, motion='reduce', legacy=False):
    context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True, reduced_motion=motion)
    saved = {'progress': {'levels': levels or {}}, 'settings': {'muted': True, 'introSeen': True}, 'wallet': {'cacao': 37, 'pending': {}}}
    key = 'temayin:v2' if legacy else 'temayin:v3'
    context.add_init_script(f"localStorage.setItem({json.dumps(key)}, {json.dumps(json.dumps(saved))})")
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Historia', exact=True).wait_for()
    return context, page


def progress(page):
    return page.evaluate("JSON.parse(localStorage.getItem('temayin:v3'))")


def scene_checks(page, label, finish='Volver a Historia'):
    for index in range(1, 5):
        page.get_by_label(f'Escena {index} de 4', exact=True).wait_for()
        page.wait_for_function("Array.from(document.querySelectorAll('.intro-sprite')).every(e=>getComputedStyle(e).backgroundImage!=='none')")
        page.wait_for_timeout(100)
        reveal = page.get_by_role('button', name='Mostrar texto', exact=True)
        if reveal.is_visible():
            reveal.click()
        page.screenshot(path=str(OUT / f'{label}-{index}.png'))
        size = page.viewport_size
        caption = page.locator('.intro-caption').bounding_box()
        assert caption['y'] >= 0 and caption['y'] + caption['height'] <= size['height'] + 1
        for actor in page.locator('.intro-actor').all():
            box = actor.bounding_box()
            assert box['x'] >= -1 and box['x'] + box['width'] <= size['width'] + 1, (label, index, box)
            assert box['y'] >= -1, (label, index, box)
            if size['height'] > size['width'] or size['height'] <= 500:
                assert box['y'] + box['height'] <= caption['y'], (label, index, box)
        if index < 4:
            page.keyboard.press('Enter') if index % 2 else page.locator('.intro-next').tap()
    page.get_by_role('button', name=finish, exact=True).click()


def gallery_checks(browser):
    for width, height in ((1280, 900), (390, 844), (844, 390)):
        context, page = new_page(browser, width, height, {level: RECORD for level in LEVELS})
        page.get_by_role('button', name='Historia', exact=True).click()
        before = progress(page)
        page.locator('.history').screenshot(path=str(OUT / f'{width}-historia.png'))
        for level in LEVELS:
            chapter = page.evaluate(f"async()=>{{const m=await import('/src/data/cinematics.ts');return m.cinematicAfterLevel('{level}').id}}")
            button = page.locator(f'button[data-cinematic="{chapter}"]')
            assert button.is_enabled()
            button.click()
            scene_checks(page, f'{width}-{level}')
            assert page.locator(f'button[data-cinematic="{chapter}"]').evaluate('e=>e===document.activeElement')
            assert progress(page) == before
        reports.append({'case': 'galeria', 'width': width, 'chapters': 5, 'scenes': 20, 'savedProgressUnchanged': True})
        context.close()


def locked_and_motion_checks(browser):
    context, page = new_page(browser)
    page.get_by_role('button', name='Historia', exact=True).click()
    assert page.locator('button[data-cinematic][disabled]').count() == 6
    context.close()
    context, page = new_page(browser, 390, 844, {'2-7': RECORD}, motion='no-preference')
    page.get_by_role('button', name='Historia', exact=True).click()
    page.locator('button[data-cinematic="kaiman-victory"]').click()
    page.get_by_role('button', name='Mostrar texto', exact=True).click()
    page.get_by_label('Escena 2 de 4', exact=True).wait_for(timeout=7000)
    page.set_viewport_size({'width': 844, 'height': 390})
    page.get_by_label('Escena 2 de 4', exact=True).wait_for()
    page.get_by_role('button', name='Saltar ⏭', exact=True).tap()
    page.get_by_role('heading', name='Historia', exact=True).wait_for()
    page.locator('button[data-cinematic="kaiman-victory"]').click()
    page.keyboard.press('Escape')
    page.get_by_role('heading', name='Historia', exact=True).wait_for()
    assert progress(page)['progress']['levels']['2-7'] == RECORD
    reports.append({'case': 'controles', 'locked': True, 'autoAdvance': True, 'rotation': True, 'skip': True, 'escape': True})
    context.close()


def legacy_checks(browser):
    context, page = new_page(browser, 844, 390, {'1-3': RECORD}, legacy=True)
    page.get_by_role('button', name='Historia', exact=True).click()
    before = progress(page)
    assert before['progress']['levels']['1-6'] == RECORD
    assert '1-3' not in before['progress']['levels']
    assert page.locator('button[data-cinematic][disabled]').count() == 5
    page.locator('button[data-cinematic="puas-victory"]').click()
    scene_checks(page, '844-puas-v2')
    assert progress(page) == before
    reports.append({'case': 'guardado-v2', 'puasScenes': 4, 'newChaptersLocked': 5, 'savedProgressUnchanged': True})
    context.close()


def completion_checks(browser):
    for index, level in enumerate(LEVELS):
        context, page = new_page(browser, levels={level: RECORD})
        page.evaluate("""async()=>{
          const [{Game},{useAppStore}] = await Promise.all([import('/src/engine/Game.ts'),import('/src/store/appStore.ts')]);
          window.cinemaQA={store:useAppStore,game:null};
          const start=Game.prototype.start;
          Game.prototype.start=function(){cinemaQA.game=this;start.call(this)};
        }""")
        page.evaluate('(id)=>cinemaQA.store.getState().startLevel(id)', level)
        page.wait_for_function("cinemaQA.store.getState().screen==='offering'")
        page.evaluate('()=>cinemaQA.store.getState().continueOffering()')
        page.wait_for_function('cinemaQA.game!==null')
        carry = page.evaluate("""()=>{
          const w=cinemaQA.game.world;
          w.boss.hp=0;w.boss.st='gone';w.checkpointReached=true;
          w.session.score=12345;w.session.lives=4;w.session.coins=37;
          w.player.y=480-w.player.h;w.player.x=w.level.flagX*40;
          w.flagY=400;w.phase='flag';w.phaseT=6.1;w.timeLeft=0;
          return {...w.session};
        }""")
        page.locator('.cinematic-overlay').wait_for()
        assert progress(page)['progress']['levels'][level]['completions'] == 2
        assert page.get_by_role('dialog', name='¡NIVEL COMPLETADO!').count() == 0
        assert page.locator('.game').get_attribute('inert') is not None
        before = page.evaluate('JSON.stringify(cinemaQA.game.world.session)')
        page.wait_for_timeout(200)
        assert before == page.evaluate('JSON.stringify(cinemaQA.game.world.session)')
        if index % 2:
            page.get_by_role('button', name='Saltar ⏭', exact=True).click()
        else:
            scene_checks(page, f'fin-{level}', 'Ver resultados')
        page.get_by_role('dialog', name='¡NIVEL COMPLETADO!').wait_for()
        assert progress(page)['progress']['levels'][level]['completions'] == 2
        if level != '6-6':
            page.get_by_role('button', name='Siguiente nivel', exact=True).click()
            page.wait_for_function('(id)=>cinemaQA.store.getState().run.levelId!==id', arg=level)
            assert page.evaluate('cinemaQA.store.getState().run.session') == carry
        else:
            page.get_by_role('button', name='Elegir nivel', exact=True).click()
            page.get_by_role('heading', name='Elige tu nivel', exact=True).wait_for()
        reports.append({'case': 'fin-de-nivel-preparado', 'level': level, 'singleCompletion': True, 'carry': carry, 'skip': bool(index % 2)})
        context.close()


check_exports()
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    if not args.completion_only and not args.legacy_only:
        gallery_checks(browser)
        locked_and_motion_checks(browser)
    if not args.completion_only:
        legacy_checks(browser)
    if not args.gallery_only and not args.legacy_only:
        completion_checks(browser)
    browser.close()
payload = {'reports': reports, 'errors': errors, 'mode': 'Escenas y finales preparados; no evalúa combates ni dificultad.'}
(OUT / 'resultados.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(payload, ensure_ascii=True))
assert not errors, errors
