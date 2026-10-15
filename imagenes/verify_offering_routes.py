"""Recorre los seis niveles con ofrendas usando el controlador asistido existente.

Protege el contacto y asiste el daño al jefe solo en ventanas válidas.
En Tenosique prepara los saltos colocando al jugador en el borde firme de salida.
Las colisiones, el oxígeno, los checkpoints y las metas siguen activos.
"""
import ast
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'verificacion' / 'ofrendas' / 'recorridos'
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5199')


def controller(level):
    """Reutiliza los controladores existentes de salto, nado y combate de Kaimán."""
    file = 'verify_world3.py' if level == '1-3' else 'verify_kaiman_visuals.py' if level == '2-7' else 'verify_world5.py'
    tree = ast.parse((ROOT / file).read_text(encoding='utf-8'))
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and 'qa.control=' in node.value:
            return node.value
    raise RuntimeError('No se encontró el controlador de recorridos')


reports, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for level in (sys.argv[1:] or ['1-3', '1-6', '2-7', '3-5', '4-5', '5-6']):
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.on('pageerror', lambda error: errors.append(error.stack))
        page.goto(URL)
        page.wait_for_load_state('networkidle')
        page.evaluate(controller(level))
        if level == '1-3':
            page.evaluate("""()=>{
              const normal=qa.control;qa.prepared=new Set();
              qa.control=w=>{
                normal(w);
                const p=w.player,input=w.input;
                const pit=w.def.ops.find(o=>o[0]==='pit'&&!qa.prepared.has(o[1])&&p.x+p.w>(o[1]-3)*40&&p.x<o[1]*40);
                if(!pit)return;
                const edges=[pit[1]-2,pit[1]-1].map(x=>({x,y:w.grid.findIndex(row=>w.solid(x,w.grid.indexOf(row)))}));
                edges.sort((a,b)=>a.y-b.y);
                const edge=edges[0];
                // Prepara la salida; el salto y el aterrizaje se resuelven con la física real.
                p.x=edge.x*40;p.y=edge.y*40-p.h;p.vx=400;p.vy=0;p.onGround=true;
                input.release('jump');input.press('jump');qa.prepared.add(pit[1]);
              };
            }""")
        page.evaluate("""id=>{
          qa.hold=false;qa.drive=false;qa.captured=true;qa.coreCaptured=true;qa.metrics={};
          qa.store.setState({wallet:{cacao:130,pending:{}}});
          qa.store.getState().startLevel(id);
        }""", level)
        page.wait_for_selector('.offering')
        for card in page.locator('.blessing button').all():
            card.click()
        page.get_by_role('button', name='Continuar la aventura').click()
        page.wait_for_function('id=>qa.world?.def.id===id', arg=level)
        page.evaluate('qa.drive=true')
        try:
            page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=45000)
        except Exception:
            pass
        page.evaluate('qa.drive=false')
        report = page.evaluate("""()=>({id:qa.world.def.id,phase:qa.world.phase,x:qa.world.player.x/40,
          bossHp:qa.world.boss?.hp,cacao:qa.store.getState().wallet.cacao,
          saved:JSON.parse(localStorage.getItem('temayin:v3'))?.wallet.cacao,...qa.metrics})""")
        reports.append(report)
        page.screenshot(path=str(OUT / f'{level}.png'), full_page=True)
        print(json.dumps(report, ensure_ascii=False), flush=True)
        page.close()
    browser.close()
(OUT / 'informe.json').write_text(json.dumps({'routes': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
assert all(r['phase'] == 'done' and r.get('checkpoint') and r['cacao'] == r['saved'] for r in reports), reports
assert all(r.get('bossHp') in (None, 0) for r in reports), reports
