"""Verifica pan, zoom, teclado, tacto y maquetación del mapa de la península en Chromium.

Chromium emulado (ratón, CDP táctil) no sustituye un móvil físico ni mide la sensación de uso.
"""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')
OUTPUT = Path(os.environ.get('TEMAYIN_MAP_QA_OUTPUT', str(Path(__file__).resolve().parent / 'verificacion' / 'mapa-peninsula' / 'gestos')))
OUTPUT.mkdir(parents=True, exist_ok=True)
RESULTS, ERRORS = [], []
NAV = 'Mundos de la aventura'
RESET = 'Reencuadrar el mapa'


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower())[:60].strip('-')


def record(page, name, ok, detail=''):
    shot_name = None
    if not ok:
        shot_name = 'FALLA-' + slug(name) + '.png'
        page.screenshot(path=str(OUTPUT / shot_name), animations='disabled')
    RESULTS.append({'prueba': name, 'resultado': 'OK' if ok else 'FALLA', 'detalle': str(detail), 'captura': shot_name})
    print(('OK    ' if ok else 'FALLA ') + name + (f'  [{detail}]' if detail else ''))


def shot(page, name):
    page.screenshot(path=str(OUTPUT / name), animations='disabled')


def guarded(page, name, function):
    try:
        function()
    except Exception as error:  # una sección rota no oculta el resto
        record(page, name + ': excepción', False, repr(error)[:300])


def vb(page):
    return page.evaluate("""() => { const b = document.querySelector('.atlas__drawing').viewBox.baseVal;
      return { x: b.x, y: b.y, width: b.width, height: b.height }; }""")


def vb_text(page):
    return page.locator('.atlas__drawing').get_attribute('viewBox')


def settle(page, frames=3):
    page.evaluate("""n => new Promise(done => { const f = i => i ? requestAnimationFrame(() => f(i - 1)) : done(); f(n); })""", frames)


def map_point(page, px, py):
    return page.evaluate("""([px, py]) => { const s = document.querySelector('.atlas__drawing'), r = s.getBoundingClientRect(), b = s.viewBox.baseVal;
      return { x: b.x + (px - r.left) / r.width * b.width, y: b.y + (py - r.top) / r.height * b.height }; }""", [px, py])


def center(box):
    return box['x'] + box['width'] / 2, box['y'] + box['height'] / 2


def camera(page):
    return page.locator('.atlas').get_attribute('data-map-camera')


def selected_station(page):
    return page.locator('[data-station][aria-pressed="true"]').first.get_attribute('data-station')


def inactive(page, name):
    """Los botones de zoom usan aria-disabled (no disabled) para conservar el foco al llegar al tope."""
    button = page.get_by_role('button', name=name)
    return button.get_attribute('aria-disabled') == 'true' and button.get_attribute('disabled') is None


def reset_camera(page):
    if not inactive(page, RESET):
        page.get_by_role('button', name=RESET).click()
    if page.locator('.atlas').get_attribute('data-map-view') == 'tramo':
        page.locator('.map-chart__toolbar button').click()
    settle(page, 3)


def open_map(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Jugar', exact=True).click()
    page.locator('.atlas').wait_for()
    page.locator('.level-map-menu:not([inert])').wait_for()
    page.wait_for_timeout(300)


def fixture_full(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate("""async () => {
      const loaded = path => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === path).at(-1)?.name ?? path;
      const { useAppStore } = await import(loaded('/src/store/appStore.ts'));
      const { ALL_LEVELS, WORLDS } = await import(loaded('/src/data/worlds.ts'));
      const state = useAppStore.getState();
      localStorage.setItem('temayin:v3', JSON.stringify({
        progress: { levels: Object.fromEntries(ALL_LEVELS.map(l => [l.id, { stars: 2, bestScore: 1200, completions: 1 }])), tickets: WORLDS.map(w => w.id) },
        settings: { ...state.settings, introSeen: true }, wallet: { cacao: 150, pending: {} } }));
    }""")
    open_map(page)


def full_map_bounds(page):
    return page.evaluate("""async () => {
      const path = '/src/ui/components/map/mapModel.ts';
      const url = performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === path).at(-1)?.name ?? path;
      return (await import(url)).FULL_MAP; }""")


def pick_station(page, exclude=()):
    """Estación visible, sin tapar y no seleccionada; devuelve [id, x, y]."""
    return page.evaluate("""exclude => { for (const b of document.querySelectorAll('[data-station]')) {
      const r = b.getBoundingClientRect(); if (r.width < 4) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 20 || y < 20 || x > innerWidth - 20 || y > innerHeight - 20) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit !== b && !b.contains(hit)) continue;
      if (b.getAttribute('aria-pressed') === 'true' || exclude.includes(b.dataset.station)) continue;
      return [b.dataset.station, x, y]; } return null; }""", list(exclude))


def drag(page, x0, y0, dx, dy, steps=12):
    page.mouse.move(x0, y0)
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(x0 + dx * i / steps, y0 + dy * i / steps)
    page.mouse.up()
    settle(page)


def close_panel(page):
    if page.locator('.map-panel').get_attribute('hidden') is None:
        page.get_by_role('button', name='Cerrar itinerario').click()


def wheel_at(page, x, y, delta, frames=4):
    page.mouse.move(x, y)
    page.mouse.wheel(0, delta)
    settle(page, frames)


# ---------------------------------------------------------------- ratón
def wheel_checks(page):
    page.set_viewport_size({'width': 1440, 'height': 1080})
    close_panel(page)
    reset_camera(page)
    box = page.locator('.atlas').bounding_box()
    for label, fx, fy, delta in [('centro', .5, .5, -300), ('punto excéntrico', .3, .35, -200)]:
        before_view = vb(page)
        px, py = box['x'] + box['width'] * fx, box['y'] + box['height'] * fy
        before = map_point(page, px, py)
        wheel_at(page, px, py, delta)
        after_view, after = vb(page), map_point(page, px, py)
        drift = max(abs(after['x'] - before['x']), abs(after['y'] - before['y']))
        record(page, f'Rueda ({label}) reduce el viewBox', after_view['width'] < before_view['width'] - 1e-6,
               f"{before_view['width']:.1f} -> {after_view['width']:.1f}")
        record(page, f'Rueda ({label}) mantiene el punto bajo el cursor (max 1 unidad)', drift <= 1, f'deriva {drift:.3f}')
    record(page, 'Tras la rueda la cámara es libre', camera(page) == 'libre', camera(page))
    shot(page, 'rueda-acercado.png')
    before_view = vb(page)
    wheel_at(page, box['x'] + box['width'] * .5, box['y'] + box['height'] * .5, 250)
    record(page, 'Rueda hacia abajo aleja', vb(page)['width'] > before_view['width'] + 1e-6)


def mouse_drag_checks(page):
    close_panel(page)
    reset_camera(page)
    box = page.locator('.atlas').bounding_box()
    wheel_at(page, box['x'] + box['width'] * .5, box['y'] + box['height'] * .5, -300)
    start_selected = selected_station(page)
    before = vb(page)
    upp = before['width'] / page.locator('.atlas__drawing').bounding_box()['width']
    x0, y0 = box['x'] + box['width'] * .08, box['y'] + box['height'] * .5
    on_button = page.evaluate('([x, y]) => !!document.elementFromPoint(x, y)?.closest("button")', [x0, y0])
    drag(page, x0, y0, 200, 0)
    after = vb(page)
    expected = -200 * upp
    record(page, 'Punto de arrastre en el mar no es un botón', not on_button)
    record(page, 'Arrastre de 200 px desplaza viewBox.x lo esperado (+-1.5)', abs((after['x'] - before['x']) - expected) <= 1.5,
           f"dx {after['x'] - before['x']:.2f} esperado {expected:.2f}")
    record(page, 'Arrastre no cambia el ancho del viewBox', abs(after['width'] - before['width']) < 1e-6)
    record(page, 'Arrastre sobre el mar no cambia la estación seleccionada', selected_station(page) == start_selected,
           f'{start_selected} -> {selected_station(page)}')
    shot(page, 'arrastre-raton.png')


def click_vs_drag_checks(page):
    close_panel(page)
    reset_camera(page)
    pre = selected_station(page)
    x, y = center(page.locator('[data-station="3-2"]').bounding_box())
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 2, y + 1)
    page.mouse.up()
    settle(page)
    record(page, 'Clic con 3 px o menos de movimiento sobre Mérida (3-2) la selecciona',
           selected_station(page) == '3-2' and pre != '3-2', f'{pre} -> {selected_station(page)}')
    close_panel(page)
    reset_camera(page)
    other = pick_station(page, exclude=['3-2'])
    if not other:
        record(page, 'Hay otra estación pulsable para el arrastre', False)
        return
    ident, x, y = other
    pre, pre_view = selected_station(page), vb(page)
    drag(page, x, y, 40, 0)
    record(page, f'Arrastre de 40 px desde la estación {ident} NO la selecciona', selected_station(page) == pre and pre != ident,
           f'{pre} -> {selected_station(page)}')
    record(page, 'El arrastre desde una estación sí desplaza el mapa', abs(vb(page)['x'] - pre_view['x']) > 1)
    page.get_by_role('button', name=RESET).click()
    settle(page)
    page.locator(f'[data-station="{ident}"]').click()
    settle(page)
    record(page, 'Tras un arrastre, el siguiente clic sí selecciona', selected_station(page) == ident, selected_station(page))
    close_panel(page)


def extreme_checks(page):
    close_panel(page)
    reset_camera(page)
    bounds = full_map_bounds(page)
    box = page.locator('.atlas').bounding_box()
    mid = (box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)

    def inside():
        v = vb(page)
        cx, cy = v['x'] + v['width'] / 2, v['y'] + v['height'] / 2
        ok = bounds['x'] - .5 <= cx <= bounds['x'] + bounds['width'] + .5 and bounds['y'] - .5 <= cy <= bounds['y'] + bounds['height'] + .5
        return ok, (cx, cy)

    for label, sx, sy in [('derecha', 1, 0), ('izquierda', -1, 0), ('abajo', 0, 1), ('arriba', 0, -1), ('diagonal', 1, 1)]:
        wheel_at(page, mid[0], mid[1], -2000, 3)
        for _ in range(8):
            drag(page, box['x'] + box['width'] * (.1 if sx > 0 else .9 if sx < 0 else .5), box['y'] + box['height'] * (.1 if sy > 0 else .9 if sy < 0 else .5),
                 sx * box['width'] * .8, sy * box['height'] * .8, 8)
        ok, c = inside()
        record(page, f'Arrastres extremos ({label}) dejan el centro dentro de la península', ok, f'centro ({c[0]:.0f},{c[1]:.0f}) mapa {bounds}')
        if label == 'diagonal':
            shot(page, 'extremo-arrastre.png')
    for _ in range(8):
        wheel_at(page, mid[0], mid[1], -100000, 2)
    record(page, 'Con zoom máximo Acercar queda deshabilitado', inactive(page, 'Acercar el mapa'))
    record(page, 'Con zoom máximo el centro sigue dentro', inside()[0])
    shot(page, 'zoom-maximo.png')
    for _ in range(10):
        wheel_at(page, mid[0], mid[1], 100000, 2)
    record(page, 'Con zoom mínimo Alejar queda deshabilitado', inactive(page, 'Alejar el mapa'))
    record(page, 'Con zoom mínimo el centro sigue dentro', inside()[0])
    shot(page, 'zoom-minimo.png')
    reset_camera(page)


def button_checks(page):
    close_panel(page)
    reset_camera(page)
    initial, initial_text = vb(page), vb_text(page)
    record(page, 'Reencuadrar está deshabilitado con la cámara por defecto', inactive(page, RESET))
    page.get_by_role('button', name='Acercar el mapa').click()
    settle(page)
    zoomed = vb(page)
    record(page, 'Acercar reduce el viewBox', zoomed['width'] < initial['width'] - 1e-6, f"{initial['width']:.1f} -> {zoomed['width']:.1f}")
    page.get_by_role('button', name='Alejar el mapa').click()
    settle(page)
    back = vb(page)
    diff = max(abs(back[k] - initial[k]) for k in back)
    record(page, 'Acercar y Alejar devuelven el viewBox inicial', diff < 1e-6, f'diferencia máx {diff:.2e}; texto idéntico: {vb_text(page) == initial_text} ({initial_text} / {vb_text(page)})')
    page.get_by_role('button', name='Acercar el mapa').click()
    settle(page)
    page.get_by_role('button', name=RESET).click()
    settle(page)
    record(page, 'Reencuadrar devuelve exactamente el viewBox inicial (texto idéntico)', vb_text(page) == initial_text, f'{initial_text} / {vb_text(page)}')
    record(page, 'Tras reencuadrar data-map-camera=encuadre', camera(page) == 'encuadre', camera(page))


def reframe_checks(page):
    close_panel(page)
    reset_camera(page)
    box = page.locator('.atlas').bounding_box()
    mid = (box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    wheel_at(page, mid[0], mid[1], -300)
    pre = camera(page)
    page.get_by_role('navigation', name=NAV).get_by_role('button').nth(3).click()
    settle(page, 4)
    record(page, 'Cambiar de pestaña de mundo reencuadra', pre == 'libre' and camera(page) == 'encuadre', f'{pre} -> {camera(page)}')
    wheel_at(page, mid[0], mid[1], -200)
    pre = camera(page)
    page.locator('.map-chart__toolbar button').click()
    settle(page, 4)
    record(page, 'El conmutador Acercar/Ver península reencuadra', pre == 'libre' and camera(page) == 'encuadre', f'{pre} -> {camera(page)}')


def focus_and_keys_checks(page):
    close_panel(page)
    reset_camera(page)
    zoom_in = page.get_by_role('button', name='Acercar el mapa')
    zoom_in.focus()
    for _ in range(14):
        if inactive(page, 'Acercar el mapa'):
            break
        page.keyboard.press('Enter')
        settle(page, 2)
    record(page, 'Al llegar al tope Acercar sigue con el foco (aria-disabled)',
           inactive(page, 'Acercar el mapa') and page.evaluate('document.activeElement.getAttribute("aria-label")') == 'Acercar el mapa')
    before = vb_text(page)
    page.keyboard.press('Enter')
    settle(page, 2)
    record(page, 'Pulsar un botón aria-disabled no ejecuta la acción', vb_text(page) == before)
    reset_camera(page)
    station = page.locator('[data-station]').first
    station.focus()
    before = vb_text(page)
    page.keyboard.press('ArrowRight')
    settle(page, 2)
    record(page, 'Las flechas sobre una estación enfocada no mueven el mapa', vb_text(page) == before)
    page.locator('.atlas').focus()
    page.keyboard.press('Tab')
    page.keyboard.press('Shift+Tab')
    visible = page.evaluate('getComputedStyle(document.querySelector(".atlas__keyhelp")).opacity')
    record(page, 'La ayuda de teclado se muestra con el foco del atlas', visible == '1', visible)
    titles = [page.get_by_role('button', name=n).get_attribute('title') for n in ('Acercar el mapa', 'Alejar el mapa', RESET)]
    record(page, 'Los botones de zoom llevan title', titles == ['Acercar', 'Alejar', 'Volver al encuadre'], titles)
    reset_camera(page)


def keyboard_checks(page):
    close_panel(page)
    reset_camera(page)
    initial_text = vb_text(page)
    page.locator('.atlas').focus()
    record(page, 'El atlas recibe el foco', page.evaluate('document.activeElement.classList.contains("atlas")'))
    v0 = vb(page)
    page.keyboard.press('ArrowRight')
    settle(page)
    v1 = vb(page)
    upp = v0['width'] / page.locator('.atlas__drawing').bounding_box()['width']
    record(page, 'Flecha derecha desplaza el encuadre a la derecha 80 px', abs((v1['x'] - v0['x']) - 80 * upp) < 1.5, f"dx {v1['x'] - v0['x']:.2f} esperado {80 * upp:.2f}")
    page.keyboard.press('+')
    settle(page)
    v2 = vb(page)
    record(page, 'Tecla + acerca (x1.5)', abs(v1['width'] / v2['width'] - 1.5) < .01, f"{v1['width'] / v2['width']:.3f}")
    page.keyboard.press('-')
    settle(page)
    record(page, 'Tecla - aleja', vb(page)['width'] > v2['width'] + 1e-6)
    page.keyboard.press('0')
    settle(page)
    record(page, 'Tecla 0 reencuadra al viewBox inicial', vb_text(page) == initial_text and camera(page) == 'encuadre', camera(page))


# ---------------------------------------------------------------- maquetación
OVERLAP = ['.map-zoom', '.map-dock', '.map-dock__seasonal', '.atlas__compass', '.atlas__scale', '.map-chart__toolbar', '.peninsula__intro']


def layout_checks(page):
    for width, height in [(1440, 1080), (1024, 600), (1280, 650), (390, 844), (320, 740), (844, 390), (320, 568)]:
        page.set_viewport_size({'width': width, 'height': height})
        settle(page, 4)
        close_panel(page)
        reset_camera(page)
        boxes = page.evaluate("""sel => sel.map(s => { const e = document.querySelector(s); if (!e) return [s, null];
          const st = getComputedStyle(e), r = e.getBoundingClientRect();
          return [s, st.display === 'none' || st.visibility === 'hidden' || r.width === 0 ? null : { x: r.left, y: r.top, w: r.width, h: r.height }]; })""", OVERLAP)
        visible = [(n, b) for n, b in boxes if b]
        clashes = []
        for i, (na, a) in enumerate(visible):
            for nb, b in visible[i + 1:]:
                if {na, nb} == {'.map-dock', '.map-dock__seasonal'}:
                    continue  # el botón de temporada es hijo del dock
                if a['x'] < b['x'] + b['w'] - .5 and b['x'] < a['x'] + a['w'] - .5 and a['y'] < b['y'] + b['h'] - .5 and b['y'] < a['y'] + a['h'] - .5:
                    clashes.append(na + ' x ' + nb)
        offscreen = [n for n, b in visible if b['x'] < -.5 or b['y'] < -.5 or b['x'] + b['w'] > width + .5 or b['y'] + b['h'] > height + .5]
        hidden = [n for n, b in boxes if not b]
        record(page, f'Sin solapes de controles a {width}x{height}', not clashes, f'solapes {clashes}; fuera de pantalla {offscreen}; ocultos {hidden}')
        shot(page, f'layout-{width}x{height}.png')
    page.set_viewport_size({'width': 1440, 'height': 1080})


def reduced_motion_checks(browser, state):
    context = browser.new_context(viewport={'width': 1440, 'height': 1080}, storage_state=state, reduced_motion='reduce')
    page = context.new_page()
    page.on('pageerror', lambda e: ERRORS.append(str(e)))
    open_map(page)
    close_panel(page)
    before = vb(page)
    page.get_by_role('button', name='Acercar el mapa').click()
    settle(page, 2)
    immediate = vb(page)
    page.wait_for_timeout(400)
    later = vb(page)
    stable = max(abs(immediate[k] - later[k]) for k in later) < 1e-6
    durations = page.evaluate("""() => ['.atlas__drawing', '.atlas__train', '.atlas-pin'].map(s => { const e = document.querySelector(s);
      return e ? getComputedStyle(e).transitionDuration : null; })""")
    record(page, 'Con movimiento reducido el zoom por botón es inmediato (sin animación posterior)',
           immediate['width'] < before['width'] - 1e-6 and stable and all(d in (None, '0s') for d in durations),
           f"{before['width']:.1f}->{immediate['width']:.1f}->{later['width']:.1f}; transiciones {durations}")
    shot(page, 'movimiento-reducido.png')
    context.close()


# ---------------------------------------------------------------- tacto
def continuous_touch_checks(page, cdp):
    """Regresión: transferir la captura del SVG al atlas no debe soltar el dedo."""
    reset_camera(page)
    before, selected = vb(page), selected_station(page)
    width = page.locator('.atlas').bounding_box()['width']
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    page.evaluate("""() => {
      window.__mapFrames = { active: true, intervals: [], last: performance.now() };
      const tick = now => { const s = window.__mapFrames; s.intervals.push(now - s.last); s.last = now;
        if (s.active) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    }""")
    touch = lambda kind, x: cdp.send('Input.dispatchTouchEvent', {
        'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': 420, 'id': 1}]})
    errors = []
    touch('touchStart', 120)
    for step in range(1, 49):
        touch('touchMove', 120 + step * 2)
        settle(page, 1)
        if step >= 5:
            actual = (before['x'] - vb(page)['x']) * width / before['width']
            errors.append(abs(actual - step * 2))
    active = page.locator('.atlas').get_attribute('data-gesture') is not None
    shot(page, 'tactil-arrastre-continuo.png')
    touch('touchEnd', 216)
    settle(page)
    stats = page.evaluate("""() => { const s = window.__mapFrames; s.active = false;
      const a = s.intervals.slice(2).sort((a,b) => a-b);
      return { frames: a.length, medianaMs: a[Math.floor(a.length * .5)], p95Ms: a[Math.floor(a.length * .95)] }; }""")
    record(page, 'Táctil con CPU 4×: el mapa sigue todos los pasos del arrastre de 96 px',
           active and max(errors) < 1, {'errorMaxPx': max(errors), 'fotogramasObservados': stats})
    record(page, 'Táctil: soltar termina el arrastre continuo sin seleccionar estaciones',
           page.locator('.atlas').get_attribute('data-gesture') is None and selected_station(page) == selected)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    reset_camera(page)


def pinch_to_drag_checks(page, cdp):
    """Al soltar uno de los dos dedos, el otro conserva el arrastre completo."""
    def touch(kind, points):
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})
    def pt(x, ident):
        return {'x': x, 'y': 420, 'id': ident}
    reset_camera(page)
    touch('touchStart', [pt(140, 1), pt(240, 2)])
    touch('touchMove', [pt(120, 1), pt(260, 2)])
    # CDP recibe aquí el contacto que se levanta; el segundo sigue apoyado.
    touch('touchEnd', [pt(120, 1)])
    settle(page)
    before = vb(page)
    for step in range(1, 11):
        touch('touchMove', [pt(260 + step * 3, 2)])
    settle(page)
    actual = (before['x'] - vb(page)['x']) * 390 / before['width']
    record(page, 'Táctil: el dedo restante arrastra 30 px después del pellizco', abs(actual - 30) < 1, actual)
    touch('touchEnd', [])
    settle(page)
    reset_camera(page)


def touch_checks(browser, state):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, storage_state=state)
    page = context.new_page()
    page.on('pageerror', lambda e: ERRORS.append(str(e)))
    open_map(page)
    close_panel(page)
    cdp = context.new_cdp_session(page)
    continuous_touch_checks(page, cdp)
    pinch_to_drag_checks(page, cdp)

    def touch(kind, points):
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})

    def pt(x, y, i=0):
        return {'x': x, 'y': y, 'id': i}

    def page_state():
        return page.evaluate('({ scale: visualViewport.scale, scrollY, scrollX })')

    pre_selected, pre = selected_station(page), vb(page)
    x0, y0 = 120, 420
    touch('touchStart', [pt(x0, y0)])
    for i in range(1, 11):
        touch('touchMove', [pt(x0 + 12 * i, y0 + 3 * i)])
    touch('touchEnd', [])
    settle(page)
    post = vb(page)
    record(page, 'Táctil: arrastre con un dedo desplaza el viewBox', abs(post['x'] - pre['x']) > 1, f"dx {post['x'] - pre['x']:.1f}")
    record(page, 'Táctil: el arrastre no cambia la estación seleccionada', selected_station(page) == pre_selected)
    st = page_state()
    record(page, 'Táctil: tras el arrastre scale==1 y scrollY==0', st['scale'] == 1 and st['scrollY'] == 0, st)
    pre = vb(page)
    touch('touchStart', [pt(150, 420, 1), pt(250, 420, 2)])
    for i in range(1, 11):
        touch('touchMove', [pt(150 - 8 * i, 420, 1), pt(250 + 8 * i, 420, 2)])
    touch('touchEnd', [])
    settle(page, 4)
    post, st = vb(page), page_state()
    record(page, 'Táctil: pellizco de dos dedos acerca (viewBox menor)', post['width'] < pre['width'] * .8, f"{pre['width']:.1f} -> {post['width']:.1f}")
    record(page, 'Táctil: tras el pellizco visualViewport.scale==1 y scrollY==0', st['scale'] == 1 and st['scrollY'] == 0 and st['scrollX'] == 0, st)
    shot(page, 'tactil-pellizco.png')
    pre = vb(page)
    touch('touchStart', [pt(80, 420, 1), pt(310, 420, 2)])
    for i in range(1, 11):
        touch('touchMove', [pt(80 + 10 * i, 420, 1), pt(310 - 10 * i, 420, 2)])
    touch('touchEnd', [])
    settle(page, 4)
    record(page, 'Táctil: pellizco hacia dentro aleja', vb(page)['width'] > pre['width'] * 1.2, f"{pre['width']:.1f} -> {vb(page)['width']:.1f}")
    page.get_by_role('button', name='Acercar el mapa').click()
    settle(page, 3)
    candidate = pick_station(page)
    if not candidate:
        record(page, 'Táctil: hay estación visible para tocar', False)
    else:
        ident, x, y = candidate
        touch('touchStart', [pt(x, y)])
        touch('touchEnd', [])
        settle(page, 4)
        record(page, f'Táctil: toque sobre la estación {ident} tras pellizcar la selecciona', selected_station(page) == ident, selected_station(page))
    st = page_state()
    record(page, 'Táctil: scale==1 y scrollY==0 al final', st['scale'] == 1 and st['scrollY'] == 0, st)
    shot(page, 'tactil-final.png')
    context.close()


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1080})
        page = context.new_page()
        page.on('pageerror', lambda e: ERRORS.append(str(e)))
        page.on('console', lambda m: ERRORS.append('console.error: ' + m.text) if m.type == 'error' else None)
        fixture_full(page)
        shot(page, 'inicial-1440.png')
        for name, function in [('Rueda', wheel_checks), ('Arrastre', mouse_drag_checks), ('Clic/arrastre', click_vs_drag_checks),
                               ('Extremos', extreme_checks), ('Botones', button_checks), ('Reencuadre', reframe_checks),
                               ('Teclado', keyboard_checks), ('Foco y teclas', focus_and_keys_checks), ('Maquetación', layout_checks)]:
            guarded(page, name, lambda f=function: f(page))
        state = context.storage_state()
        for name, function in [('Movimiento reducido', reduced_motion_checks), ('Táctil', touch_checks)]:
            guarded(page, name, lambda f=function: f(browser, state))
        record(page, 'Sin errores pageerror ni console.error', not ERRORS, ERRORS[:5])
        browser.close()
    failures = [r for r in RESULTS if r['resultado'] != 'OK']
    informe = {'resultados': RESULTS, 'fallos': len(failures), 'errores': ERRORS,
               'limites': 'Chromium emulado (ratón y CDP táctil); no sustituye un móvil físico ni mide la sensación de uso.'}
    (OUTPUT / 'informe.json').write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(RESULTS) - len(failures)}/{len(RESULTS)} OK')
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
