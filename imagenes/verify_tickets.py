"""Revisa boletos, guardado y seis desvíos con física real y recorridos guionizados."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).resolve().parent / ".temp" / "boletos"
OUTPUT.mkdir(parents=True, exist_ok=True)
ERRORS, REPORTS = [], []

INSTALL = """
async () => {
  const loaded = s => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === s).at(-1)?.name || s;
  const {World} = await import(loaded('/src/engine/World.ts'));
  const {useAppStore} = await import(loaded('/src/store/appStore.ts'));
  const {WORLDS} = await import(loaded('/src/data/worlds.ts'));
  const {driveRiddles} = await import(loaded('/src/engine/testing/riddleRoute.ts'));
  window.qa = {store: useAppStore, worlds: WORLDS, world: null, tick: World.prototype.update, step: 0};
  World.prototype.update = function() { qa.world = this; };
  qa.report = () => {
    const w = qa.world;
    return {id: w.def.id, phase: w.phase, x: w.player.x / 40, y: w.player.y / 40,
      checkpoint: w.checkpointReached, ticket: w.ticketCollected, oxygen: w.player.oxygen};
  };
  qa.control = () => {
    const w = qa.world, p = w.player, input = w.input, front = p.x + p.w;
    input.press('right'); input.press('run');
    const z = w.level.water.find(z => p.x + p.w / 2 >= z.x0 * 40 && p.x + p.w / 2 < (z.x1 + 1) * 40);
    let jump = false;
    if (z && p.swimming) jump = p.y > z.surface * 40 - 65 && p.vy >= 0;
    else if (p.onGround || p.coyote > 0) {
      for (let x = Math.floor(front / 40); x <= Math.floor((front + 60) / 40); x++)
        if (!w.solid(x, 12) || w.solid(x, Math.floor((p.y + p.h - 3) / 40))) jump = true;
    }
    if (jump && !input.held.jump) input.press('jump');
    else if (p.vy >= 0 || (!jump && p.onGround)) input.release('jump');
    driveRiddles(w); // los secretos cierran la meta con una puerta de jade: hay que resolver su acertijo
  };
  qa.advance = seconds => {
    for (let i = 0; i < seconds * 120 && qa.world.phase === 'play'; i++) {
      qa.control(); qa.tick.call(qa.world, 1 / 120);
    }
    return qa.report();
  };
  qa.store.setState({settings: {...qa.store.getState().settings, muted: true, introSeen: true}});
}
"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 850})
    page.on("pageerror", lambda error: ERRORS.append(str(error)))
    page.goto(os.environ.get("TEMAYIN_QA_URL", "http://127.0.0.1:5197"))
    page.wait_for_load_state("networkidle")
    page.add_style_tag(content=".level-card { animation-duration: 0.01s !important; }")
    page.get_by_role("button", name="Jugar", exact=True).wait_for()
    page.evaluate(INSTALL)
    page.evaluate("qa.store.getState().go('levels')")
    assert page.locator(".level-tile--secret:disabled").count() == 6
    assert page.get_by_text("Destino secreto", exact=True).count() == 6
    page.screenshot(path=str(OUTPUT / "selector-bloqueado.png"), full_page=True)

    def start(level):
        page.evaluate("""id => {
          qa.world = null;
          const s = qa.store.getState();
          s.startLevel(id);
          if (qa.store.getState().screen === 'offering') qa.store.getState().continueOffering();
        }""", level)
        page.wait_for_function("id => qa.world?.def.id === id", arg=level)

    approaches = [("1-3", 65.1, 3, True), ("2-2", 45, 7, True), ("3-3", 50, 3, True),
                  ("4-3", 51, 8, False), ("5-4", 55, 8, False), ("6-4", 72, 8, True)]
    for index, (level, x, feet, ground) in enumerate(approaches):
        # Se prepara acceso a los niveles anfitriones; ningún boleto se inyecta en progreso.
        page.evaluate("""id => {
          const s = qa.store.getState();
          qa.store.setState({progress: {...s.progress, levels: {...s.progress.levels,
            [id]: {bestScore: 0, stars: 1, completions: 1}}}});
        }""", level)
        start(level)
        page.evaluate("""({x, feet, ground}) => {
          const w = qa.world, p = w.player;
          p.x = x * 40; p.y = feet * 40 - p.h; p.vx = 0; p.vy = 0; p.onGround = ground;
          p.inv = 10; w.camX = Math.max(0, p.x - 400); w.phaseT = 10;
        }""", {"x": x, "feet": feet, "ground": ground})
        page.wait_for_timeout(100)
        page.locator("canvas").screenshot(path=str(OUTPUT / f"{level}-boleto.png"))
        found = page.evaluate("""id => {
          const w = qa.world;
          for (let step = 0; step < 360 && !w.ticketCollected; step++) {
            if (step % 36 === 0) w.input.press('jump');
            if (step % 36 === 30) w.input.release('jump');
            if (id === '1-3') w.input.press('right');
            qa.tick.call(w, 1 / 120);
          }
          w.input.reset();
          return qa.report();
        }""", level)
        assert found["ticket"], found
        page.wait_for_function("n => qa.store.getState().progress.tickets.length === n", arg=index + 1)
        page.get_by_role("img", name="Boleto del Tren Maya encontrado", exact=True).wait_for()
        saved = page.evaluate("JSON.parse(localStorage.getItem('temayin:v3')).progress.tickets")
        assert len(saved) == index + 1, saved
        REPORTS.append({"prueba": "recogida", **found})
        if index == 0:
            page.evaluate("""() => {
              const w = qa.world; w.checkpointReached = true; w.die(); w.phaseT = 4;
            }""")
            page.wait_for_function("qa.world?.phase === 'play' && qa.world.checkpointReached")
            assert page.evaluate("qa.world.ticketCollected")
            page.reload()
            page.wait_for_load_state("networkidle")
            page.add_style_tag(content=".level-card { animation-duration: 0.01s !important; }")
            page.get_by_role("button", name="Jugar", exact=True).wait_for()
            page.evaluate(INSTALL)
            assert page.evaluate("qa.store.getState().progress.tickets.length") == 1
        page.evaluate("qa.store.getState().go('levels')")
        tile = page.locator(".level-tile--secret").nth(index)
        assert tile.is_enabled()
        assert "Boleto encontrado" in tile.inner_text()

    page.screenshot(path=str(OUTPUT / "selector-desbloqueado.png"), full_page=True)
    bonuses = page.evaluate("qa.worlds.map(w => w.bonus.id)")
    for level in bonuses:
        # El acceso al desvío pasa por el botón real del selector.
        index = bonuses.index(level)
        page.locator(".level-tile--secret").nth(index).click()
        page.wait_for_function("id => qa.world?.def.id === id", arg=level)
        checkpoint_seen = False
        for _ in range(90):
            state = page.evaluate("qa.advance(1)")
            if state["checkpoint"] and not checkpoint_seen:
                checkpoint_seen = True
                page.wait_for_timeout(50)
                page.locator("canvas").screenshot(path=str(OUTPUT / f"{level}-checkpoint.png"))
            if state["phase"] != "play":
                break
        assert state["phase"] == "flag" and checkpoint_seen, state
        REPORTS.append({"prueba": "recorrido", **state})
        page.evaluate("""() => {
          const w = qa.world;
          for (let i = 0; i < 2400 && w.phase !== 'done'; i++) qa.tick.call(w, 1 / 120);
        }""")
        page.get_by_role("dialog", name="¡NIVEL COMPLETADO!").wait_for()
        page.wait_for_timeout(400)
        assert page.get_by_role("button", name="Siguiente nivel", exact=True).count() == 0
        assert page.get_by_text("¡Temayin ha completado toda la aventura!", exact=True).count() == 0
        page.screenshot(path=str(OUTPUT / f"{level}-resultados.png"))
        assert page.evaluate("id => JSON.parse(localStorage.getItem('temayin:v3')).progress.levels[id].completions", level) == 1
        page.get_by_role("button", name="Volver al mapa", exact=True).click()
        assert page.locator(".level-tile--secret").nth(index).is_enabled()

    for width, height in [(390, 844), (844, 390)]:
        page.set_viewport_size({"width": width, "height": height})
        page.wait_for_timeout(100)
        page.screenshot(path=str(OUTPUT / f"selector-{width}.png"), full_page=True)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    browser.close()

(OUTPUT / "revision.json").write_text(json.dumps({"pruebas": REPORTS, "errores": ERRORS},
                                                ensure_ascii=False, indent=2), encoding="utf-8")
assert not ERRORS, ERRORS
print(json.dumps(REPORTS, ensure_ascii=False, indent=2))
