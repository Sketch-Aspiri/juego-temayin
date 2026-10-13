"""Revisa las balas pintadas de Campeche y un disparo real en ambos sentidos."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
args = parser.parse_args()
out = Path(__file__).resolve().parent / 'verificacion/canones'
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const {Input}=await import(loaded('/src/engine/input.ts'));
      const {AudioEngine}=await import(loaded('/src/engine/audio.ts'));
      useAppStore.setState({progress:{levels:{'2-3':{bestScore:0,stars:1,completions:1}}},
        settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      window.qa={store:useAppStore,world:null,hold:false,drive:false,stats:{},shots:new Set()};
      const update=World.prototype.update;
      // El recorrido elige saltos seguros probando la física real en copias del mundo.
      const clone=src=>{
        const audio=new AudioEngine();audio.muted=true;
        const w=new World({def:src.def,input:new Input(),audio,session:{...src.session}});
        Object.assign(w.player,src.player);w.camX=src.camX;w.timeLeft=src.timeLeft;
        w.checkpointReached=src.checkpointReached;
        for(let y=0;y<w.grid.length;y++)w.grid[y].splice(0,w.grid[y].length,...src.grid[y]);
        for(const key of ['platforms','crumbles','enemies','items','cannons','cannonballs'])w[key]=src[key].map(e=>({...e}));
        return w;
      };
      const base={run:true,rightSteps:999,jumpHold:0,steps:24,untilLand:false};
      const actions=[base,...[2,10,20,32,48,80].flatMap(h=>[999,20,40,60].map(r=>({...base,jumpHold:h,rightSteps:r,steps:220,untilLand:true}))),
        ...[10,32,80].map(h=>({...base,run:false,jumpHold:h,steps:220,untilLand:true})),
        ...[20,80].map(h=>({...base,rightSteps:0,jumpHold:h,steps:220,untilLand:true}))];
      const apply=(w,a,s)=>{
        const input=w.input;
        if(a.run)input.press('run');else input.release('run');
        if(s<a.rightSteps)input.press('right');else input.release('right');
        if(s<a.jumpHold)input.press('jump');else input.release('jump');
      };
      const trial=(src,a)=>{
        const w=clone(src);w.input.reset();let airborne=false;
        for(let s=0;s<a.steps;s++){
          w.player.inv=1;apply(w,a,s);update.call(w,1/120);
          if(w.phase==='dying')return null;
          if(w.phase!=='play')return {x:Infinity,steps:s+1};
          if(!w.player.onGround)airborne=true;
          if(a.untilLand&&airborne&&s>3&&(w.player.onGround||w.player.swimming))return {x:w.player.x,steps:s+1};
        }
        return w.player.onGround||w.player.swimming?{x:w.player.x,steps:a.steps}:null;
      };
      qa.control=w=>{
        if(!qa.plan||qa.plan.step>=qa.plan.steps){
          let best=null;
          for(const a of actions){
            const res=trial(w,a);
            if(res&&(!best||res.x>best.x))best={a,...res};
          }
          qa.plan=best?{...best,step:0}:{a:{...base,rightSteps:0},steps:12,step:0};
          w.input.reset();
        }
        w.player.inv=1;apply(w,qa.plan.a,qa.plan.step++);
      };
      World.prototype.update=function(dt){
        qa.world=this;if(qa.hold)return;
        for(let i=0;i<(qa.drive?8:1);i++){
          if(qa.drive&&this.phase==='play')qa.control(this);
          update.call(this,dt);
          if(this.checkpointReached)qa.stats.checkpoint=true;
          for(const ball of this.cannonballs)qa.shots.add(Math.sign(ball.vx));
          if(this.phase==='done'||this.phase==='dying')break;
        }
      };
      useAppStore.getState().startLevel('2-3');
    }""")
    page.wait_for_function("qa.world?.def.id==='2-3'")
    page.evaluate("""()=>{
      const w=qa.world,p=w.player;w.camX=72*40;p.x=76*40;p.y=6*40-p.h;p.inv=10;
      p.onGround=true;p.anim='idle';p.frame=0;
    }""")
    page.wait_for_function('qa.shots.has(1)&&qa.shots.has(-1)', timeout=10000)
    page.evaluate('qa.hold=true')
    page.screenshot(path=str(out / 'campeche-disparo-real.png'))
    actual = page.evaluate('()=>({directions:Array.from(qa.shots),balls:qa.world.cannonballs.map(b=>({x:b.x,y:b.y,vx:b.vx})),phase:qa.world.phase})')
    # Vista preparada para comparar la bala, el humo y su tamaño a escala real.
    page.evaluate("""()=>{
      const w=qa.world;w.shake=0;
      w.cannonballs=[{x:81*40,y:8.5*40,vx:220,t:.3,gone:false},
        {x:91.5*40,y:8.5*40,vx:-220,t:.3,gone:false}];
    }""")
    page.wait_for_timeout(120)
    page.screenshot(path=str(out / 'campeche-balas.png'))
    page.set_viewport_size({'width': 844, 'height': 390})
    page.wait_for_timeout(120)
    page.screenshot(path=str(out / 'movil-balas.png'))
    page.set_viewport_size({'width': 1280, 'height': 850})
    gallery = page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {drawCannonballs}=await import(loaded('/src/engine/render/cannons.ts'));
      const {NEW_GAMEPLAY_SPRITES}=await import('/src/data/newGameplaySprites.ts');
      const board=document.createElement('div');board.id='qa-cannon-gallery';board.style='position:fixed;inset:0;z-index:99999;background:#173b42;display:grid;grid-template-columns:1fr 1fr;padding:24px;gap:24px';
      for(const dir of [1,-1]){
        const canvas=document.createElement('canvas');canvas.width=550;canvas.height=400;const c=canvas.getContext('2d');
        c.fillStyle='#fff';c.font='20px sans-serif';c.fillText(dir>0?'Disparo a la derecha':'Disparo a la izquierda',20,32);
        c.save();c.translate(280,160);c.scale(6,6);drawCannonballs(c,[{x:0,y:0,vx:dir*220,t:.3,gone:false}],0);c.restore();
        c.fillText('Tamaño real: 22 px',20,300);drawCannonballs(c,[{x:280,y:340,vx:dir*220,t:.3,gone:false}],0);
        board.append(canvas);
      }
      document.body.append(board);
      return Object.values(NEW_GAMEPLAY_SPRITES).filter(s=>s.file.includes('canon')).map(s=>({file:s.file,frame:s.frame,anchor:s.anchor}));
    }""")
    page.screenshot(path=str(out / 'sprites-bala-y-humo.png'))
    page.evaluate("document.getElementById('qa-cannon-gallery').remove();qa.hold=false;qa.store.getState().go('levels')")
    page.wait_for_timeout(50)
    page.evaluate("qa.stats={};qa.world=null;qa.store.getState().startLevel('2-3')")
    page.wait_for_function("qa.world?.def.id==='2-3'&&qa.world.player.x<200")
    page.evaluate('qa.drive=true')
    page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=45000)
    page.evaluate('qa.hold=true;qa.drive=false')
    completion = page.evaluate('()=>({phase:qa.world.phase,x:qa.world.player.x,...qa.stats})')
    page.screenshot(path=str(out / 'campeche-meta.png'))
    browser.close()

payload = {'actualShots': actual, 'sprites': gallery, 'completion': completion, 'errors': errors,
           'mode': 'Disparos reales en un baluarte, escenas preparadas en escritorio y móvil, y recorrido con daño de contacto protegido; colisiones y hoyos activos.'}
(out / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(payload, ensure_ascii=False))
assert not errors, errors
assert sorted(actual['directions']) == [-1, 1] and actual['phase'] == 'play', actual
assert completion['phase'] == 'done' and completion.get('checkpoint'), completion
