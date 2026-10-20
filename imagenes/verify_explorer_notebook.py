"""Comprueba el cuaderno, las nueve recogidas y la pausa en Chromium emulado."""
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5196')
OUTPUT = Path('imagenes/.temp/cuaderno-explorador')
ERRORS = []
RESULTS = []
sys.stdout.reconfigure(encoding='utf-8')

INSTALL = """async () => {
  const loaded = path => performance.getEntriesByType('resource').filter(item => new URL(item.name).pathname === path).at(-1)?.name ?? path;
  const { useAppStore } = await import(loaded('/src/store/appStore.ts'));
  const { World } = await import(loaded('/src/engine/World.ts'));
  const { DEATH_DELAY } = await import(loaded('/src/engine/constants.ts'));
  window.qa = { store: useAppStore, world: null, hold: true, tick: World.prototype.update, deathDelay: DEATH_DELAY };
  World.prototype.update = function(dt) { qa.world = this; if (!qa.hold) qa.tick.call(this, dt); };
  useAppStore.setState({ settings: { ...useAppStore.getState().settings, muted: true, introSeen: true } });
}"""


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def opened(page):
    page.locator('dialog.notebook[open]').wait_for()
    check(page.evaluate('document.querySelector("dialog.notebook").contains(document.activeElement)'), 'El foco entra en el cuaderno')


def notebook_size(page):
    return page.evaluate("async () => (await import('/src/data/explorerNotebook/index.ts')).NOTEBOOK_ENTRIES.length")


def ready_art(page):
    page.wait_for_function('document.querySelector(".notebook-header .notebook-toh__image")?.naturalWidth > 0')
    page.wait_for_function('Array.from(document.querySelectorAll(".notebook-toh__image")).every(image => image.complete && image.naturalWidth > 0)')
    width = page.evaluate('''async () => {
      const source = getComputedStyle(document.querySelector('.notebook')).borderImageSource;
      const image = new Image(); image.src = source.slice(5, -2);
      await image.decode(); return image.naturalWidth;
    }''')
    check(width == 1536, 'Textura del pergamino descargada y decodificada')
    page.evaluate('''async () => {
      await Promise.all(Array.from(document.querySelectorAll('.notebook img')).map(image => image.decode()));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }''')


def initial_checks(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    opened(page)
    check(page.locator('[data-discovery]:disabled').count() == notebook_size(page), 'Todas las páginas pendientes al comenzar')
    check(page.locator('.notebook-progress').inner_text().startswith('0'), 'Colección vacía')
    check(page.locator('.notebook .station-photo img').count() == 0, 'No descarga fotografías de páginas pendientes')
    page.wait_for_function('Array.from(document.querySelectorAll(".notebook-toh__image")).every(image => image.complete && image.naturalWidth > 0)')
    check(page.locator('.notebook-header .notebook-toh__image').is_visible(), 'Retrato de Toh visible en el encabezado')
    check(page.locator('.notebook-cover .notebook-toh__image').is_visible(), 'Toh completo visible en la portada')
    page.screenshot(path=str(OUTPUT / 'cuaderno-inicial.png'))
    page.keyboard.press('Escape')
    check(page.locator('dialog').count() == 0, 'Escape cierra el cuaderno')
    check(page.evaluate('document.activeElement.textContent.includes("Cuaderno")'), 'Devuelve el foco al botón de origen')
    page.evaluate(INSTALL)
    RESULTS.append('Colección inicial, privacidad de páginas pendientes, cierre con Escape y restauración del foco.')


def start(page, level_id):
    page.evaluate("""id => {
      const state = qa.store.getState();
      qa.store.setState({progress: {...state.progress, levels: {...state.progress.levels,
        [id]: {bestScore: 0, stars: 1, completions: 1}}}});
      qa.world = null; qa.hold = true;
      qa.store.getState().startLevel(id);
      if (qa.store.getState().screen === 'offering') qa.store.getState().continueOffering();
    }""", level_id)
    page.wait_for_function('id => qa.world?.def.id === id', arg=level_id)
    page.locator('.level-loading').wait_for(state='detached')


def collect(page, mark_id):
    page.evaluate("""id => {
      const world = qa.world, mark = world.level.discoveries.find(item => item.id === id), player = world.player;
      player.x = mark.x - 40; player.y = mark.y + mark.h - player.h;
      player.vx = 0; player.vy = 0; player.inv = 10;
      player.onGround = id !== 'bacalar-estromatolitos';
      world.camX = Math.max(0, player.x - 350); world.input.reset(); world.input.press('right');
      for (let step = 0; step < 90 && !world.discoveries.includes(id); step++) qa.tick.call(world, 1/120);
      world.input.reset();
    }""", mark_id)
    page.wait_for_function('id => JSON.parse(localStorage.getItem("temayin:v3"))?.progress?.discoveries?.includes(id)', arg=mark_id)
    check(page.evaluate('qa.world.phase === "play"'), 'La aproximación conserva la vida')
    check(page.evaluate('qa.world.stromatolites.every(item => !item.damaged)'), 'Sin dañar estromatolitos')


def pause_checks(page):
    page.evaluate('qa.hold = false')
    page.keyboard.press('Escape')
    page.get_by_role('dialog', name='PAUSA', exact=True).wait_for()
    snapshot = page.evaluate('({x: qa.world.player.x, y: qa.world.player.y, time: qa.world.timeLeft, phaseT: qa.world.phaseT})')
    page.get_by_role('button', name='Cuaderno de Toh', exact=False).click()
    opened(page)
    page.locator('[data-discovery="palenque-palacio"]').click()
    page.locator('[data-notebook-page="palenque-palacio"]').wait_for()
    page.keyboard.press('ArrowRight')
    page.wait_for_timeout(1200)
    check(snapshot == page.evaluate('({x: qa.world.player.x, y: qa.world.player.y, time: qa.world.timeLeft, phaseT: qa.world.phaseT})'), 'El motor permanece pausado al leer')
    for step in range(24):
        page.keyboard.press('Tab')
        check(page.evaluate('document.querySelector("dialog.notebook").contains(document.activeElement)'),
              f'El foco permanece dentro del diálogo: paso {step}, activo ' + page.evaluate('document.activeElement.tagName'))
    page.screenshot(path=str(OUTPUT / 'cuaderno-pausa.png'))
    page.keyboard.press('Escape')
    check(page.get_by_role('dialog', name='PAUSA', exact=True).is_visible(), 'Cerrar conserva la pausa')
    check(snapshot == page.evaluate('({x: qa.world.player.x, y: qa.world.player.y, time: qa.world.timeLeft, phaseT: qa.world.phaseT})'), 'Cerrar no reinicia el nivel')
    page.get_by_role('button', name='Continuar', exact=True).click()
    page.wait_for_function('qa.world.phaseT > ' + str(snapshot['phaseT']))
    page.evaluate('qa.hold = true')
    RESULTS.append('Pausa real: posición y tiempo constantes durante lectura, foco atrapado y Escape sin reanudar la partida.')


def finish_checks(page):
    page.evaluate("""() => {
      const world = qa.world, player = world.player;
      player.x = (world.level.flagX - 2) * 40; player.y = 480 - player.h;
      player.onGround = true; player.vx = 0; player.vy = 0; player.inv = 10;
      world.input.press('right');
      for (let step = 0; step < 3000 && world.phase !== 'done'; step++) qa.tick.call(world, 1/120);
    }""")
    page.get_by_role('dialog', name='¡NIVEL COMPLETADO!', exact=True).wait_for()
    page.get_by_text('3 nuevos descubrimientos registrados en este intento.', exact=True).wait_for()
    page.get_by_role('button', name='Leer descubrimientos', exact=False).click()
    opened(page)
    page.keyboard.press('Escape')
    check(page.get_by_role('dialog', name='¡NIVEL COMPLETADO!', exact=True).is_visible(), 'Cerrar devuelve a los resultados')
    RESULTS.append('Meta preparada: resumen de tres páginas nuevas, lectura desde resultados y regreso sin duplicar finalización.')


def collection_checks(page):
    marks = {
        '1-1': ['palenque-palacio', 'palenque-saraguatos', 'palenque-orquideas'],
        '2-3': ['campeche-muralla', 'campeche-baluartes', 'campeche-puertas'],
        '6-5': ['bacalar-laguna', 'bacalar-estromatolitos', 'bacalar-fuerte'],
    }
    for level_id, ids in marks.items():
        start(page, level_id)
        for mark_id in ids:
            collect(page, mark_id)
        page.screenshot(path=str(OUTPUT / f'{level_id}-descubrimientos.png'))
        if level_id == '1-1':
            pause_checks(page)
            page.evaluate('qa.oldWorld = qa.world; qa.world.die(); qa.world.phaseT = qa.deathDelay + 1;')
            page.wait_for_function('qa.world !== qa.oldWorld')
            check(page.evaluate('qa.world.discoveries.length') == 3, 'La muerte conserva las tres páginas')
        if level_id == '6-5':
            finish_checks(page)
        page.evaluate('qa.store.getState().go("levels")')
        page.locator('.level-map-menu:not([inert])').wait_for()
    check(page.evaluate('qa.store.getState().progress.discoveries.length') == 9, 'Se han recogido nueve páginas reales')
    page.locator('.map-dock').get_by_role('button', name='Cuaderno de Toh', exact=False).click()
    opened(page)
    page.get_by_label('Categoría', exact=True).select_option('Naturaleza')
    page.get_by_label('Lugar', exact=True).select_option('Campeche')
    check(page.locator('.notebook-empty').is_visible(), 'Explica una combinación vacía de filtros')
    page.get_by_label('Categoría', exact=True).select_option('Todas')
    check(page.locator('[data-discovery]').count() == 3, 'Filtra por lugar')
    page.get_by_label('Lugar', exact=True).select_option('Todos')
    for mark_id in [item for ids in marks.values() for item in ids]:
        page.locator(f'[data-discovery="{mark_id}"]').click()
        page.locator(f'[data-notebook-page="{mark_id}"]').wait_for()
        page.wait_for_function('document.querySelector(".notebook-page .station-photo img")?.naturalWidth > 0')
    page.screenshot(path=str(OUTPUT / 'cuaderno-completo.png'))
    page.keyboard.press('Escape')
    check(page.evaluate('qa.store.getState().progress.readDiscoveries.length') == 9, 'Guarda las nueve lecturas')
    RESULTS.append('Nueve marcas recogidas por aproximación física preparada, muerte, filtros, nueve fotografías y persistencia de lectura.')


def reload_checks(page):
    before = page.evaluate('localStorage.getItem("temayin:v3")')
    page.reload()
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    opened(page)
    check(page.locator('[data-discovery]:disabled').count() == notebook_size(page) - 9, 'Recupera los nueve descubrimientos del recorrido piloto')
    check(page.locator('.notebook-entry em').count() == 0, 'Recupera las lecturas sin nuevas falsas')
    check(page.evaluate('localStorage.getItem("temayin:v3")') == before, 'Abrir el índice no modifica el guardado')
    page.keyboard.press('Escape')
    page.route('**/assets/cuaderno/fotos/bacalar-estromatolitos.webp', lambda route: route.abort())
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    page.locator('[data-discovery="bacalar-estromatolitos"]').click()
    page.get_by_text('Fotografía no disponible.', exact=False).wait_for()
    check(page.get_by_text('Los estromatolitos son estructuras minerales', exact=False).is_visible(), 'Un fallo de foto conserva la lectura')
    page.screenshot(path=str(OUTPUT / 'foto-fallida.png'))
    page.keyboard.press('Escape')
    page.unroute('**/assets/cuaderno/fotos/bacalar-estromatolitos.webp')
    RESULTS.append('Recarga conserva colección y lecturas; fallo de fotografía recuperable sin perder texto, fuentes ni créditos.')
    return before


def route_checks(page):
    page.evaluate(INSTALL)
    page.evaluate(Path('imagenes/explorer_notebook_routes.js').read_text(encoding='utf-8'))
    for level_id in ['1-1', '2-3', '6-5']:
        start(page, level_id)
        report = page.evaluate('qa.route(false)')
        check(report['phase'] == 'done' and report['checkpoint'], f'Recorrido completo: {report}')
        check(not report['damaged'], 'El recorrido de Bacalar protege estromatolitos')
        page.screenshot(path=str(OUTPUT / f'{level_id}-meta.png'))
        page.evaluate('qa.store.getState().go("levels")')
        start(page, level_id)
        report = page.evaluate('qa.route(true)')
        check(report['phase'] == 'done', f'Recorrido desde checkpoint: {report}')
        page.evaluate('qa.store.getState().go("levels")')
    RESULTS.append('Tres recorridos desde inicio a checkpoint y meta, y tres desde checkpoint; entradas físicas con contacto protegido, sin teletransporte.')


def art_fallback_checks(page):
    page.route('**/assets/cuaderno/*.webp', lambda route: route.abort())
    page.reload()
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cuaderno de Toh', exact=True).click()
    opened(page)
    page.locator('.notebook-cover .notebook-toh__fallback').wait_for()
    page.wait_for_function('getComputedStyle(document.querySelector(".notebook-toh__fallback")).backgroundImage !== "none"')
    check(page.locator('.notebook-cover h3').is_visible(), 'Sin el arte nuevo sigue disponible la lectura')
    page.screenshot(path=str(OUTPUT / 'arte-respaldo.png'))
    page.keyboard.press('Escape')
    page.unroute('**/assets/cuaderno/*.webp')
    RESULTS.append('Pergamino e ilustraciones nuevos, retratos de Toh y respaldo al fallar el arte: papel legible y sprite original.')


def mobile_checks(browser, saved):
    for width, height in [(390, 844), (320, 740), (844, 390)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True, is_mobile=True, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: ERRORS.append(str(error)))
        page.goto(URL)
        page.evaluate('(saved) => localStorage.setItem("temayin:v3", saved)', saved)
        page.reload()
        page.wait_for_load_state('networkidle')
        page.get_by_role('button', name='Jugar', exact=True).tap()
        page.locator('.level-map-menu:not([inert])').wait_for()
        button = page.locator('.map-dock').get_by_role('button', name='Cuaderno de Toh', exact=True)
        box = button.bounding_box()
        check(box['x'] >= 0 and box['x'] + box['width'] <= width, 'Botón del mapa dentro de la pantalla')
        page.screenshot(path=str(OUTPUT / f'mapa-{width}x{height}.png'))
        button.tap()
        opened(page)
        page.locator('[data-discovery="bacalar-estromatolitos"]').tap()
        page.locator('[data-notebook-page="bacalar-estromatolitos"]').wait_for()
        ready_art(page)
        page.wait_for_function('document.querySelector(".notebook-page .station-photo img")?.naturalWidth > 0')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Sin desbordamiento horizontal')
        close = page.get_by_role('button', name='Cerrar cuaderno').bounding_box()
        check(close['y'] >= 0 and close['y'] + close['height'] <= height, 'Cierre siempre visible')
        page.screenshot(path=str(OUTPUT / f'cuaderno-{width}x{height}.png'))
        page.get_by_role('button', name='Cerrar cuaderno').tap()
        check(page.locator('dialog').count() == 0, 'Cierra con toque')
        context.close()
    RESULTS.append('Móvil táctil emulado: 390×844, 320×740 y 844×390; acceso desde mapa, lectura y cierre fijo.')


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
        page.on('pageerror', lambda error: ERRORS.append(str(error)))
        try:
            initial_checks(page)
            collection_checks(page)
            saved = reload_checks(page)
            mobile_checks(browser, saved)
            art_fallback_checks(page)
            route_checks(page)
        except Exception:
            page.screenshot(path=str(OUTPUT / 'fallo.png'))
            print(json.dumps({'errors': ERRORS, 'checks': RESULTS,
                              'active': page.evaluate('document.activeElement.tagName')}, ensure_ascii=False))
            raise
        browser.close()
    check(not ERRORS, str(ERRORS))
    (OUTPUT / 'fallo.png').unlink(missing_ok=True)
    report = {'checks': RESULTS, 'errors': ERRORS, 'scope': 'Aproximaciones preparadas con colisiones y oxígeno reales; no evalúa dificultad humana ni sustituye un móvil físico.'}
    (OUTPUT / 'revision.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
