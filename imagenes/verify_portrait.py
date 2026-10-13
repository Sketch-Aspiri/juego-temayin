"""Revisa cinemática, encuadre, HUD, controles y rotación en celulares verticales."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
parser.add_argument('--output', default='imagenes/.temp/vertical')
parser.add_argument('--baseline', action='store_true', help='Captura el estado previo sin exigir el diseño vertical')
parser.add_argument('--browser', choices=['chromium', 'webkit', 'all'], default='chromium')
parser.add_argument('--motion', choices=['reduce', 'no-preference'], default='reduce')
parser.add_argument('--only-width', type=int, choices=[320, 360, 390, 430, 844])
args = parser.parse_args()
root_output = ROOT / args.output
root_output.mkdir(parents=True, exist_ok=True)
output = root_output
errors, reports = [], []


def inside(box, width, height):
    return box['x'] >= -1 and box['y'] >= -1 and box['x'] + box['width'] <= width + 1 and box['y'] + box['height'] <= height + 1


def overlaps(a, b):
    return a['x'] < b['x'] + b['width'] and b['x'] < a['x'] + a['width'] and a['y'] < b['y'] + b['height'] and b['y'] < a['y'] + a['height']


def story(page, width, height):
    page.get_by_role('button', name='Historia', exact=True).click()
    for index in range(1, 7):
        page.get_by_label(f'Escena {index} de 6').wait_for()
        page.wait_for_function("Array.from(document.querySelectorAll('.intro-sprite')).every(e=>getComputedStyle(e).backgroundImage!=='none')")
        page.wait_for_timeout(1700 if args.motion == 'no-preference' else 80)
        reveal = page.get_by_role('button', name='Mostrar texto', exact=True)
        if reveal.is_visible():
            reveal.tap()
            page.wait_for_function("document.querySelector('.intro-caption__ghost').textContent.length===0")
        caption = page.locator('.intro-caption').bounding_box()
        actors = [actor.bounding_box() for actor in page.locator('.intro-actor').all()]
        page.screenshot(path=str(output / f'{width}x{height}-historia-{index}.png'))
        if not args.baseline and width < height:
            assert inside(caption, width, height), caption
            assert all(inside(actor, width, height) and actor['y'] + actor['height'] <= caption['y'] for actor in actors), actors
            skip = page.get_by_role('button', name='Saltar ⏭', exact=True).bounding_box()
            assert inside(skip, width, height) and skip['height'] >= 44, skip
            font = page.locator('.intro-caption__text').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
            assert font >= 15, font
        if index < 6:
            if index == 3 and not args.baseline and width < height:
                page.set_viewport_size({'width': height, 'height': width})
                page.wait_for_timeout(80)
                page.get_by_label('Escena 3 de 6').wait_for()
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_timeout(80)
                page.get_by_label('Escena 3 de 6').wait_for()
            if not args.baseline and index % 2:
                page.locator('.intro-next').tap()
            else:
                page.keyboard.press('Enter')
    page.get_by_role('button', name='¡A la aventura!', exact=True).tap()


def prepare_game(page):
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const [{World},{useAppStore},{ALL_LEVELS}]=await Promise.all([
        import(loaded('/src/engine/World.ts')),import(loaded('/src/store/appStore.ts')),import(loaded('/src/data/worlds.ts'))]);
      window.portraitQA={store:useAppStore,world:null};
      useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},
        settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      const update=World.prototype.update;
      World.prototype.update=function(dt){
        const qa=portraitQA;qa.world=this;
        for(let i=0;i<(qa.drive?8:1);i++){
          if(qa.drive&&this.phase==='play'){
            const p=this.player,input=this.input;p.inv=1;input.press('right');input.press('run');
            const front=p.x+p.w,tx=Math.floor(front/40),feet=Math.floor((p.y+p.h-3)/40);
            let jump=false;
            if(p.onGround||p.coyote>0)for(let x=tx;x<=Math.floor((front+95)/40);x++)if(!this.solid(x,12)||this.solid(x,feet))jump=true;
            if(jump&&!input.held.jump)input.press('jump');else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
          }
          update.call(this,dt);if(this.checkpointReached)qa.checkpoint=true;
          if(this.phase==='done'||this.phase==='dying')break;
        }
      };
      useAppStore.getState().startLevel('1-1');
    }""")
    page.wait_for_function("portraitQA.world?.def.id==='1-1'")
    page.wait_for_timeout(200)


def game_layout(page, width, height):
    canvas = page.locator('.stage__canvas').bounding_box()
    touch = page.locator('.touch').bounding_box()
    buttons = {action: page.locator(f'[data-action="{action}"]').bounding_box() for action in ['left', 'right', 'run', 'fire', 'jump']}
    page.screenshot(path=str(output / f'{width}x{height}-juego.png'))
    if not args.baseline:
        assert inside(canvas, width, height), canvas
        assert all(inside(box, width, height) and box['width'] >= 44 and box['height'] >= 44 for box in buttons.values()), buttons
        assert all(not overlaps(a, b) for i, a in enumerate(buttons.values()) for b in list(buttons.values())[i + 1:]), buttons
        if width < height:
            assert canvas['height'] >= width * .75, canvas
            assert not overlaps(canvas, touch), (canvas, touch)
            assert not overlaps(canvas, page.locator('.hud').bounding_box()), canvas
            assert page.locator('.stat__label').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)') >= 10
    return {'viewport': [width, height], 'canvas': canvas, 'touch': touch}


def controls_and_rotation(page, context, width, height, browser_name):
    def point(action, identifier):
        box = page.locator(f'[data-action="{action}"]').bounding_box()
        return {'x': box['x'] + box['width'] / 2, 'y': box['y'] + box['height'] / 2, 'id': identifier}
    run = point('run', 9)
    page.touchscreen.tap(run['x'], run['y'])
    initial = page.evaluate('()=>{const w=portraitQA.world;w.player.fire=true;return {x:w.player.x,y:w.player.y}}')
    if browser_name == 'chromium':
        cdp = context.new_cdp_session(page)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point('right', 1), point('jump', 2), point('fire', 3)]})
    else:
        # WebKit no expone CDP: el gesto de correr y la pausa son táctiles; la combinación usa teclado.
        for key in ['ArrowRight', 'Space', 'KeyC']:
            page.keyboard.down(key)
    page.wait_for_timeout(140)
    result = page.evaluate('()=>({x:portraitQA.world.player.x,y:portraitQA.world.player.y,fireballs:portraitQA.world.fireballs.length})')
    assert result['x'] > initial['x'] and result['y'] < initial['y'] and result['fireballs'] > 0, result
    if browser_name == 'chromium':
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchCancel', 'touchPoints': []})
    else:
        for key in ['ArrowRight', 'Space', 'KeyC']:
            page.keyboard.up(key)
    page.get_by_role('button', name='Pausa', exact=True).tap()
    page.get_by_role('dialog', name='PAUSA', exact=True).wait_for()
    assert page.locator('.touch').count() == 0
    for button in page.get_by_role('dialog').get_by_role('button').all():
        assert inside(button.bounding_box(), width, height), button.bounding_box()
    page.screenshot(path=str(output / f'{width}x{height}-pausa.png'))
    before = page.evaluate('()=>{portraitQA.original=portraitQA.world;return {x:portraitQA.world.player.x,y:portraitQA.world.player.y}}')
    page.set_viewport_size({'width': height, 'height': width})
    page.wait_for_timeout(120)
    assert page.evaluate('portraitQA.original===portraitQA.world')
    after = page.evaluate('()=>({x:portraitQA.world.player.x,y:portraitQA.world.player.y})')
    assert before == after, (before, after)
    page.set_viewport_size({'width': width, 'height': height})
    page.wait_for_timeout(120)
    assert page.evaluate('portraitQA.original===portraitQA.world')
    page.get_by_role('button', name='Continuar', exact=True).tap()
    return {'multitouch': browser_name == 'chromium', 'rotationPreservesRun': True}


def special_levels(page, width, height):
    for level in ['1-2', '1-6']:
        page.evaluate("id=>portraitQA.store.getState().startLevel(id)", level)
        page.wait_for_function('id=>portraitQA.world?.def.id===id', arg=level)
        page.evaluate("""level=>{const w=portraitQA.world,p=w.player;
          if(level==='1-2'){p.x=70*40;p.y=9*40;p.oxygen=5;p.shield=true;p.fire=true;p.snorkel=15;p.ball=true;}
          else{p.x=(w.def.boss.arena[0]+2)*40;p.y=480-p.h;w.camX=(w.def.boss.arena[0]-1)*40;}
        }""", level)
        if level == '1-2':
            page.get_by_role('meter', name='Oxígeno').wait_for()
        else:
            page.locator('.boss-intro').wait_for()
        page.screenshot(path=str(output / f'{width}x{height}-{level}.png'))
        assert inside(page.locator('.hud').bounding_box(), width, height)
        if width < height and not args.baseline:
            stats = [item.bounding_box() for item in page.locator('.hud > *').all()]
            assert all(not overlaps(a, b) for i, a in enumerate(stats) for b in stats[i + 1:]), stats
            lives = page.locator('.hud__lives').bounding_box()
            assert all(inside(item.bounding_box(), lives['x'] + lives['width'], height) for item in page.locator('.hud__lives > *').all())
        if level == '1-6' and not args.baseline and width < height:
            assert page.locator('.boss-intro__text').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)') >= 14


def completion(page, width, height):
    page.evaluate("()=>{const qa=portraitQA;qa.checkpoint=false;qa.store.getState().startLevel('1-1')}")
    page.wait_for_function("portraitQA.world?.def.id==='1-1'&&portraitQA.world.player.x<200")
    page.evaluate('portraitQA.drive=true')
    page.wait_for_function("portraitQA.world.phase==='done'||portraitQA.world.phase==='dying'", timeout=45000)
    page.evaluate('portraitQA.drive=false')
    result = page.evaluate('()=>({phase:portraitQA.world.phase,checkpoint:portraitQA.checkpoint})')
    assert result == {'phase': 'done', 'checkpoint': True}, result
    page.get_by_role('dialog').wait_for()
    for button in page.get_by_role('dialog').get_by_role('button').all():
        assert inside(button.bounding_box(), width, height)
    page.screenshot(path=str(output / f'{width}x{height}-meta.png'))
    return result


with sync_playwright() as playwright:
    for browser_name in ['chromium', 'webkit'] if args.browser == 'all' else [args.browser]:
        output = root_output / browser_name if args.browser == 'all' else root_output
        output.mkdir(parents=True, exist_ok=True)
        browser = getattr(playwright, browser_name).launch(headless=True)
        for width, height in [(320, 568), (360, 800), (390, 844), (430, 932), (844, 390)]:
            if args.only_width and width != args.only_width:
                continue
            context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True, reduced_motion=args.motion)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
            page.goto(args.url)
            page.wait_for_load_state('networkidle')
            story(page, width, height)
            prepare_game(page)
            report = {'browser': browser_name, **game_layout(page, width, height)}
            if not args.baseline:
                report.update(controls_and_rotation(page, context, width, height, browser_name))
                special_levels(page, width, height)
                if width == 390:
                    report['completion'] = completion(page, width, height)
            reports.append(report)
            context.close()
        browser.close()

(root_output / 'revision.json').write_text(json.dumps({'checks': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
print(json.dumps({'viewports': len(reports), 'errors': errors, 'output': str(root_output)}, ensure_ascii=False))
