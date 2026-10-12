"""Revisa las salidas y recorre 1-4 y 1-5 en Chromium con contacto protegido."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright


output = Path(__file__).resolve().parent / 'verificacion' / 'mundo1-agua'
output.mkdir(parents=True, exist_ok=True)
errors, reports = [], []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5197'))
    page.wait_for_load_state('networkidle')
    assert page.get_by_role('button', name='Jugar', exact=True).is_visible()
    page.evaluate("""async () => {
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
      window.qa={store:useAppStore,world:null,tick:World.prototype.update,step:0};
      useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},
        settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      World.prototype.update=function(){qa.world=this};
      qa.report=()=>({id:qa.world.def.id,phase:qa.world.phase,x:qa.world.player.x/40,
        y:qa.world.player.y/40,oxygen:qa.world.player.oxygen,checkpoint:qa.world.checkpointReached});
      qa.pulse=()=>{
        const input=qa.world.input;
        if(qa.step%36===0)input.press('jump');
        if(qa.step%36===14)input.release('jump');
      };
      qa.control=()=>{
        const w=qa.world,p=w.player,input=w.input;
        // Protección del contacto únicamente: geometría, corrientes y oxígeno reales.
        p.inv=1; input.press('right'); input.press('run');
        const front=p.x+p.w,tx=Math.floor(front/40),cx=p.x+p.w/2;
        const z=w.level.water.find(z=>cx>=z.x0*40&&cx<(z.x1+1)*40);
        let jump=false;
        if(z&&p.swimming){
          const roof=[tx,tx+1].some(x=>x>=97&&x<=140&&w.def.id==='1-5'&&w.solid(x,z.surface));
          const target=roof?(z.surface+1)*40+8:z.surface*40-65;
          jump=p.y>target+15&&p.vy>=0;
          if(w.def.id==='1-5'&&cx>92*40&&cx<97*40&&p.y<8*40)jump=false;
        }else if(p.onGround||p.coyote>0){
          for(let x=tx;x<=Math.floor((front+75)/40);x++){
            if(!w.solid(x,12)||w.solid(x,Math.floor((p.y+p.h-3)/40)))jump=true;
          }
        }
        if(jump&&!input.held.jump)input.press('jump');
        else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
        // Descender antes de pasar bajo el muro y el techo del túnel.
        if(w.def.id==='1-5'&&cx>92*40&&cx<97*40&&p.y<8*40)input.release('jump');
      };
      qa.advance=(seconds,mode='route')=>{
        const w=qa.world;
        for(let i=0;i<seconds*120&&w.phase==='play';i++,qa.step++){
          if(mode==='escape'){
            w.player.inv=1;w.input.press('right');w.input.press('run');qa.pulse();
          }else qa.control();
          qa.tick.call(w,1/120);
        }
        return qa.report();
      };
    }""")

    def start(level):
        page.evaluate("id=>{qa.step=0;qa.world=null;qa.store.getState().startLevel(id)}", level)
        page.wait_for_function('id=>qa.world?.def.id===id', arg=level)

    def capture(name):
        # El bucle sigue dibujando mientras la simulación queda detenida para inspección.
        page.wait_for_timeout(100)
        page.locator('canvas').screenshot(path=str(output / f'{name}.png'), animations='disabled')

    for level, x, feet in [('1-4', 164.1, 14), ('1-5', 136, 12)]:
        start(level)
        page.evaluate("""({x,feet})=>{
          const w=qa.world,p=w.player;p.x=x*40;p.y=feet*40-p.h;p.vx=0;p.vy=0;p.onGround=false;
          w.camX=p.x-380;w.phaseT=3;
        }""", {'x': x, 'feet': feet})
        capture(f'{level}-antes-de-salir')
        if level == '1-5':
            for _ in range(240):
                surfaced = page.evaluate("qa.advance(1/60,'escape')")
                if 141 <= surfaced['x'] < 144 and surfaced['y'] + 66 / 40 <= 7:
                    break
            assert 141 <= surfaced['x'] < 144 and surfaced['y'] + 66 / 40 <= 7, surfaced
            capture('1-5-hueco-superior')
        result = page.evaluate("qa.advance(3,'escape')")
        reports.append({'prueba': 'salida', **result})
        capture(f'{level}-salida')
        assert result['phase'] == 'play' and result['x'] > (178 if level == '1-4' else 145), result
        page.evaluate("qa.store.getState().go('levels')")

    for level in ['1-4', '1-5']:
        start(level)
        checkpoint_captured = False
        for _ in range(100):
            result = page.evaluate('qa.advance(1)')
            if result['checkpoint'] and not checkpoint_captured:
                capture(f'{level}-checkpoint')
                checkpoint_captured = True
            if result['phase'] != 'play':
                break
        reports.append({'prueba': 'recorrido', **result})
        capture(f'{level}-meta')
        assert result['phase'] == 'flag' and result['checkpoint'], result
        page.evaluate("qa.store.getState().go('levels')")
    browser.close()

(output / 'revision.json').write_text(json.dumps({'recorridos': reports, 'errores': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
print(json.dumps(reports, ensure_ascii=False, indent=2))
