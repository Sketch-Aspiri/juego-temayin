"""Revisa el atrio, sus tres fases y un recorrido con contacto y daño al jefe asistidos."""
import argparse
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / 'verificacion/huay-chivo'
SETUP = r"""async () => {
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const hazards=await import(loaded('/src/engine/bosses/huayChivo/hazards.ts'));
  const tuning=await import(loaded('/src/engine/bosses/huayChivo/tuning.ts'));
  window.qa={store:useAppStore,world:null,hold:false,drive:false,metrics:{},hazards,tuning};
  useAppStore.setState({progress:{levels:{'3-5':{bestScore:1234,stars:2,completions:1}}},
    settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
  const update=World.prototype.update;
  World.prototype.update=function(dt){
    qa.world=this;if(qa.hold)return;
    for(let i=0;i<(qa.drive?8:1);i++){
      if(qa.drive&&this.phase==='play')qa.control(this);
      const start=performance.now();update.call(this,dt);
      qa.metrics.updateMs=(qa.metrics.updateMs||0)+performance.now()-start;
      qa.metrics.steps=(qa.metrics.steps||0)+1;
      if(this.checkpointReached)qa.metrics.checkpoint=true;
      const b=this.boss;
      if(b){qa.metrics.stage=Math.max(qa.metrics.stage||1,b.stage);qa.metrics.states??=[];
        if(!qa.metrics.states.includes(b.st))qa.metrics.states.push(b.st);}
      if(qa.drive&&this.checkpointReached&&!qa.metrics.capturedCheckpoint){
        qa.metrics.capturedCheckpoint=true;qa.hold=true;break;
      }
      if(this.phase==='dying'||this.phase==='done')break;
    }
  };
  qa.control=w=>{
    const p=w.player,input=w.input,b=w.boss;p.inv=1;
    input.press('run');input.release('left');input.release('right');
    let jump=false;
    if(b?.lockCamera&&b.hp>0){
      const dx=b.x+b.w/2-(p.x+p.w/2);
      if(Math.abs(dx)>20)input.press(dx>0?'right':'left');
      jump=p.onGround&&(Math.abs(dx)<190||b.st==='charge'||b.st==='leap');
      // Daño asistido exclusivamente durante la ventana válida; no altera PV ni estados.
      if(b.hittable&&b.t>0.12){b.onFireball(w);qa.metrics.assistedFire=(qa.metrics.assistedFire||0)+1;}
    }else{
      input.press('right');
      const front=p.x+p.w,feet=Math.floor((p.y+p.h-3)/40);
      for(let x=Math.floor(front/40);x<=Math.floor((front+80)/40);x++)if(w.solid(x,feet))jump=p.onGround;
    }
    if(jump&&!input.held.jump)input.press('jump');
    else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
  };
  qa.start=()=>{
    qa.world=null;qa.hold=false;qa.drive=false;qa.metrics={};
    qa.store.getState().startLevel('3-5');
    if(qa.store.getState().screen==='offering')qa.store.getState().continueOffering();
  };
  qa.scene=(st,stage)=>{
    const w=qa.world,b=w.boss;qa.hold=true;w.shake=0;w.camX=62*40;
    w.player.x=68*40;w.player.y=12*40-w.player.h;w.player.inv=0;
    Object.assign(b,{x:74*40,y:12*40-b.h,face:-1,st,t:0.25,clock:8.2,phase:stage,
      hp:stage===1?8:stage===2?5:2,wisps:[],waves:[],stucco:[],decoyX:null});
    w.darkness=tuning.NIGHT_DARKNESS[stage-1];
    for(const torch of w.torches)torch.lit=stage===1;
    if(st==='hidden'){b.blinkX=79*40;b.decoyX=stage===3?67*40:null;}
    if(st==='leap'){b.y-=110;b.leapX=70*40;}
    if(st==='land')hazards.stompWaves(b.waves,74.5*40,stage);
    if(st==='idle'){hazards.callWisps(b.wisps,74.5*40,350,stage);for(const f of b.wisps)f.age=2;}
    if(st==='dazed'){b.x=63*40;b.stucco=[{x:64*40,y:290,t:0.3},{x:63.5*40,y:340,t:0.4}];}
    if(st==='dead'){b.hp=0;w.darkness=null;}
  };
}"""


def start(page):
    page.evaluate('qa.start()')
    page.wait_for_function("qa.world?.def.id==='3-5'")
    page.wait_for_timeout(250)


def capture_scenes(page):
    scenes = []
    for stage in [1, 2, 3]:
        states = ['intro', 'paw', 'charge', 'hidden', 'call', 'idle', 'dazed']
        if stage >= 2:
            states += ['crouch', 'leap', 'land', 'rear', 'horn', 'nightfall']
        if stage == 3:
            states += ['turn']
        for state in states:
            page.evaluate('([s,p])=>qa.scene(s,p)', [state, stage])
            page.wait_for_timeout(700 if state == 'intro' else 120)
            page.screenshot(path=str(OUT / f'{state}-fase{stage}.png'))
            scenes.append({'state': state, 'stage': stage})
    return scenes


def capture_mobile(browser, url, errors):
    context = browser.new_context(is_mobile=True, has_touch=True, device_scale_factor=1,
                                  viewport={'width': 844, 'height': 390})
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    page.wait_for_load_state('networkidle')
    page.evaluate(SETUP)
    start(page)
    page.evaluate("qa.scene('rear',3)")
    for name, width, height in [('horizontal', 844, 390), ('vertical', 390, 844)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.wait_for_timeout(250)
        page.screenshot(path=str(OUT / f'movil-{name}.png'))
        assert page.get_by_role('button', name='Saltar', exact=True).is_visible()
    context.close()


def capture_torches(page):
    page.evaluate("qa.scene('idle',3)")
    page.screenshot(path=str(OUT / 'antorchas-apagadas.png'))
    result = page.evaluate("""async()=>{
      const w=qa.world,count=w.lightSources().length;
      const {updateFireballs}=await import('/src/engine/entities/projectiles.ts');
      for(const t of w.torches)w.fireballs.push({x:t.x,y:t.y,vx:0,vy:0,t:0,gone:false});
      updateFireballs(w,1/120);
      return {before:count,after:w.lightSources().length,lit:w.torches.every(t=>t.lit)};
    }""")
    page.wait_for_timeout(100)
    page.screenshot(path=str(OUT / 'antorchas-encendidas.png'))
    assert result['lit'] and result['after'] == result['before'] + 2, result
    page.evaluate("qa.scene('dead',3)")
    page.wait_for_timeout(120)
    page.screenshot(path=str(OUT / 'victoria-amanecer.png'))
    return result


def route(page):
    page.evaluate("qa.store.getState().go('levels')")
    start(page)
    page.evaluate('qa.drive=true')
    page.wait_for_function('qa.hold&&qa.metrics.checkpoint', timeout=15000)
    page.screenshot(path=str(OUT / 'recorrido-checkpoint.png'))
    page.evaluate('qa.hold=false')
    page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=45000)
    page.evaluate('qa.hold=true;qa.drive=false')
    result = page.evaluate("""()=>({phase:qa.world.phase,hp:qa.world.boss.hp,
      exitOpen:!qa.world.grid.slice(0,12).some(r=>r[86]==='X'),
      darkness:qa.world.darkness,torchesOff:qa.world.torches.every(t=>!t.lit),...qa.metrics})""")
    page.screenshot(path=str(OUT / 'recorrido-final.png'))
    assert result['phase'] == 'done' and result['hp'] == 0, result
    assert result['checkpoint'] and result['exitOpen'] and result['stage'] == 3, result
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capture-only', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 850})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        url = os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5197')
        page.goto(url)
        page.wait_for_load_state('networkidle')
        page.evaluate(SETUP)
        start(page)
        scenes = capture_scenes(page)
        torches = capture_torches(page)
        completion = None if args.capture_only else route(page)
        capture_mobile(browser, url, errors)
        browser.close()
    report = {'mode': 'Escenas preparadas; recorrido con contacto protegido y fuego asistido solo en dazed; no evalúa dificultad ni puntería.',
              'scenes': scenes, 'torches': torches, 'completion': completion, 'errors': errors}
    (OUT / 'revision.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    assert not errors, errors


if __name__ == '__main__':
    main()
