"""Recorre el Mundo 6 en Chromium: contacto protegido; oxígeno y colisiones activos; daño a Lorencillo asistido.

Arranca `npm run dev` (puerto 5197) si no hay ya un servidor, recorre 6-1 a 6-6 hasta el punto de control y la meta,
captura las mecánicas del mundo y comprueba el selector y el desbloqueo desde un guardado con 5-6 completado.
No mide dificultad ni puntería: el contacto con enemigos está desactivado y, con Lorencillo, el pisotón en la
ventana `exposed` se prepara colocando a Temayin encima (el contacto y el daño los resuelve el motor).
Uso: python imagenes/verify_world6.py [6-1 6-2 ...]   (--sin-servidor para reutilizar un servidor ya abierto)
"""
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = 'http://127.0.0.1:5197'
out = Path(__file__).resolve().parent / 'verificacion' / 'mundo6'
out.mkdir(parents=True, exist_ok=True)
LEVEL_TIMEOUT = 170
errors, reports, extras = [], [], {}

SETUP = """async () => {
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {Input}=await import(loaded('/src/engine/input.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const {ALL_LEVELS,getLevel}=await import(loaded('/src/data/worlds.ts'));
  while(useAppStore.getState().screen==='loading')await new Promise(r=>setTimeout(r,100));
  useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
  window.qa={world:null,store:useAppStore,drive:false,hold:false,pending:null,shots:null,metrics:{}};
  const original=World.prototype.update;
  qa.orig=original;
  const col=w=>(w.player.x+w.player.w/2)/40;
  qa.shotDefs={
    '6-1':[
      ['viento-termica',w=>col(w)>56&&col(w)<61&&!w.player.onGround&&w.player.y<8*40],
      ['viento-horizontal',w=>col(w)>85&&col(w)<91&&!w.player.onGround],
      ['checkpoint',w=>w.checkpointReached&&col(w)>109],
    ],
    '6-2':[
      ['fondo-movil-a',w=>qa.metrics.t>3],
      ['hueco-enganche',w=>col(w)>38.5&&col(w)<40.5],
      ['fondo-movil-b',w=>qa.metrics.t>12],
      ['checkpoint',w=>w.checkpointReached&&col(w)>97],
    ],
    '6-3':[
      ['lluvia-inicio',w=>qa.metrics.t>1.5],
      ['cenote-1',w=>col(w)>25&&col(w)<28&&(w.player.swimming||!w.player.onGround)],
      ['cenote-2',w=>col(w)>65&&col(w)<70&&(w.player.swimming||!w.player.onGround)],
      ['cenote-3',w=>col(w)>124&&col(w)<130&&(w.player.swimming||!w.player.onGround)],
    ],
    '6-4':[
      ['oscuridad-inicio',w=>qa.metrics.t>1],
      ['luciernaga-borde',w=>col(w)>27&&col(w)<29&&!w.player.onGround],
      ['foso-largo',w=>col(w)>138&&col(w)<141],
      ['murcielagos',w=>col(w)>163&&col(w)<166],
    ],
    '6-5':[
      ['laguna-A',w=>w.player.swimming&&col(w)>47&&col(w)<50],
      ['laguna-A-cupulas-2',w=>w.player.swimming&&col(w)>57&&col(w)<60],
      ['laguna-B-cupulas',w=>w.player.swimming&&col(w)>127&&col(w)<130],
    ],
    '6-6':[
      ['cangrejos',w=>w.enemies.some(e=>e.alive&&!e.dead&&['pirateCrab','blueCrab'].includes(e.id)&&e.x>w.camX+300&&e.x<w.camX+800)&&w.player.onGround],
      ['canal-1-barcas',w=>col(w)>40&&col(w)<56&&w.player.x>0],
      ['canal-2-barcas',w=>col(w)>118&&col(w)<132],
      ['cartel-lorencillo',w=>w.boss?.intro&&w.boss.t>0.9],
      ['aviso-canonazos',w=>w.boss?.shells?.some(s=>s.burst===0&&s.t>0.45&&s.t<s.warn)],
      ['cangrejos-mastil',w=>w.boss?.crabs?.some(c=>c.alive&&!c.dead)&&w.boss.t>1.2],
      ['ventana-espalda',w=>w.boss?.st==='exposed'&&w.boss.t>0.5],
      ['fase2-aviso',w=>w.boss?.phase===2&&w.boss.tilt.phase==='warn'&&w.boss.tilt.t>0.6],
      ['fase2-inclinacion',w=>w.boss?.phase===2&&w.boss.tilt.phase==='active'&&w.boss.tilt.t>1.6],
      ['muro-abierto',w=>w.boss?.st==='gone'&&!w.particles.some(p=>p.kind==='brick')],
      ['meta',w=>w.phase==='flag'&&w.phaseT>0.8],
    ],
  };
  World.prototype.update=function(dt){
    qa.world=this;
    if(qa.hold)return;
    for(let i=0;i<(qa.drive?8:1);i++){
      if(qa.drive&&this.phase==='play')qa.control(this,dt);
      const before=this.phase;
      original.call(this,dt);
      if(before==='play'&&this.phase==='dying'){qa.metrics.deaths=(qa.metrics.deaths||0)+1;(qa.metrics.deathAt=qa.metrics.deathAt||[]).push({col:+(this.player.x/40).toFixed(1),y:Math.round(this.player.y),vx:Math.round(this.player.vx),vy:Math.round(this.player.vy),swim:this.player.swimming});}
      if(this.checkpointReached)qa.metrics.checkpoint=true;
      qa.metrics.farthest=Math.max(qa.metrics.farthest||0,this.player.x/40);
      if(this.player.swimming)qa.metrics.swam=true;
      qa.metrics.minOxygen=Math.min(qa.metrics.minOxygen??10,this.player.oxygen);
      if(this.boss&&this.boss.st==='gone')qa.metrics.exitOpen=!this.grid.slice(0,12).some(r=>r[this.def.boss.arena[1]+1]==='X');
      if(qa.drive&&qa.shots){
        for(const s of qa.shots)if(!s.done&&s.test(this)){s.done=true;qa.pending=s.name;qa.hold=true;break;}
        if(qa.hold)break;
      }
      if(this.phase==='dying'||this.phase==='done')break;
    }
  };
  qa.make=(def,fromCheckpoint=false)=>new World({def,input:new Input(),audio:new Proxy({},{get:()=>()=>{}}),fromCheckpoint,session:{score:0,coins:0,lives:3}});
  qa.getLevel=getLevel;
  // Salto al borde en niveles con fosos cortos o plataformas; 95 px (más temprano) en el resto, como verify_world5.
  qa.lookahead=id=>['6-1','6-3','6-4'].includes(id)?18:95;
  // Fosos con plataformas intermedias: búsqueda de saltos (DFS) con mundos nuevos y las mismas físicas.
  qa.hopZones={'6-4':[{x0:140,x1:149}]};
  qa.hopStep=(w,hop,st)=>{
    const p=w.player,i=w.input;
    i.press('right');if(hop.run)i.press('run');else i.release('run');
    if(st.phase==='run'){
      if(st.edge===undefined){let c=Math.floor((p.x+p.w/2)/40);const r=Math.floor((p.y+p.h+1)/40);while(w.solid(c+1,r))c++;st.edge=(c+1)*40;}
      if(p.onGround&&p.x+p.w>=st.edge-hop.off){i.press('jump');st.phase='air';st.n=0;}
    }else{
      st.n++;if(st.n>hop.hold)i.release('jump');
      if(!p.onGround)st.air=true;
      if(st.air&&p.onGround){st.phase='done';i.release('jump');}
    }
    return st.phase==='done';
  };
  qa.simPlan=(def,x,camX,plan)=>{
    const w=qa.make(def);w.enemies=[];const p=w.player;
    p.x=x;p.y=480-p.h;p.vx=0;p.vy=0;p.onGround=true;w.camX=camX;
    for(const hop of plan){
      const st={phase:'run'};let n=0;
      while(n++<700&&w.phase==='play'){p.inv=1;if(qa.hopStep(w,hop,st))break;qa.orig.call(w,1/120);}
      if(st.phase!=='done'||w.phase!=='play')return null;
    }
    return w;
  };
  qa.dfs=(def,x,camX,goalX,plan,depth)=>{
    if(depth===0)return null;
    for(const hold of [8,14,20,99])for(const run of [false,true])for(const off of [0,8,16,24,32,40,48]){
      const next=[...plan,{off,run,hold}];
      const w=qa.simPlan(def,x,camX,next);
      if(!w)continue;
      const p=w.player;
      if(p.x+p.w/2>=goalX&&p.y+p.h>=480-1)return next;
      if(p.y+p.h<470){const r=qa.dfs(def,x,camX,goalX,next,depth-1);if(r)return r;}
    }
    return null;
  };
  qa.hopControl=(w)=>{
    const p=w.player,i=w.input,front=p.x+p.w;
    for(const z of qa.hopZones[w.def.id]){
      if(z.done||front<(z.x0-4.5)*40||front>(z.x1+1)*40+20)continue;
      if(!z.plan&&!z.tried){
        if(!p.onGround)return false;
        if(Math.abs(p.vx)>5){i.release('right');i.release('run');return true;}
        z.tried=true;
        z.plan=qa.dfs(w.def,p.x,w.camX,(z.x1+1)*40+4,[],3);
        qa.metrics.hopPlan=z.plan;
        if(z.plan){z.k=0;z.st={phase:'run'};}else{z.done=true;qa.metrics.hopFail=true;return false;}
      }
      if(!z.plan)return false;
      if(qa.hopStep(w,z.plan[z.k],z.st)){z.k++;z.st={phase:'run'};if(z.k>=z.plan.length){z.done=true;z.plan=null;}}
      return true;
    }
    return false;
  };
  qa.control=(w,dt)=>{
    const p=w.player,input=w.input,id=w.def.id,b=w.boss;
    qa.metrics.t=(qa.metrics.t||0)+dt;
    // Solo se protege el daño por contacto; el oxígeno y las colisiones siguen activos.
    p.inv=1;
    if(id==='6-2'){
      // Camina (sin correr) y salta ante huecos o cajas, como el piloto de World6.test.ts.
      const hole=!w.solid(Math.floor((p.x+p.w+14)/40),12);
      const box=w.solid(Math.floor((p.x+p.w+44)/40),11);
      input.press('right');input.release('run');
      if(p.onGround){input.release('jump');if(hole||box)input.press('jump');}
      if(qa.metrics.t>2.95&&qa.metrics.t<3.05)qa.metrics.cam3=w.camX;
      if(qa.metrics.t>11.95&&qa.metrics.t<12.05)qa.metrics.cam12=w.camX;
      return;
    }
    if(id==='6-6'&&b&&b.lockCamera&&b.hp>0){qa.bossControl(w);return;}
    if(qa.hopZones[id]&&!p.swimming&&qa.hopControl(w))return;
    input.press('run');input.press('right');input.release('left');
    const front=p.x+p.w,cx=p.x+p.w/2,tx=Math.floor(front/40);
    let jump=false;
    const pit=w.def.ops.find(o=>o[0]==='pit'&&o[1]*40>front&&!w.level.water.some(z=>o[1]>=z.x0&&o[1]<=z.x1));
    const water=w.level.water.find(z=>cx/40>=z.x0&&cx/40<z.x1+1);
    if(p.swimming){
      if(water){
        const roof=[tx,tx+1,tx+2].some(x=>x>=water.x0&&x<=water.x1&&w.solid(x,water.surface));
        const target=roof?(water.surface+1)*40+8:water.surface*40-65;
        jump=p.y>target+15&&p.vy>=0;
        // Bacalar: se nada por encima de las cúpulas (límite de los pies en filas) hasta acercarse a la orilla.
        if(id==='6-5'&&cx<water.x1*40-100){
          const limit=w.level.water.indexOf(water)===0?11.8:10.9;
          jump=p.y+p.h>limit*40;
        }
      }
      if(w.solid(tx,Math.floor((p.y+p.h-3)/40))&&!w.solid(tx,Math.floor(p.y/40)))jump=true;
      // Una rama sobre la superficie deja 1 bloque de aire: se pasa nadando bajo ella (como cualquier jugador),
      // sin brazadas que choquen con su cara inferior; la cabeza queda a ~20 px bajo el nivel del agua.
      if(id==='6-3'&&water){
        const col0=Math.floor(p.x/40),colN=Math.floor((p.x+p.w)/40)+1;
        const branch=[col0,col0+1,colN,colN+1].some(x=>w.solid(x,water.surface-2)||w.solid(x,water.surface-1));
        if(branch)jump=p.y+p.h>water.surface*40+20+p.h/2;
      }
    }else if(p.onGround||p.coyote>0){
      for(let x=tx;x<=Math.floor((front+qa.lookahead(id))/40);x++)if(!w.solid(x,12)||w.solid(x,Math.floor((p.y+p.h-3)/40)))jump=true;
      for(const e of w.enemies)if(e.alive&&!e.dead&&e.id!=='alux'&&e.x>p.x&&e.x-front<100)jump=true;
      if(id==='6-6'&&cx>32*40&&cx<64*40&&p.onGround)qa.metrics.canalRide=(qa.metrics.canalRide||0)+1;
    }
    if(pit&&!p.swimming&&p.vy>0&&!p.onGround&&p.y+p.h<480&&pit[1]*40-front<120&&!(id==='6-1'&&pit[1]===54)){
      input.release('right');if(p.vx>30)input.press('left');jump=false;
    }
    if(pit&&p.onGround&&p.vx<340&&pit[1]*40-front>20&&pit[1]*40-front<120&&!w.solid(tx,Math.floor((p.y+p.h-3)/40)))jump=false;
    if(jump&&!input.held.jump)input.press('jump');
    else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
  };
  qa.bossControl=(w)=>{
    const p=w.player,input=w.input,b=w.boss;
    const cx=p.x+p.w/2,bx=b.x+b.w/2;
    input.release('run');input.release('jump');
    if(b.tilt.phase==='active'&&p.onGround){
      qa.tiltStart=qa.tiltStart??p.x;
      qa.metrics.tiltDrift=Math.max(qa.metrics.tiltDrift||0,Math.abs(p.x-qa.tiltStart));
    }else qa.tiltStart=null;
    if(b.hittable&&b.t>0.8){
      // Daño asistido: solo dentro de la ventana de espalda expuesta; el pisotón lo resuelve el motor.
      if(!qa.stomping){p.x=bx-p.w/2;p.y=b.y-p.h-30;p.vy=200;p.vx=0;qa.stomping=true;qa.metrics.assisted=(qa.metrics.assisted||0)+1;}
      return;
    }
    if(!b.hittable)qa.stomping=false;
    const home=(b.arena[0]+3)*40,dx=home-cx;
    input.release('right');input.release('left');
    if(dx>30)input.press('right');else if(dx<-30)input.press('left');
  };
}"""

STROMATOLITE_SCENE = """() => {
  const s=qa.world.level.stromatolites[0], p=qa.world.player;
  qa.hold=false;qa.drive=false;qa.world.enemies=[];
  qa.world.session.score=5000;
  p.x=(s.x+1)*40;p.y=s.y*40-p.h-2;p.vx=0;p.vy=0;qa.world.camX=p.x-300;
}"""

SWEEP_61 = """([thermal,run])=>{
  const base=qa.getLevel('6-1');
  const def=thermal?base:{...base,ops:base.ops.filter(o=>o[0]!=='wind')};
  const res=[];
  for(let off=-20;off<=80;off+=4){
    const w=qa.make(def);w.enemies=[];const p=w.player;
    p.x=50*40+2;p.y=9*40-p.h;p.onGround=true;p.vx=0;w.camX=p.x-300;
    w.input.press('right');if(run)w.input.press('run');
    let jumped=false,air=false,landed=null,steps=0,runup=0;
    while(steps<120*8&&w.phase==='play'){
      if(!jumped&&p.x+p.w>=54*40-off){w.input.press('jump');jumped=true;runup=p.vx;}
      qa.orig.call(w,1/120);steps++;
      if(jumped&&!p.onGround)air=true;
      if(air&&p.onGround){landed={x:+(p.x/40).toFixed(2),y:Math.round(p.y+p.h)};break;}
    }
    res.push({off,vx:Math.round(runup),landed,phase:w.phase});
  }
  return res;
}"""

SWEEP_BOATS = """([startCol,endCol,hold,firstBoat,offset])=>{
  const w=qa.make(qa.getLevel('6-6'));w.enemies=[];const p=w.player,input=w.input;
  p.x=(startCol+3)*40-p.w-4;p.y=360-p.h;p.vx=0;p.vy=0;p.onGround=true;w.camX=p.x-300;
  // La primera barca arrancó antes: su ciclo va adelantado `offset` s respecto a la segunda (depende de la velocidad del jugador).
  for(const q of w.platforms)if(q.spec.appearance==='boat'&&q.spec.x===firstBoat)q.t+=offset;
  let hops=0,swamAt=null,jumpHeld=0,t=0,rides=0;
  for(let n=0;n<120*90&&w.phase==='play';n++){
    p.inv=1;
    const front=p.x+p.w,feet=p.y+p.h;
    if(p.onGround){
      jumpHeld=0;
      let target=null;
      for(const q of w.platforms){if(q.spec.appearance!=='boat')continue;const gap=q.x-front;if(gap>=-20&&gap<=hold&&Math.abs(q.y-feet)<=50&&q.x+q.w>front+10){target=q;break;}}
      if(!target&&endCol*40-front<=hold&&endCol*40-front>=-20)target='fin';
      if(target){input.press('right');input.press('jump');hops++;}
      else{
        input.release('jump');rides++;
        // Sobre una barca: se camina hasta su proa para tener alcance a la siguiente.
        const under=w.platforms.find(q=>q.spec.appearance==='boat'&&Math.abs(q.y-feet)<6&&q.x<front&&q.x+q.w>p.x);
        if(under&&front<under.x+under.w-6)input.press('right');else input.release('right');
      }
    }else{
      input.press('right');
      if(++jumpHeld>40||p.vy>0)input.release('jump');
    }
    qa.orig.call(w,1/120);t+=1/120;
    if(p.swimming&&swamAt===null)swamAt=+(p.x/40).toFixed(1);
    if(p.onGround&&p.x/40>=endCol&&Math.abs(feet-360)<2)return {ok:true,t:+t.toFixed(1),hops,swamAt,ridesSteps:rides};
  }
  return {ok:false,t:+t.toFixed(1),hops,swamAt,x:+(p.x/40).toFixed(1),phase:w.phase};
}"""

SWEEP_62 = """([run,hold])=>{
  const def=qa.getLevel('6-2');
  const res=[];
  for(let d=0.25;d<=4.01;d+=0.25){
    const w=qa.make(def);w.enemies=[];const p=w.player;
    p.x=28*40;p.y=480-p.h;p.onGround=true;p.vx=0;w.camX=p.x-480;
    w.input.press('right');if(run)w.input.press('run');
    let jumped=false,air=false,landed=null,steps=0,jt=0;
    while(steps<120*4&&w.phase==='play'){
      if(!jumped&&p.x+p.w>=35*40-d*40){w.input.press('jump');jumped=true;}
      if(jumped&&!hold&&++jt>18)w.input.release('jump');
      qa.orig.call(w,1/120);steps++;
      if(jumped&&!p.onGround)air=true;
      if(air&&p.onGround){landed=+(p.x/40).toFixed(2);break;}
    }
    res.push({d,landedCol:landed,phase:w.phase,vxEnd:Math.round(p.vx)});
  }
  return res;
}"""


def server_alive():
    try:
        urllib.request.urlopen(URL, timeout=2)
        return True
    except Exception:
        return False


def start_server():
    if server_alive():
        return None
    proc = subprocess.Popen('npm run dev -- --port 5197 --host 127.0.0.1 --strictPort', shell=True, cwd=ROOT,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(90):
        if server_alive():
            return proc
        time.sleep(1)
    proc.kill()
    raise RuntimeError('Vite no arrancó en el puerto 5197')


def stop_server(proc):
    if proc is None:
        return
    subprocess.run(f'taskkill /PID {proc.pid} /T /F', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def new_page(browser, **kwargs):
    page = browser.new_page(**kwargs)
    page.on('pageerror', lambda error: errors.append(f'pageerror: {error}'))
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate(SETUP)
    return page


def run_level(page, level, prefix=''):
    page.evaluate('id=>{qa.hold=false;qa.pending=null;qa.shots=null;qa.drive=false;qa.metrics={};qa.stomping=false;qa.tiltStart=null;qa.store.getState().startLevel(id)}', level)
    if level == '6-6':
        page.wait_for_function('qa.store.getState().screen==="offering"', timeout=30000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(out / f'{prefix}{level}-ek-chuah.png'))
        page.evaluate('qa.store.getState().continueOffering()')
    page.wait_for_function('id=>qa.world?.def.id===id', arg=level, timeout=30000)
    page.wait_for_timeout(400)
    page.screenshot(path=str(out / f'{prefix}{level}-inicio.png'))
    page.wait_for_timeout(3000)
    page.evaluate("id=>{qa.shots=(qa.shotDefs[id]||[]).map(([name,test])=>({name,test,done:false}));qa.drive=true}", level)
    deadline = time.time() + LEVEL_TIMEOUT
    shots = []
    while time.time() < deadline:
        try:
            page.wait_for_function("qa.pending||qa.world?.phase==='done'", timeout=2000)
        except Exception:
            continue
        name = page.evaluate('qa.pending')
        if not name:
            break
        page.wait_for_timeout(250)
        page.screenshot(path=str(out / f'{prefix}{level}-{name}.png'))
        shots.append(name)
        page.evaluate('qa.pending=null;qa.hold=false')
    page.evaluate('qa.drive=false')
    report = page.evaluate("""()=>({id:qa.world.def.id,mode:'contacto protegido; oxígeno y colisiones activos',phase:qa.world.phase,
      x:+(qa.world.player.x/40).toFixed(1),lives:qa.world.session.lives,bossHp:qa.world.boss?.hp??null,...qa.metrics})""")
    report['capturas'] = shots
    page.screenshot(path=str(out / f'{prefix}{level}-recorrido.png'))
    print(json.dumps(report, ensure_ascii=False), flush=True)
    page.evaluate("qa.store.getState().go('levels')")
    page.wait_for_timeout(150)
    return report


def stromatolite_scene(page):
    page.evaluate('qa.store.getState().startLevel("6-5")')
    page.wait_for_function('qa.world?.def.id==="6-5"', timeout=30000)
    page.wait_for_timeout(3500)
    page.evaluate(STROMATOLITE_SCENE)
    page.wait_for_timeout(550)
    page.screenshot(path=str(out / '6-5-aviso-estromatolito.png'))
    popups = page.evaluate('qa.world.popups.map(p=>p.txt)')
    page.wait_for_timeout(900)
    page.screenshot(path=str(out / '6-5-aviso-estromatolito-velo.png'))
    data = page.evaluate("""()=>({damaged:qa.world.stromatolites.filter(s=>s.damaged).length,
      score:qa.world.session.score,lives:qa.world.session.lives,phase:qa.world.phase,
      })""")
    data['popups550ms'] = popups
    print('estromatolito', json.dumps(data, ensure_ascii=False), flush=True)
    page.evaluate("qa.store.getState().go('levels')")
    return data


def selector_check(browser):
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.on('pageerror', lambda error: errors.append(f'pageerror: {error}'))
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate("""()=>{
      const levels={};
      for(const id of ['1-1','1-2','1-3','1-4','1-5','1-6','2-1','2-2','2-3','2-4','2-5','2-6','2-7','3-1','3-2','3-3','3-4','3-5','4-1','4-2','4-3','4-4','4-5','5-1','5-2','5-3','5-4','5-5','5-6'])levels[id]={bestScore:100,stars:1,completions:1};
      localStorage.setItem('temayin:v3',JSON.stringify({progress:{levels},settings:{muted:true,introSeen:true},wallet:{cacao:0,pending:{}}}));
    }""")
    page.reload()
    page.wait_for_load_state('networkidle')
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      while(useAppStore.getState().screen==='loading')await new Promise(r=>setTimeout(r,100));
      useAppStore.getState().go('levels');
    }""")
    page.wait_for_selector('.level-tile')
    info = page.evaluate("""()=>{
      const tile=id=>[...document.querySelectorAll('.level-tile')].find(t=>t.querySelector('.level-tile__id')?.textContent===id);
      const titles=[...document.querySelectorAll('.world__title')].map(t=>t.textContent);
      return {titles,tile61Disabled:tile('6-1')?.disabled,tile62Disabled:tile('6-2')?.disabled,tile66:tile('6-6')?.textContent,
        soon:document.querySelector('.world--soon')?.textContent||null,
        guardados:Object.keys(JSON.parse(localStorage.getItem('temayin:v3')).progress.levels).length};
    }""")
    page.locator('.world__title', has_text='Mundo 6').scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    page.screenshot(path=str(out / 'selector-mundo6.png'))
    print('selector', json.dumps(info, ensure_ascii=False), flush=True)
    page.close()
    return info


def main():
    selected = [a for a in sys.argv[1:] if not a.startswith('--')] or ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6']
    server = start_server() if '--sin-servidor' not in sys.argv else None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = new_page(browser, viewport={'width': 1280, 'height': 850})
            if '6-1' in selected:
                extras['salto6_1'] = {}
                page.evaluate('id=>{qa.store.getState().startLevel(id)}', '6-1')
                page.wait_for_function('qa.world?.def.id==="6-1"', timeout=30000)
                for thermal in (True, False):
                    for run in (False, True):
                        key = ('termica' if thermal else 'sin-termica') + '-' + ('correr' if run else 'caminar')
                        extras['salto6_1'][key] = page.evaluate(SWEEP_61, [thermal, run])
                page.evaluate("qa.store.getState().go('levels')")
            if '6-2' in selected:
                extras['salto6_2_caja'] = {}
                page.evaluate('id=>{qa.store.getState().startLevel(id)}', '6-2')
                page.wait_for_function('qa.world?.def.id==="6-2"', timeout=30000)
                for run in (False, True):
                    for hold in (True, False):
                        key = ('correr' if run else 'caminar') + '-' + ('mantener' if hold else 'toque')
                        extras['salto6_2_caja'][key] = page.evaluate(SWEEP_62, [run, hold])
                page.evaluate("qa.store.getState().go('levels')")
            if '6-6' in selected:
                extras['barcas6_6'] = {}
                page.evaluate('id=>{qa.store.getState().startLevel(id)}', '6-6')
                page.wait_for_function('qa.store.getState().screen==="offering"', timeout=30000)
                page.evaluate('qa.store.getState().continueOffering()')
                page.wait_for_function('qa.world?.def.id==="6-6"', timeout=30000)
                for name, start, end, first in (('canal1', 32, 62, 36), ('canal2', 112, 140, 116)):
                    for tenths in range(0, 50, 5):
                        offset = tenths / 10
                        extras['barcas6_6'][f'{name}-desfase{offset}s'] = page.evaluate(SWEEP_BOATS, [start, end, 90, first, offset])
                page.evaluate("qa.store.getState().go('levels')")
            for level in selected:
                reports.append(run_level(page, level))
            if '6-5' in selected:
                extras['estromatolito'] = stromatolite_scene(page)
            page.close()
            if '6-2' in selected:
                vertical = new_page(browser, viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
                extras['vertical6_2'] = run_level(vertical, '6-2', 'vertical-')
                vertical.close()
            extras['selector'] = selector_check(browser)
            browser.close()
    finally:
        stop_server(server)
        (out / 'recorridos.json').write_text(json.dumps({'levels': reports, 'extras': extras, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
    assert not errors, errors
    assert all(r['phase'] == 'done' and r.get('checkpoint') for r in reports), reports


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
