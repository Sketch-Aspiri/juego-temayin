"""Recorre Mundo 5 en Chromium; contacto protegido y daño al jefe asistido solo con núcleo expuesto."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parent / 'verificacion' / 'mundo5'
out.mkdir(parents=True, exist_ok=True)
errors, reports = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto('http://127.0.0.1:5197')
    page.wait_for_load_state('networkidle')
    page.evaluate("""async () => {
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
      useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      window.qa={world:null,store:useAppStore,drive:false,hold:false,captured:false,coreCaptured:false,metrics:{}};
      const original=World.prototype.update;
      World.prototype.update=function(dt){
        qa.world=this;
        if(qa.hold)return;
        for(let i=0;i<(qa.drive?8:1);i++){
          if(qa.drive&&this.phase==='play')qa.control(this,dt);
          original.call(this,dt);
          if(this.checkpointReached)qa.metrics.checkpoint=true;
          qa.metrics.farthest=Math.max(qa.metrics.farthest||0,this.player.x/40);
          if(this.player.swimming)qa.metrics.swam=true;
          if(this.boss?.layer)qa.metrics.layer=Math.max(qa.metrics.layer||1,this.boss.layer);
          if(this.boss?.intro&&this.boss.t>0.8&&!qa.captured){qa.hold=true;break;}
          if(this.boss?.hittable&&!qa.coreCaptured){qa.hold=true;break;}
          qa.metrics.minOxygen=Math.min(qa.metrics.minOxygen??10,this.player.oxygen);
          if(this.phase==='dying'||this.phase==='done')break;
        }
      };
      qa.control=(w,dt)=>{
        const p=w.player,input=w.input;
        qa.metrics.t=(qa.metrics.t||0)+dt;
        // Solo se protege el daño por contacto; el oxígeno y las colisiones siguen activos.
        p.inv=1;
        if(w.boss?.lockCamera&&w.boss.hp>0){
          input.release('right');input.release('left');input.release('jump');
          if(w.boss.hittable)w.boss.onFireball(w);
          return;
        }
        input.press('run');input.press('right');input.release('left');
        const front=p.x+p.w,cx=p.x+p.w/2,tx=Math.floor(front/40);
        let jump=false;
        const pit=w.def.ops.find(o=>o[0]==='pit'&&o[1]*40>front&&!w.level.water.some(z=>o[1]>=z.x0&&o[1]<=z.x1));
        if(p.swimming){
          const water=w.level.water.find(z=>Math.floor(cx/40)>=z.x0&&Math.floor(cx/40)<=z.x1);
          if(water){
            const roof=[tx,tx+1,tx+2].some(x=>w.solid(x,water.surface));
            const target=w.def.id==='5-2'?8*40:roof?(water.surface+1)*40+8:water.surface*40-65;
            jump=p.y>target+15&&p.vy>=0;
          }
          if(w.solid(tx,Math.floor((p.y+p.h-3)/40))&&!w.solid(tx,Math.floor(p.y/40)))jump=true;
        }else if(p.onGround||p.coyote>0){
          for(let x=tx;x<=Math.floor((front+95)/40);x++)if(!w.solid(x,12)||w.solid(x,Math.floor((p.y+p.h-3)/40)))jump=true;
          for(const e of w.enemies)if(e.alive&&!e.dead&&e.id!=='alux'&&e.x>p.x&&e.x-front<100)jump=true;
        }
        // Frena en el aire si va a aterrizar antes de un barranco; toma carrera de nuevo.
        if(pit&&!p.swimming&&p.vy>0&&!p.onGround&&p.y+p.h<480&&pit[1]*40-front<120){
          input.release('right');if(p.vx>30)input.press('left');jump=false;
        }
        if(pit&&p.onGround&&p.vx<340&&pit[1]*40-front>20&&pit[1]*40-front<120&&!w.solid(tx,Math.floor((p.y+p.h-3)/40)))jump=false;
        if(jump&&!input.held.jump)input.press('jump');
        else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
        // Ante un techo inundado, se hunde antes de intentar entrar al túnel.
        const dive=w.def.id==='5-4'&&[tx,tx+1,tx+2].some(x=>w.solid(x,5))&&p.y<6*40;
        if(dive)input.release('jump');
        // En el arrecife se nada a media profundidad y se espera en los respiraderos.
        if(['5-2','5-4'].includes(w.def.id)&&p.swimming){
          const near=w.level.bubbles.find(v=>Math.abs((v.x+.5)*40-cx)<22);
          if(near&&p.oxygen<9.5){input.release('right');input.release('left');}
          const water=w.level.water.find(z=>tx>=z.x0&&tx<=z.x1);
          let stroke=p.y>8*40&&p.vy>=0;
          if(water&&water.x1*40-front<100)stroke=p.y>water.surface*40-35&&p.vy>=0;
          if(stroke&&!input.held.jump)input.press('jump');else if(p.vy>=0)input.release('jump');
          if(dive)input.release('jump');
        }
      };
    }""")
    selected = sys.argv[1:] or ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6']
    for level in selected:
        page.evaluate('id=>{qa.hold=false;qa.captured=false;qa.coreCaptured=false;qa.drive=false;qa.metrics={};qa.air=null;qa.store.getState().startLevel(id)}', level)
        page.wait_for_function('id=>qa.world?.def.id===id', arg=level)
        page.wait_for_timeout(300)
        page.screenshot(path=str(out / f'{level}-inicio.png'))
        page.wait_for_timeout(3200)
        page.evaluate('qa.drive=true')
        if level == '5-6':
            try:
                page.wait_for_function("qa.hold||qa.world.phase==='dying'", timeout=45000)
            except Exception:
                print(page.evaluate('()=>({x:qa.world.player.x,y:qa.world.player.y,oxygen:qa.world.player.oxygen,phase:qa.world.phase,boss:qa.world.boss.st})'), flush=True)
            page.wait_for_timeout(200)
            page.screenshot(path=str(out / '5-6-anuncio.png'))
            page.evaluate('qa.captured=true;qa.hold=false')
            page.wait_for_function('qa.hold', timeout=15000)
            page.wait_for_timeout(200)
            page.screenshot(path=str(out / '5-6-nucleo.png'))
            page.evaluate('qa.coreCaptured=true;qa.hold=false')
        try:
            page.wait_for_function("qa.world.player.x>42*40||qa.world.phase==='dying'", timeout=20000)
        except Exception:
            print(page.evaluate('()=>({x:qa.world.player.x,y:qa.world.player.y,oxygen:qa.world.player.oxygen,phase:qa.world.phase})'), flush=True)
        page.evaluate('qa.drive=false')
        page.screenshot(path=str(out / f'{level}-mecanica.png'))
        page.evaluate('qa.drive=true')
        try:
            page.wait_for_function("qa.world?.phase==='done'||qa.world?.phase==='dying'", timeout=45000)
        except Exception:
            pass
        page.evaluate('qa.drive=false')
        report = page.evaluate("()=>({id:qa.world.def.id,mode:'contacto protegido; oxígeno y colisiones activos; jefe con daño asistido en ventanas válidas, sin evaluar puntería',phase:qa.world.phase,x:qa.world.player.x/40,y:qa.world.player.y,lives:qa.world.session.lives,bossHp:qa.world.boss?.hp,exitOpen:qa.world.def.boss?qa.world.grid.slice(0,12).every(r=>r[qa.world.def.boss.arena[1]+1]===' '):null,...qa.metrics})")
        reports.append(report)
        page.screenshot(path=str(out / f'{level}-recorrido.png'))
        print(json.dumps(report), flush=True)
        page.evaluate("qa.store.getState().go('levels')")
        page.wait_for_timeout(100)
    browser.close()
(out / 'recorridos.json').write_text(json.dumps({'levels': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
assert all(r['phase'] == 'done' and r.get('checkpoint') for r in reports), reports
for report in reports:
    if report['id'] in ['5-2', '5-4']:
        assert report.get('swam'), report
    if report['id'] == '5-6':
        assert report['bossHp'] == 0 and report['exitOpen'] and report['layer'] == 3, report

