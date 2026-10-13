"""Revisa cofres, sillares y columnas pintadas, un premio real y el recorrido de Palenque."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
args = parser.parse_args()
out = Path(__file__).resolve().parent / 'verificacion/arte-maya'
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
      const {MAYA_TILE_SPRITES}=await import('/src/data/mayaTileSprites.ts');
      await Promise.all(Object.values(MAYA_TILE_SPRITES).map(async s=>{const img=new Image();img.src='/assets/'+s.file;await img.decode()}));
      useAppStore.setState({settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      window.qa={store:useAppStore,world:null,hold:false,drive:false,stats:{}};
      const update=World.prototype.update;
      World.prototype.update=function(dt){
        qa.world=this;if(qa.hold)return;
        for(let i=0;i<(qa.drive?8:1);i++){
          if(qa.drive&&this.phase==='play'){
            const p=this.player,input=this.input;p.inv=1;input.press('right');input.press('run');
            const front=p.x+p.w,tx=Math.floor(front/40),feet=Math.floor((p.y+p.h-3)/40);
            let jump=false;
            if(p.onGround||p.coyote>0)for(let x=tx;x<=Math.floor((front+95)/40);x++)if(!this.solid(x,12)||this.solid(x,feet))jump=true;
            if(jump&&!input.held.jump)input.press('jump');else if(p.vy>=0||(!jump&&p.onGround))input.release('jump');
          }
          update.call(this,dt);if(this.checkpointReached)qa.stats.checkpoint=true;
          if(this.phase==='done'||this.phase==='dying')break;
        }
      };
      useAppStore.getState().startLevel('1-1');
    }""")
    page.wait_for_function("qa.world?.def.id==='1-1'")
    page.wait_for_timeout(200)
    page.evaluate('qa.world.phaseT=10')
    page.evaluate('qa.hold=true')
    page.wait_for_function("!document.querySelector('.level-card')||Number(getComputedStyle(document.querySelector('.level-card')).opacity)===0")
    page.screenshot(path=str(out / 'palenque-cofres.png'))
    page.evaluate("""()=>{const w=qa.world,p=w.player;p.x=15*40+6;p.y=480-p.h;p.vx=0;p.vy=0;p.inv=2;
      p.onGround=true;w.input.press('jump');qa.hold=false;}""")
    page.wait_for_function("qa.world.tileAt(15,8)==='U'")
    page.evaluate('qa.hold=true;qa.world.input.reset();qa.world.player.inv=0')
    reward = page.evaluate('()=>({tile:qa.world.tileAt(15,8),coins:qa.world.session.coins,solid:qa.world.solid(15,8)})')
    page.wait_for_timeout(100)
    page.screenshot(path=str(out / 'cofre-vaciado-real.png'))
    page.evaluate("""()=>{const w=qa.world,p=w.player;w.camX=24*40;p.x=26*40;p.y=480-p.h;
      p.vx=0;p.vy=0;p.inv=0;p.anim='idle';p.frame=0;p.onGround=true;}""")
    page.wait_for_timeout(100)
    page.screenshot(path=str(out / 'columnas-alturas.png'))
    page.set_viewport_size({'width': 844, 'height': 390})
    page.wait_for_timeout(100)
    page.screenshot(path=str(out / 'columnas-movil.png'))
    page.set_viewport_size({'width': 1280, 'height': 850})
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {drawMayaTile}=await import(loaded('/src/engine/render/mayaTiles.ts'));
      const {createMayaTextures}=await import(loaded('/src/engine/render/mayaTextures.ts'));
      const board=document.createElement('div');board.id='qa-gallery';
      board.style='position:fixed;inset:0;z-index:99999;background:#183d3b;display:grid;grid-template-columns:repeat(3,1fr);padding:12px;gap:12px';
      for(const [label,tile]of [['Cofre con premio','?'],['Cofre vacío','U'],['Sillar rompible','B'],['Columna de 2 bloques',2],['Columna de 4 bloques',4],['Respaldo durante la carga',null]]){
        const canvas=document.createElement('canvas');canvas.width=390;canvas.height=390;const c=canvas.getContext('2d');
        c.fillStyle='#fff';c.font='18px sans-serif';c.fillText(label,12,24);
        if(typeof tile==='string'){
          c.save();c.translate(80,65);c.scale(4,4);drawMayaTile(c,tile,0,0);c.restore();
          drawMayaTile(c,tile,140,265);c.fillText('Tamaño real: 40 px',80,330);
        }else if(typeof tile==='number'){
          c.save();c.translate(105,40);c.scale(2,2);
          for(let y=0;y<tile;y++)for(let x=0;x<2;x++)drawMayaTile(c,y===0?(x?'q':'p'):(x?'r':'l'),x*40,y*40);
          c.restore();
        }else{
          const tex=createMayaTextures();c.drawImage(tex.question,40,70,120,120);c.drawImage(tex.used,220,70,120,120);
          for(let y=0;y<3;y++)for(let x=0;x<2;x++)c.drawImage(tex[y===0?(x?'pipeTR':'pipeTL'):(x?'pipeBR':'pipeBL')],140+x*40,230+y*40);
        }
        board.append(canvas);
      }
      document.body.append(board);
    }""")
    page.screenshot(path=str(out / 'sprites-a-escala.png'))
    page.evaluate("document.getElementById('qa-gallery').remove();qa.hold=false;qa.store.getState().go('levels')")
    page.wait_for_timeout(50)
    page.evaluate("qa.stats={};qa.world=null;qa.store.getState().startLevel('1-1')")
    page.wait_for_function('qa.world?.player.x<200')
    page.evaluate('qa.drive=true')
    page.wait_for_function("qa.world.phase==='done'||qa.world.phase==='dying'", timeout=45000)
    page.evaluate('qa.hold=true;qa.drive=false')
    completion = page.evaluate('()=>({phase:qa.world.phase,...qa.stats})')
    page.screenshot(path=str(out / 'palenque-meta.png'))
    # Se revisa el terreno compartido también en costa y cueva, sin cambiar el guardado del usuario.
    for level, x in [('5-3', 27), ('3-1', 20)]:
        page.evaluate("qa.hold=false;qa.store.getState().go('levels')")
        page.wait_for_timeout(50)
        page.evaluate("""id=>{qa.world=null;qa.store.setState({progress:{levels:{[id]:{bestScore:0,stars:1,completions:1}}}});
          qa.store.getState().startLevel(id)}""", level)
        page.wait_for_function('id=>qa.world?.def.id===id', arg=level)
        page.evaluate("""x=>{qa.hold=true;const w=qa.world,p=w.player;w.phaseT=10;w.camX=(x-8)*40;
          p.x=x*40;p.y=480-p.h;p.inv=0;p.anim='idle';p.frame=0;}""", x)
        page.wait_for_timeout(150)
        page.wait_for_function("!document.querySelector('.level-card')||Number(getComputedStyle(document.querySelector('.level-card')).opacity)===0")
        page.screenshot(path=str(out / f'{level}-terreno.png'))
    browser.close()

payload = {'reward': reward, 'completion': completion, 'errors': errors,
           'mode': 'Premio real desde abajo, escenas preparadas de columnas y sprites; recorrido de Palenque con contacto protegido y colisiones activas.'}
(out / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(payload, ensure_ascii=False))
assert not errors, errors
assert reward == {'tile': 'U', 'coins': 1, 'solid': True}, reward
assert completion['phase'] == 'done' and completion.get('checkpoint'), completion
