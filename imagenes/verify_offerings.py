"""Compras, persistencia y controles reales en Chromium; recorridos asistidos aparte."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')
OUT = Path(__file__).resolve().parent / 'verificacion' / 'ofrendas'
OUT.mkdir(parents=True, exist_ok=True)
errors = []
reports = []

INSTRUMENT = """async () => {
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {useAppStore:store}=await import(loaded('/src/store/appStore.ts'));
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
  window.qa={store,world:null,previous:null,updates:0};
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
    const src=args[0]?.src||'';
    if(src.includes('ek-chuah-caricatura.webp'))qa.deityHeight=args[4]*this.getTransform().d;
    if(src.endsWith('/guepardo.webp')&&args.length===9)qa.playerHeight=args[8]*this.getTransform().d;
    return draw.apply(this,args);
  };
  const update=World.prototype.update;
  World.prototype.update=function(dt){qa.world=this;qa.updates++;update.call(this,dt)};
  return ALL_LEVELS.map(l=>l.id);
}"""


def ready(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('.title')
    return page.evaluate(INSTRUMENT)


def seed(page, ids, cacao=130):
    page.evaluate("""({ids,cacao})=>{
      qa.store.setState({progress:{levels:Object.fromEntries(ids.map(id=>[id,{bestScore:0,stars:1,completions:1}]))},
        wallet:{cacao,pending:{}},settings:{...qa.store.getState().settings,introSeen:true,muted:true}});
      qa.store.getState().updateSettings({muted:true});
    }""", {'ids': ids, 'cacao': cacao})


def balance(page):
    return page.evaluate('qa.store.getState().wallet.cacao')


def saved(page):
    return page.evaluate("JSON.parse(localStorage.getItem('temayin:v3'))")


def screenshot(page, name):
    page.screenshot(path=str(OUT / f'{name}.png'), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
    ids = ready(page)
    seed(page, ids)
    page.evaluate("qa.store.getState().startLevel('1-3')")
    page.wait_for_selector('.offering')
    page.wait_for_timeout(350)
    assert page.evaluate('qa.updates') == 0, 'El mundo no debe simularse durante el encuentro'
    page.wait_for_function('qa.deityHeight&&qa.playerHeight')
    assert page.evaluate('Math.abs(qa.deityHeight-qa.playerHeight)<0.01'), 'Ek Chuah y Temayin deben tener la misma altura visible'
    assert page.locator('#offering-title').evaluate('e=>e===document.activeElement')
    for width, height, name in [(1280, 800, 'escritorio'), (390, 844, 'movil'), (360, 640, 'movil-pequeno'), (844, 390, 'horizontal')]:
        page.set_viewport_size({'width': width, 'height': height})
        assert page.evaluate('document.querySelector(".offering").scrollWidth<=innerWidth'), name
        screenshot(page, f'{name}-inicio')
        for button in page.locator('.offering button').all():
            box = button.bounding_box()
            assert box and box['height'] >= 44, (name, box)
    page.set_viewport_size({'width': 1280, 'height': 800})
    page.get_by_role('button', name='Comprar Fuego del habanero por 30 cacao', exact=True).evaluate('e=>{e.click();e.click()}')
    assert balance(page) == 100
    page.get_by_role('button', name='Comprar Escudo de jade por 20 cacao', exact=True).click()
    page.get_by_role('button', name='Comprar Corazón de jade por 50 cacao', exact=True).click()
    assert balance(page) == 30
    assert saved(page)['wallet']['pending']['1-3'] == ['fire', 'shield', 'life']
    screenshot(page, 'compras-recibidas')

    # Cerrar antes de empezar conserva tanto el gasto como lo adquirido.
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('.title')
    page.evaluate(INSTRUMENT)
    page.evaluate("qa.store.getState().startLevel('1-3')")
    try:
        page.wait_for_selector('.offering', timeout=10000)
    except Exception:
        print(page.evaluate('()=>({screen:qa.store.getState().screen,run:qa.store.getState().run,progress:qa.store.getState().progress,text:document.body.innerText,modules:performance.getEntriesByType("resource").filter(e=>e.name.includes("appStore")).map(e=>e.name)})'), flush=True)
        screenshot(page, 'error-recarga')
        raise
    assert page.get_by_role('button', name='Fuego del habanero: recibida', exact=True).is_disabled()
    assert balance(page) == 30
    page.get_by_role('button', name='Continuar la aventura').click()
    page.wait_for_function('qa.world?.def.id==="1-3"')
    assert page.evaluate('qa.world.player.fire&&qa.world.player.shield&&qa.world.session.lives===4')
    assert saved(page)['wallet']['pending'] == {}
    screenshot(page, 'bendiciones-en-juego')

    # Recoger cacao publica el HUD y guarda sin recrear el motor ni mutar Run.
    page.evaluate('qa.previous=qa.world;qa.beforeRun=JSON.stringify(qa.store.getState().run);for(let i=0;i<10;i++)qa.world.addCoin(0,0)')
    page.wait_for_function('qa.store.getState().wallet.cacao===40')
    assert page.evaluate('qa.world===qa.previous&&JSON.stringify(qa.store.getState().run)===qa.beforeRun')
    assert saved(page)['wallet']['cacao'] == 40
    page.evaluate('qa.world.checkpointReached=true;qa.world.die()')
    page.wait_for_function('qa.world!==qa.previous')
    assert page.evaluate('qa.world.checkpointReached&&!qa.world.player.fire&&!qa.world.player.shield&&qa.world.session.lives===3')
    assert balance(page) == 40
    assert page.locator('.offering').count() == 0
    page.evaluate('qa.world.session.lives=1;qa.world.die()')
    page.wait_for_selector('.panel--lose')
    assert saved(page)['wallet']['cacao'] == 40
    screenshot(page, 'fin-de-partida')
    # Reintentar abre un encuentro nuevo, sin regalos ya consumidos.
    page.evaluate('qa.store.getState().retryLevel()')
    page.wait_for_selector('.offering')
    assert page.get_by_role('button', name='Comprar Corazón de jade por 50 cacao: cacao insuficiente', exact=True).is_disabled()
    page.keyboard.press('Escape')
    page.wait_for_selector('.game')
    page.wait_for_function('qa.world.player.fire===false&&qa.world.session.lives===3')
    page.evaluate('qa.world.phase="done"')
    page.wait_for_selector('.panel--win')
    assert balance(page) == 40
    assert page.evaluate('qa.store.getState().progress.levels["1-3"].completions') == 2
    screenshot(page, 'resultado')
    page.evaluate("qa.store.getState().startLevel('1-4',{score:500,coins:0,lives:3})")
    page.wait_for_function('qa.world?.def.id==="1-4"')
    assert page.evaluate('qa.world.session.coins') == 40
    page.evaluate("qa.store.getState().go('levels')")
    page.wait_for_selector('.menu__wallet')
    assert '40' in page.locator('.menu__wallet').inner_text()
    screenshot(page, 'saldo-en-mapa')
    for level in ['1-3', '1-6', '2-7', '3-5', '4-5', '5-6', '6-6']:
        page.evaluate('id=>qa.store.getState().startLevel(id)', level)
        page.wait_for_selector('.offering')
        screenshot(page, f'{level}-encuentro')
        page.get_by_role('button', name='Continuar la aventura').click()
        page.wait_for_function('id=>qa.world?.def.id===id', arg=level)
        assert page.evaluate('qa.world.timeLeft') > 0
        assert page.evaluate('qa.world.session.coins') == 40
        page.evaluate("qa.store.getState().go('levels')")
    reports.append({'desktop': 'Compras, doble clic, recarga, poderes, checkpoint, fin de partida, resultado, saldo y siete encuentros correctos.'})
    context.close()

    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    ids = ready(page)
    seed(page, ids, cacao=20)
    page.evaluate("qa.store.getState().startLevel('1-3')")
    page.wait_for_selector('.offering')
    shield = page.get_by_role('button', name='Comprar Escudo de jade por 20 cacao', exact=True)
    shield.tap()
    assert balance(page) == 0
    assert page.get_by_role('button', name='Escudo de jade: recibida', exact=True).is_disabled()
    assert page.locator('.blessing button:enabled').count() == 0
    screenshot(page, 'movil-compra-exacta')
    page.set_viewport_size({'width': 844, 'height': 390})
    assert balance(page) == 0
    page.get_by_role('button', name='Continuar la aventura').tap()
    page.wait_for_function('qa.world?.player.shield')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='Pausa', exact=True).tap()
    page.wait_for_selector('.overlay')
    page.get_by_role('button', name='Salir al menú').tap()
    page.wait_for_selector('.menu__wallet')
    assert saved(page)['wallet']['cacao'] == 0
    reports.append({'mobile': 'Compra táctil con saldo exacto, botones sin fondos, rotación y pausa correctos.'})
    context.close()
    browser.close()

(OUT / 'informe.json').write_text(json.dumps({'reports': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
print(json.dumps({'reports': reports, 'errors': errors}, ensure_ascii=False))
