"""Revisión en Chromium: anuncios, arenas y salidas; daño de fuego asistido en ventanas válidas."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parent.parent
out = root / 'imagenes/verificacion/jefes'
out.mkdir(parents=True, exist_ok=True)
errors=[]
reports=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1280,'height':850})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:errors.append(f'{r.status}: {r.url}') if r.status>=400 else None)
    page.goto('http://127.0.0.1:5197')
    page.wait_for_load_state('networkidle')
    page.evaluate('''async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
      useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      window.qa={world:null,store:useAppStore,drive:false,hold:false,metrics:{}};
      const original=World.prototype.update;
      World.prototype.update=function(dt){
        qa.world=this;if(qa.hold)return;
        for(let i=0;i<(qa.drive?8:1);i++){
          if(qa.drive&&this.phase==='play')qa.control(this,dt);
          original.call(this,dt);
          if(this.checkpointReached)qa.metrics.checkpoint=true;
          qa.metrics.farthest=Math.max(qa.metrics.farthest||0,this.player.x/40);
          qa.metrics.minOxygen=Math.min(qa.metrics.minOxygen??10,this.player.oxygen);
          if(this.boss?.phase2)qa.metrics.phase2=true;
          if((this.boss?.stage??1)>=3)qa.metrics.phase3=true;
          if(this.boss?.intro&&!qa.captured){qa.hold=true;break;}
          if(this.phase==='dying'||this.phase==='done')break;
        }
      };
    }''')
    page.evaluate('''()=>{qa.control=(w,dt)=>{
      const p=w.player,input=w.input;p.inv=1;qa.metrics.t=(qa.metrics.t||0)+dt;
      const b=w.boss;
      if(b&&b.hp>0){input.release('right');input.release('left');input.release('jump');if(b.hittable)b.onFireball(w);return;}
      input.press('right');input.press('run');
      const front=Math.floor((p.x+p.w+12)/40),feet=Math.floor((p.y+p.h-1)/40);
      if((p.onGround||p.coyote>0)&&w.solid(front,feet)&&!input.held.jump)input.press('jump');
      else if(p.vy>=0)input.release('jump');
    }}''')
    for level in ['1-6','2-7','3-5','4-5']:
      page.evaluate('id=>{qa.hold=false;qa.drive=false;qa.metrics={};qa.air=null;qa.captured=false;qa.store.getState().startLevel(id)}',level)
      page.wait_for_function('id=>qa.world?.def.id===id',arg=level)
      page.evaluate('''()=>{const w=qa.world;w.player.x=(w.def.boss.arena[0]+2)*40;w.player.y=420;w.camX=(w.def.boss.arena[0]-1)*40;w.player.fire=true;qa.drive=true}''')
      page.wait_for_selector('.boss-intro')
      page.wait_for_function('qa.hold')
      page.wait_for_timeout(500)
      page.screenshot(path=str(out / f'{level}-anuncio.png'))
      portrait=page.locator('.boss-intro__img').evaluate("e=>e.tagName==='svg'?e.querySelector('image').getAttribute('href'):e.getAttribute('src')")
      page.evaluate('qa.captured=true;qa.hold=false;qa.drive=false')
      page.wait_for_selector('.boss-intro',state='detached')
      page.wait_for_timeout(300)
      page.evaluate('qa.hold=true')
      page.screenshot(path=str(out / f'{level}-arena.png'))
      page.evaluate('qa.hold=false;qa.drive=true')
      page.wait_for_function("qa.world.boss.hp===0||qa.world.phase==='dying'",timeout=60000)
      page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'",timeout=25000)
      page.evaluate('qa.hold=true;qa.drive=false')
      report=page.evaluate('''()=>({id:qa.world.def.id,boss:qa.world.boss.id,hp:qa.world.boss.hp,phase:qa.world.phase,exitOpen:!qa.world.grid.slice(0,12).some(r=>r[qa.world.def.boss.arena[1]+1]==='X'),...qa.metrics})''')
      report['portrait']=portrait
      reports.append(report)
      page.screenshot(path=str(out / f'{level}-final.png'))
      print(json.dumps(report,ensure_ascii=False),flush=True)
      page.evaluate("qa.store.getState().go('levels')")
    browser.close()
(out/'resultados.json').write_text(json.dumps({'mode':'Entrada directa a las arenas, protección contra daño y fuego asistido en ventanas válidas; no evalúa dificultad ni puntería.', 'reports':reports,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
assert not errors,errors
assert all(r['hp']==0 and r['phase']=='done' and r['exitOpen'] for r in reports),reports
# Huay Chivo pelea en tres fases: debe llegar a la noche cerrada.
assert all(r.get('phase3') for r in reports if r['boss']=='huayChivo'),reports
