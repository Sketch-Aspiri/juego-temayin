"""Revisa el Mundo 3 en Chromium con controles del motor y guardado de pruebas aislado."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).resolve().parent / 'verificacion' / 'mundo3'
OUTPUT.mkdir(parents=True, exist_ok=True)
errors = []
reports = []

INSTRUMENT = """async () => {
  const loaded=suffix=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===suffix).at(-1)?.name||suffix;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
  const levels=Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]));
  useAppStore.setState({progress:{levels},settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
  window.qa={world:null,drive:false,metrics:{},store:useAppStore};
  const original=World.prototype.update;
  World.prototype.update=function(dt){
    window.qa.world=this;
    const loops=window.qa.drive?8:1;
    for(let i=0;i<loops;i++){
      if(window.qa.drive&&this.phase==='play')window.qa.control(this);
      original.call(this,dt);
      if(this.checkpointReached)window.qa.metrics.checkpoint=true;
      window.qa.metrics.farthest=Math.max(window.qa.metrics.farthest||0,this.player.x/40);
      if(this.phase==='dying'||this.phase==='done')break;
    }
  };
  window.qa.control=w=>{
    const p=w.player,input=w.input,b=w.boss;
    // Ruta asistida: protege de contacto para aislar la geometría; las ventanas de daño
    // y el combate sin esta protección están cubiertos por World3.test.ts.
    p.inv=1;
    input.press('run');input.press('right');
    let jump=false;
    const front=p.x+p.w;
    if(p.onGround||p.coyote>0){
      for(let x=Math.floor(front/40);x<=Math.floor((front+105)/40);x++){
        if(!w.solid(x,12)||w.solid(x,Math.floor((p.y+p.h-3)/40)))jump=true;
      }
      for(const e of w.enemies)if(e.alive&&!e.dead&&e.id!=='alux'&&e.x>p.x&&e.x-front<105)jump=true;
      if(w.level.hammocks.some(h=>h.y===480&&h.x-front<120&&h.x+h.w>p.x&&h.x>=p.x-20))jump=false;
    }
    if(p.swinging!==null){
      const r=w.ropes[p.swinging];
      if(r.angle>0.3)jump=true;
    }
    if(b&&b.lockCamera&&b.hp>0){
      // Se dirige físicamente al jefe; el pisotón exige una ventana y la caída correcta.
      const dx=b.x+b.w/2-(p.x+p.w/2);
      input.release('right');input.release('left');
      if(dx>20)input.press('right');if(dx< -20)input.press('left');
      if(p.onGround&&Math.abs(dx)<190)jump=true;
      if(b.st==='charge'&&p.onGround)jump=true;
      if(b.hittable&&p.fire&&Math.abs(dx)<450)input.press('fire');
      else input.release('fire');
    }else input.release('left');
    if(jump&&!input.held.jump)input.press('jump');
    else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
  };
} """

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:5198')
    page.wait_for_load_state('networkidle')
    page.evaluate(INSTRUMENT)
    for level_id in ['3-1', '3-2', '3-3', '3-4', '3-5']:
        page.evaluate("id=>{qa.drive=false;qa.metrics={};qa.store.getState().startLevel(id)}", level_id)
        try:
            page.wait_for_function('id=>qa.world?.def.id===id', arg=level_id)
        except Exception:
            print(page.evaluate("()=>({screen:qa.store.getState().screen,run:qa.store.getState().run?.levelId,text:document.body.innerText,errors:qa.metrics})"), flush=True)
            page.screenshot(path=str(OUTPUT / 'error-inicio.png'))
            raise
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUTPUT / f'{level_id}-inicio.png'))
        page.evaluate('qa.drive=true')
        try:
            page.wait_for_function("qa.world?.phase==='done'||document.querySelector('.overlay')", timeout=45000)
        except Exception:
            pass
        page.evaluate('qa.drive=false')
        report = page.evaluate("()=>({id:qa.world.def.id,mode:'recorrido asistido contra daño de contacto',phase:qa.world.phase,x:qa.world.player.x/40,lives:qa.world.session.lives,bossHp:qa.world.boss?.hp,time:qa.world.timeLeft,...qa.metrics})")
        reports.append(report)
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUTPUT / f'{level_id}-recorrido.png'))
        print(json.dumps(report), flush=True)
        page.evaluate("qa.store.getState().go('levels')")
        page.wait_for_timeout(100)
    browser.close()

(OUTPUT / 'recorridos.json').write_text(json.dumps({'levels': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
assert len(reports) == 5 and all(r['phase'] == 'done' and r.get('checkpoint') for r in reports), reports
assert reports[-1]['bossHp'] == 0, reports[-1]
