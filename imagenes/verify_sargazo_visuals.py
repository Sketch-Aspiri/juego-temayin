"""Revisa arte y victoria con entradas de nado; contacto protegido, aire y rescates reales."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / 'verificacion/sargazo'
CONTROL = r"""w=>{
  const p=w.player,input=w.input,b=w.boss;p.inv=1;
  input.release('right');input.release('left');input.release('run');
  let x,y;
  if(!b.lockCamera||b.hp<=0){x=w.level.flagX*40;y=80;}
  else if(b.hittable){x=b.x+b.w/2;y=b.y+b.h/2;}
  else{const ally=b.turtles.find(t=>t.netted)||b.turtles[b.team.target(b)];
    x=ally.platform.x+ally.platform.w/2;y=ally.platform.y-10;}
  const dx=x-(p.x+p.w/2),dy=p.y+p.h/2-y;
  if(Math.abs(dx)>12)input.press(dx>0?'right':'left');
  const stroke=p.swimming?dy>30&&p.vy>=0:p.onGround||p.coyote>0;
  if(stroke&&!input.held.jump)input.press('jump');
  else if(p.vy>=0||(!stroke&&p.onGround))input.release('jump');
}"""
SETUP = r"""async control=>{
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const hazards=await import(loaded('/src/engine/bosses/sargazo/hazards.ts'));
  const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
  while(useAppStore.getState().screen==='loading')await new Promise(r=>setTimeout(r,100));
  window.qa={store:useAppStore,world:null,hold:false,drive:false,metrics:{},hazards,control:eval('('+control+')')};
  useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:1234,stars:2,completions:1}]))},
    settings:{...useAppStore.getState().settings,muted:true,introSeen:true,touchControls:'auto'}});
  const original=World.prototype.update;
  World.prototype.update=function(dt){
    qa.world=this;if(qa.hold)return;
    for(let i=0;i<(qa.drive?8:1);i++){
      if(qa.drive&&this.phase==='play')qa.control(this);
      const start=performance.now();original.call(this,dt);
      const m=qa.metrics,b=this.boss;
      m.updateMs=(m.updateMs||0)+performance.now()-start;m.steps=(m.steps||0)+1;
      m.t=(m.t||0)+dt;m.checkpoint=this.checkpointReached;
      m.stage=Math.max(m.stage||1,b.stage);m.rescues=b.rescues;
      m.minOxygen=Math.min(m.minOxygen??10,this.player.oxygen);
      m.states??=[];if(!m.states.includes(b.st))m.states.push(b.st);
      m.attacks??=[];if(b.st==='attack'&&!m.attacks.includes(b.attack))m.attacks.push(b.attack);
      if(this.phase==='dying'||this.phase==='done')break;
    }
  };
  qa.start=()=>{
    qa.world=null;qa.hold=false;qa.drive=false;qa.metrics={};
    qa.store.getState().startLevel('5-6');
    if(qa.store.getState().screen==='offering')qa.store.getState().continueOffering();
  };
  qa.checkpoint=()=>{
    // Posición inicial de reintento; desde aquí solo se usan entradas de movimiento.
    const w=qa.world,p=w.player;p.x=68*40+4;p.y=480-p.h;p.vx=p.vy=0;
    p.fire=p.ball=p.shield=false;p.snorkel=0;w.checkpointReached=true;w.camX=64*40;
    qa.metrics={};qa.hold=false;qa.drive=true;
  };
  qa.scene=(attack,stage,state='warn')=>{
    const w=qa.world,b=w.boss;qa.hold=true;qa.drive=false;w.camX=77*40;w.shake=0;
    Object.assign(b,{x:90*40,y:280,face:-1,st:state,t:.7,clock:8,phase:stage,hp:15-3*stage,
      attack,targetX:85*40,targetY:290,targetTurtle:1});
    b.shots.length=b.tides.length=b.vortices.length=0;b.team.restore();b.team.bind(w,b.left,b.right);
    Object.assign(w.player,{x:84*40,y:330,inv:0,vx:0,vy:0,oxygen:7,swimming:true});
    if(state==='attack'){
      qa.hazards.startHazard(b,w);
      if(attack==='tide')b.tides[0].x=88*40;
      if(attack==='salvo')for(let i=0;i<b.shots.length;i++){b.shots[i].x-=100+i*25;b.shots[i].y+=i*22;}
    }
    if(state==='exposed')b.team.pulse={x:89*40,y:300};
    if(state==='dead')b.hp=0;
  };
}"""


def start(page):
    page.evaluate('qa.start()')
    page.wait_for_function("qa.world?.def.id==='5-6'")
    page.wait_for_timeout(150)


def scenes(page):
    captured = []
    for stage in range(1, 5):
        attacks = ['salvo', 'tide', 'net']
        if stage >= 2:
            attacks += ['surge', 'whirlpool']
        if stage >= 3:
            attacks += ['rain']
        for attack in attacks:
            for state in ['warn', 'attack']:
                page.evaluate('([a,p,s])=>qa.scene(a,p,s)', [attack, stage, state])
                page.wait_for_timeout(100)
                name = f'fase{stage}-{attack}-{state}.png'
                page.screenshot(path=str(OUT / name))
                captured.append(name)
        for state in ['exposed', 'hurt', 'shed']:
            page.evaluate('([a,p,s])=>qa.scene(a,p,s)', ['net', stage, state])
            page.wait_for_timeout(100)
            page.screenshot(path=str(OUT / f'fase{stage}-{state}.png'))
    return captured


def mobile(browser, url, errors):
    context = browser.new_context(is_mobile=True, has_touch=True, device_scale_factor=1,
                                  viewport={'width': 844, 'height': 390})
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url); page.wait_for_load_state('networkidle')
    page.evaluate(SETUP, CONTROL); start(page)
    page.evaluate("qa.scene('net',4,'attack')")
    reports = []
    for name, width, height in [('horizontal', 844, 390), ('vertical', 390, 844)]:
        page.set_viewport_size({'width': width, 'height': height}); page.wait_for_timeout(250)
        page.screenshot(path=str(OUT / f'movil-{name}.png'))
        reports.append(page.evaluate('''()=>({width:innerWidth,height:innerHeight,
          overflow:document.documentElement.scrollWidth>innerWidth,
          buttons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.getAttribute('aria-label')||b.textContent)})'''))
    context.close()
    return reports


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:5197')
    parser.add_argument('--no-scenes', action='store_true')
    args = parser.parse_args(); OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 850})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        page.goto(args.url); page.wait_for_load_state('networkidle')
        page.evaluate(SETUP, CONTROL); start(page)
        captured = [] if args.no_scenes else scenes(page)
        start(page); page.evaluate('qa.checkpoint()')
        try:
            page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=60000)
        except Exception:
            pass
        page.evaluate('qa.drive=false;qa.hold=true')
        route = page.evaluate('''()=>({phase:qa.world.phase,hp:qa.world.boss.hp,state:qa.world.boss.st,
          x:qa.world.player.x/40,y:qa.world.player.y,fire:qa.world.player.fire,ball:qa.world.player.ball,
          exitOpen:!qa.world.solid(101,0),turtlesSafe:qa.world.boss.turtles.every(t=>!t.netted&&!t.platform.submerged),
          ...qa.metrics})''')
        page.screenshot(path=str(OUT / 'victoria-recorrido.png'))
        phones = mobile(browser, args.url, errors)
        browser.close()
    report = {'mode': 'Inicio en checkpoint; contacto protegido; sin poderes ni daño asistido; entradas reales de nado, rescates y oxígeno activos.',
              'route': route, 'mobile': phones, 'scenes': captured, 'errors': errors}
    (OUT / 'informe.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False), flush=True)
    assert not errors, errors
    assert route['phase'] == 'done' and route['hp'] == 0 and route['stage'] == 4, route
    assert route['rescues'] >= 12 and route['minOxygen'] > 0 and route['turtlesSafe'] and route['exitOpen'], route
    assert all(not m['overflow'] for m in phones), phones


if __name__ == '__main__':
    main()
