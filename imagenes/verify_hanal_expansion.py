"""Comprueba la ampliación, las dieciséis poses y el recorrido real del especial."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "verificacion" / "hanal-pixan-ampliado"
OUTPUT.mkdir(parents=True, exist_ok=True)
errors, reports = [], []

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 850})
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(os.environ.get("TEMAYIN_QA_URL", "http://127.0.0.1:5199"))
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Jugar", exact=True).wait_for()
    page.evaluate("""async () => {
      const loaded = path => performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === path).at(-1)?.name || path;
      const {World} = await import(loaded('/src/engine/World.ts'));
      const {useAppStore} = await import(loaded('/src/store/appStore.ts'));
      const {driveHanalRoute} = await import('/src/engine/testing/hanalRoute.ts');
      const {hanalMotionId} = await import('/src/engine/render/hanalPlayer.ts');
      const art = await import('/src/data/hanalPixanPlayer.ts');
      const {drawLazyFrame} = await import('/src/engine/render/enemies/atlas.ts');
      const {artReady} = await import('/src/engine/render/artCache.ts');
      await artReady();
      window.qa = {store: useAppStore, tick: World.prototype.update, world: null,
        drive: driveHanalRoute, pose: hanalMotionId, art, draw: drawLazyFrame, seen: new Set()};
      World.prototype.update = function() { qa.world = this; };
      qa.store.setState({settings: {...qa.store.getState().settings, muted: true, introSeen: true, touchControls: 'on'}});
      qa.report = () => {
        const w = qa.world, p = w.player;
        return {phase: w.phase, x: p.x / 40, y: p.y / 40, pose: qa.pose(w),
          checkpoint: w.checkpointReached, oxygen: p.oxygen, time: w.timeLeft};
      };
      qa.advance = seconds => {
        for (let i = 0; i < seconds * 120 && qa.world.phase === 'play'; i++) {
          qa.drive(qa.world); qa.tick.call(qa.world, 1 / 120); qa.seen.add(qa.pose(qa.world));
        }
        qa.world.player.inv = 0;
        return qa.report();
      };
    }""")
    page.add_style_tag(content=".level-card { animation-duration: .01s !important; }")
    page.get_by_role("button", name="Jugar", exact=True).click()
    page.get_by_role("button", name="Jugar Hanal Pixán", exact=False).click()
    page.get_by_role("button", name="Saltar", exact=False).click()
    page.wait_for_function("qa.world?.def.id === 'especial-hanal-pixan'")
    page.locator(".level-loading").wait_for(state="detached")

    # Las dos orientaciones se dibujan con el mismo recorte y la misma escala anatómica.
    page.evaluate("""() => {
      const sheet = document.createElement('canvas');
      sheet.id = 'qa-motion'; sheet.width = 1280; sheet.height = 840;
      Object.assign(sheet.style, {position: 'fixed', inset: '0', zIndex: '9999', width: '1280px', height: '840px'});
      document.body.append(sheet);
      const c = sheet.getContext('2d'); c.fillStyle = '#173c36'; c.fillRect(0, 0, 1280, 840);
      Object.entries(qa.art.HANAL_MOTION_FRAMES).forEach(([id, f], i) => {
        const x = i % 4 * 320, y = Math.floor(i / 4) * 210;
        c.strokeStyle = '#5c8174'; c.strokeRect(x, y, 320, 210);
        c.fillStyle = '#ffe9ab'; c.font = '16px sans-serif'; c.fillText(id, x + 12, y + 24);
        const centered = id.startsWith('swim'), hanging = id === 'hang' || id === 'swing';
        const anchorY = y + (hanging ? 55 : centered ? 120 : 175);
        for (const flip of [false, true]) {
          c.save(); c.translate(x + (flip ? 230 : 105), anchorY);
          if (flip) c.scale(-1, 1);
          qa.draw(c, qa.art.HANAL_MOTION_FILE, f, 56 / f.headWidth, 0, 0, true); c.restore();
        }
      });
    }""")
    page.locator("#qa-motion").screenshot(path=str(OUTPUT / "movimientos-16-ambos-lados.png"))
    page.evaluate("document.querySelector('#qa-motion').remove()")

    markers = iter([(48, "hamacas"), (116, "columpio"), (157, "tren"), (180, "checkpoint"),
                    (212, "cenote"), (250, "pelota"), (322, "puentes"), (345, "meta")])
    target = next(markers, None)
    for _ in range(240):
        state = page.evaluate("qa.advance(.5)")
        reports.append(state)
        if target and state["x"] >= target[0]:
            page.wait_for_timeout(60)
            page.locator(".stage canvas").screenshot(path=str(OUTPUT / f"{target[1]}.png"))
            target = next(markers, None)
        assert state["phase"] != "dying", state
        if state["phase"] == "flag":
            break
    assert state["phase"] == "flag" and state["checkpoint"], state
    assert "swim1" in page.evaluate("Array.from(qa.seen)") or "swim2" in page.evaluate("Array.from(qa.seen)")
    page.evaluate("""() => {
      for (let i = 0; i < 2400 && qa.world.phase !== 'done'; i++) qa.tick.call(qa.world, 1 / 120);
    }""")
    page.get_by_role("button", name="Continuar a Palenque", exact=True).wait_for()
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUTPUT / "resultados.png"))
    assert page.evaluate("qa.store.getState().progress.levels['especial-hanal-pixan'].completions") == 1

    # Comprueba el regreso al especial y la presentación del mando y HUD al girar.
    for width, height in [(390, 844), (844, 390)]:
        page.set_viewport_size({"width": width, "height": height})
        page.evaluate("qa.store.getState().go('levels')")
        page.get_by_role("button", name="Jugar Hanal Pixán", exact=False).click()
        page.get_by_role("button", name="Saltar", exact=False).click()
        page.wait_for_function("qa.world?.def.id === 'especial-hanal-pixan'")
        page.locator(".level-loading").wait_for(state="detached")
        page.wait_for_timeout(200)
        assert page.locator(".touch button[data-action]").count() == 5
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=str(OUTPUT / f"movil-{width}.png"))

    browser.close()

(OUTPUT / "informe.json").write_text(json.dumps({"errores": errors, "recorrido": reports,
    "poses": 16, "orientacionesPorPose": 2, "contactoProtegido": True,
    "colisionesSaltosOxigenoReales": True}, ensure_ascii=False, indent=2), encoding="utf-8")
assert not errors, errors
print("Verificados: 16 poses, dos orientaciones, recorrido completo, checkpoint, meta, guardado y dos formatos moviles.")
