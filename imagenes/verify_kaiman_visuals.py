"""Captura ataques de Kaimán y recorre Calkiní con contacto y daño al jefe asistidos."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--label', default='final')
parser.add_argument('--capture-only', action='store_true')
args = parser.parse_args()
out = Path(__file__).resolve().parent / 'verificacion/kaiman' / args.label
out.mkdir(parents=True, exist_ok=True)
errors, reports = [], []

SETUP = """async () => {
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
  window.qa={store:useAppStore,world:null,hold:false,drive:false,metrics:{}};
  useAppStore.setState({progress:{levels:{'2-7':{bestScore:0,stars:1,completions:1}}},
    settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
  const update=World.prototype.update;
  World.prototype.update=function(dt){
    qa.world=this;if(qa.hold)return;
    for(let i=0;i<(qa.drive?8:1);i++){
      if(qa.drive&&this.phase==='play')qa.control(this);
      update.call(this,dt);
      if(this.checkpointReached)qa.metrics.checkpoint=true;
      const b=this.boss;
      if(b){qa.metrics.stage=Math.max(qa.metrics.stage||1,b.stage);qa.metrics.states??=[];
        if(!qa.metrics.states.includes(b.st))qa.metrics.states.push(b.st);}
      if(this.phase==='dying'||this.phase==='done')break;
    }
  };
  qa.control=w=>{
    const p=w.player,input=w.input,b=w.boss;p.inv=1;
    if(b?.lockCamera&&b.hp>0){
      input.reset();
      // Mantiene al jugador en aire respirable sobre el tronco izquierdo.
      p.x=65*40;p.y=9*40-p.h;p.vy=0;
      if(b.hittable&&b.jawsOpen&&b.t>0.12)b.onFireball(w);
      return;
    }
    input.press('right');input.press('run');input.release('left');
    const front=p.x+p.w,tx=Math.floor(front/40),feet=Math.floor((p.y+p.h-3)/40);
    let jump=false;
    if(p.swimming){
      const z=w.level.water.find(z=>Math.floor((p.x+p.w/2)/40)>=z.x0&&Math.floor((p.x+p.w/2)/40)<=z.x1);
      jump=!!z&&p.y>z.surface*40-65&&p.vy>=0;
      if(w.solid(tx,feet))jump=true;
    }else if(p.onGround||p.coyote>0){
      for(let x=tx;x<=Math.floor((front+70)/40);x++)if(!w.solid(x,12)||w.solid(x,feet))jump=true;
    }
    if(jump&&!input.held.jump)input.press('jump');
    else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
  };
  qa.start=()=>{qa.hold=false;qa.drive=false;qa.metrics={};qa.store.getState().startLevel('2-7')};
  qa.scene=async(st,stage)=>{
    const w=qa.world,b=w.boss;qa.hold=true;w.shake=0;w.camX=61*40;
    w.player.x=65*40;w.player.y=9*40-w.player.h;w.player.inv=0;
    Object.assign(b,{x:74*40,y:12*40-b.h,face:-1,st,t:0.25,clock:8.2,phase:stage,
      waves:[],mud:[],propagules:[],surfY:(stage===1?11.5:10.75)*40});
    w.level.water=w.level.water.map(z=>z.x0===62?{...z,surface:stage===1?11.5:10.75}:z);
    if(st==='spit')b.mud=[{x:69*40,y:310,vx:-140,vy:-220,t:0.2},{x:70*40,y:260,vx:-100,vy:50,t:0.4}];
    if(st==='slam')b.propagules=[{x:65.5*40,y:-44,wait:0.4,stuck:null,floor:b.surfY},
      {x:69*40,y:230,wait:0,stuck:null,floor:b.surfY},{x:77*40,y:350,wait:0,stuck:null,floor:b.surfY}];
    if(st==='tail')b.waves=[{x:68*40,dir:-1,speed:320,t:0.2},{x:79*40,dir:1,speed:320,t:0.2}];
    if(st==='warn')b.x=65*40;
  };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto('http://127.0.0.1:5197')
    page.wait_for_load_state('networkidle')
    page.evaluate(SETUP)
    page.evaluate('qa.start()')
    page.wait_for_function("qa.world?.def.id==='2-7'")
    page.wait_for_timeout(350)
    for state, stage in [('intro', 1), ('spitPrep', 1), ('spit', 1), ('slamPrep', 2), ('slam', 2),
                         ('tail', 2), ('warn', 2), ('exposed', 2), ('spit', 3)]:
        page.evaluate('([s,p])=>qa.scene(s,p)', [state, stage])
        page.wait_for_timeout(700 if state == 'intro' else 150)
        page.screenshot(path=str(out / f'{state}-fase{stage}.png'))
        reports.append(page.evaluate('()=>({state:qa.world.boss.st,stage:qa.world.boss.stage,hp:qa.world.boss.hp})'))
    # La tormenta y el agua deben seguir legibles en una pantalla horizontal pequeña.
    page.set_viewport_size({'width': 844, 'height': 390})
    page.wait_for_timeout(150)
    page.screenshot(path=str(out / 'movil-tormenta.png'))
    page.set_viewport_size({'width': 1280, 'height': 850})
    completion = None
    if not args.capture_only:
        page.evaluate("qa.store.getState().go('levels')")
        page.wait_for_timeout(100)
        page.evaluate('qa.start()')
        page.wait_for_function("qa.world?.boss.st==='sleep'")
        page.wait_for_timeout(300)
        page.evaluate('qa.drive=true')
        page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=45000)
        page.evaluate('qa.hold=true;qa.drive=false')
        completion = page.evaluate("""()=>({phase:qa.world.phase,hp:qa.world.boss.hp,
          exitOpen:!qa.world.grid.slice(0,12).some(r=>r[84]==='X'),...qa.metrics})""")
        page.screenshot(path=str(out / 'recorrido-final.png'))
    browser.close()

payload = {'mode': 'Escenas preparadas; recorrido con contacto protegido, ubicación en tronco durante el combate y fuego asistido solo en ventanas válidas; no evalúa dificultad ni puntería.',
           'scenes': reports, 'completion': completion, 'errors': errors}
(out / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(payload, ensure_ascii=False))
assert not errors, errors
if completion:
    assert completion['phase'] == 'done' and completion['hp'] == 0, completion
    assert completion['checkpoint'] and completion['exitOpen'] and completion['stage'] == 3, completion
