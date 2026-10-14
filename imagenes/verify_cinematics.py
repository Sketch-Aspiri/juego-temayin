"""Revisa Historia, guardados antiguos y la cinemática tras completar Escárcega."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
parser.add_argument('--output', default='imagenes/.temp/cinematicas')
args = parser.parse_args()
out = ROOT / args.output
out.mkdir(parents=True, exist_ok=True)
errors, reports = [], []
RECORD = {'bestScore': 6000, 'stars': 2, 'completions': 1}


def new_page(browser, width=1280, height=900, levels=None, legacy=False, motion='reduce'):
    context = browser.new_context(viewport={'width': width, 'height': height},
                                  reduced_motion=motion, has_touch=True)
    saved = {'progress': {'levels': levels or {}}, 'settings': {'muted': True, 'introSeen': True}}
    key = 'temayin:v2' if legacy else 'temayin:v3'
    context.add_init_script(f"if(!localStorage.getItem({json.dumps(key)}))localStorage.setItem({json.dumps(key)}, {json.dumps(json.dumps(saved))})")
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    return context, page


def saved_progress(page):
    return page.evaluate("JSON.parse(localStorage.getItem('temayin:v3')).progress")


def play_scenes(page, count, label, finish_label):
    for index in range(1, count + 1):
        page.get_by_label(f'Escena {index} de {count}', exact=True).wait_for()
        page.wait_for_function("Array.from(document.querySelectorAll('.intro-sprite')).every(e=>getComputedStyle(e).backgroundImage!=='none')")
        page.wait_for_timeout(100)
        reveal = page.get_by_role('button', name='Mostrar texto', exact=True)
        if reveal.is_visible():
            reveal.tap()
        if page.locator('.intro-train__cars').count():
            train = page.locator('.intro-train__cars').bounding_box()
            assert train['x'] < page.viewport_size['width'] and train['x'] + train['width'] > 0, train
        page.screenshot(path=str(out / f'{label}-escena-{index}.png'))
        size = page.viewport_size
        caption = page.locator('.intro-caption').bounding_box()
        assert caption['y'] >= 0 and caption['y'] + caption['height'] <= size['height'] + 1, caption
        if size['width'] < size['height']:
            for actor in page.locator('.intro-actor').all():
                box = actor.bounding_box()
                assert box['x'] >= -1 and box['x'] + box['width'] <= size['width'] + 1, box
                assert box['y'] >= 0 and box['y'] + box['height'] <= caption['y'], box
        if index < count:
            page.keyboard.press('Enter') if index % 2 else page.locator('.intro-next').tap()
    page.get_by_role('button', name=finish_label, exact=True).click()


def gallery_checks(browser):
    for width, height in [(1280, 900), (390, 844), (844, 390)]:
        context, page = new_page(browser, width, height)
        page.get_by_role('button', name='Historia', exact=True).click()
        assert page.get_by_role('button', name='Bloqueada: El primer tramo libre').is_disabled()
        page.locator('.history').screenshot(path=str(out / f'{width}-menu-bloqueado.png'))
        page.get_by_role('button', name='Ver: El eclipse de Camazotz', exact=True).click()
        play_scenes(page, 6, f'{width}-prologo', 'Volver a Historia')
        assert page.locator('.history').is_visible()
        assert saved_progress(page)['levels'] == {}
        page.keyboard.press('Escape')
        page.get_by_role('button', name='Historia', exact=True).wait_for()
        context.close()
        reports.append({'case': 'nuevo', 'width': width, 'intro': True, 'victoryLocked': True})


def legacy_checks(browser):
    for legacy, width, height in [(False, 1280, 900), (False, 390, 844), (True, 844, 390)]:
        context, page = new_page(browser, width, height, {'1-3' if legacy else '1-6': RECORD}, legacy)
        before = saved_progress(page)
        page.get_by_role('button', name='Historia', exact=True).click()
        page.locator('.history').screenshot(path=str(out / f'{width}-menu-desbloqueado.png'))
        page.get_by_role('button', name='Ver: El primer tramo libre', exact=True).click()
        play_scenes(page, 4, f'{width}-victoria', 'Volver a Historia')
        assert saved_progress(page) == before
        replay = page.get_by_role('button', name='Ver: El primer tramo libre', exact=True)
        assert replay.evaluate('e=>e===document.activeElement')
        replay.click()
        page.keyboard.press('Escape')
        page.get_by_role('heading', name='Historia', exact=True).wait_for()
        assert saved_progress(page) == before
        page.reload()
        page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Historia', exact=True).click()
        assert page.get_by_role('button', name='Ver: El primer tramo libre', exact=True).is_enabled()
        reports.append({'case': 'guardado-v2' if legacy else 'guardado-v3', 'width': width, 'replayPreservesProgress': True})
        context.close()


def prepare_drive(page):
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const [{World},{useAppStore}]=await Promise.all([
        import(loaded('/src/engine/World.ts')),import(loaded('/src/store/appStore.ts'))]);
      window.cinemaQA={world:null,store:useAppStore,drive:true,checkpoint:false,complete:null};
      const update=World.prototype.update;
      World.prototype.update=function(dt){
        const qa=cinemaQA;qa.world=this;
        for(let i=0;i<(qa.drive?8:1);i++){
          const p=this.player,input=this.input,b=this.boss;
          if(qa.drive&&this.phase==='play'){
            p.inv=1;
            if(b?.hp>0&&b.st!=='sleep'){
              input.release('right');input.release('run');input.release('jump');
              if(b.hittable)b.onFireball(this);
            }else{
              input.press('right');input.press('run');
              const front=p.x+p.w,tx=Math.floor(front/40),feet=Math.floor((p.y+p.h-3)/40);
              let jump=false;
              if(p.onGround||p.coyote>0)for(let x=tx;x<=Math.floor((front+95)/40);x++){
                if(!this.solid(x,12)||this.solid(x,feet))jump=true;
              }
              if(jump&&!input.held.jump)input.press('jump');
              else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
            }
          }
          update.call(this,dt);
          if(this.checkpointReached)qa.checkpoint=true;
          if(this.phase==='done'){qa.complete={...this.session};qa.drive=false;break;}
          if(this.phase==='dying')break;
        }
      };
    }""")


def completion_checks(browser):
    context, page = new_page(browser, levels={'1-5': RECORD})
    prepare_drive(page)
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.get_by_role('button').filter(has_text='Escárcega').click()
    page.locator('.cinematic-overlay').wait_for(timeout=60000)
    assert page.evaluate("cinemaQA.world.boss.hp===0 && cinemaQA.checkpoint")
    assert saved_progress(page)['levels']['1-6']['completions'] == 1
    assert page.get_by_role('dialog', name='¡NIVEL COMPLETADO!').count() == 0
    state = page.evaluate('JSON.stringify({player:cinemaQA.world.player,session:cinemaQA.world.session})')
    page.wait_for_timeout(300)
    assert state == page.evaluate('JSON.stringify({player:cinemaQA.world.player,session:cinemaQA.world.session})')
    play_scenes(page, 4, 'victoria-automatica', 'Ver resultados')
    page.get_by_role('dialog', name='¡NIVEL COMPLETADO!').wait_for()
    assert saved_progress(page)['levels']['1-6']['completions'] == 1
    page.screenshot(path=str(out / 'resultados-escarcega.png'))
    carry = page.evaluate('cinemaQA.complete')
    page.get_by_role('button', name='Siguiente nivel', exact=True).click()
    page.wait_for_function("cinemaQA.world.def.id==='2-1'")
    assert page.evaluate('cinemaQA.store.getState().run.session') == carry
    reports.append({'case': 'victoria-automatica', 'checkpoint': True, 'bossDefeated': True,
                    'singleCompletion': True, 'nextLevel': '2-1', 'carryPreserved': True})
    context.close()


def motion_and_skip_checks(browser):
    context, page = new_page(browser, 390, 844, {'1-6': RECORD}, motion='no-preference')
    page.get_by_role('button', name='Historia', exact=True).click()
    page.get_by_role('button', name='Ver: El primer tramo libre', exact=True).click()
    page.get_by_role('button', name='Mostrar texto', exact=True).click()
    page.get_by_role('button', name='Continuar →', exact=True).wait_for()
    page.get_by_label('Escena 2 de 4', exact=True).wait_for(timeout=7000)
    page.set_viewport_size({'width': 844, 'height': 390})
    page.get_by_label('Escena 2 de 4', exact=True).wait_for()
    page.get_by_role('button', name='Saltar ⏭', exact=True).tap()
    page.get_by_role('heading', name='Historia', exact=True).wait_for()
    assert saved_progress(page)['levels']['1-6'] == RECORD
    reports.append({'case': 'animaciones', 'autoAdvance': True, 'rotationPreservesScene': True, 'skip': True})
    context.close()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    gallery_checks(browser)
    legacy_checks(browser)
    completion_checks(browser)
    motion_and_skip_checks(browser)
    browser.close()

payload = {'reports': reports, 'errors': errors,
           'mode': 'Recorrido completo de Escárcega con contacto protegido y fuego asistido en ventanas válidas. No evalúa dificultad.'}
(out / 'resultados.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(payload, ensure_ascii=True))
assert not errors, errors
