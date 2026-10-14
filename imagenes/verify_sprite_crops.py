"""Verifica siluetas, proporciones del jugador, historia y recorrido de Palenque en Chromium."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
parser.add_argument('--output', default='imagenes/verificacion/recortes', help='Carpeta de capturas e informe')
args = parser.parse_args()
out = ROOT / args.output
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    report = page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {bakedFrame,lazyImage,warmArt}=await import(loaded('/src/engine/render/artCache.ts'));
      const {TOH_POSES,TOH_FILE}=await import('/src/data/tohSprites.ts');
      const {PLAYER_SPRITES}=await import('/src/data/playerSprites.ts');
      const {PLAYER_HEAD_WIDTH,PLAYER_RUN_HEAD_WIDTH,PLAYER_HEAD_WIDTHS,PLAYER_POSE_HEAD_WIDTHS}=await import('/src/data/playerScale.ts');
      const {GAMEPLAY_SPRITES}=await import('/src/data/gameplaySprites.ts');
      const {createPlayer}=await import(loaded('/src/engine/entities/player.ts'));
      const {loadAssets}=await import(loaded('/src/engine/assets.ts'));
      const {drawPlayerSprite}=await import(loaded('/src/engine/render/sprites.ts'));
      const assets=await loadAssets();warmArt();
      const img=new Image();img.src='/assets/personajes/toh.webp';await img.decode();
      const board=document.createElement('div');board.id='qa-gallery';
      board.style='position:fixed;inset:0;z-index:99999;background:#193b3f;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:24px';
      document.body.append(board);
      const metrics=[];
      const poseNames={perch:'Reposo',perchLook:'Mirada',perchTail:'Cola péndulo',flyUp:'Alas arriba',flyDown:'Alas abajo',point:'Guía'};
      const opaque=data=>{let n=0;for(let i=3;i<data.length;i+=4)if(data[i]>=40)n++;return n};
      for(const [name,pose]of Object.entries(TOH_POSES)){
        const [x,y,w,h]=pose.frame;
        const raw=document.createElement('canvas');raw.width=w;raw.height=h;const rc=raw.getContext('2d');
        rc.drawImage(img,x,y,w,h,0,0,w,h);
        const rawPixels=opaque(rc.getImageData(0,0,w,h).data);
        const clean=bakedFrame(TOH_FILE,pose.frame,1,true);
        if(!clean)throw Error('No se cargó el recorte '+name);
        const cleanedPixels=opaque(clean.getContext('2d').getImageData(0,0,w,h).data);
        const canvas=document.createElement('canvas');canvas.width=360;canvas.height=300;
        const c=canvas.getContext('2d');c.fillStyle='#fff';c.font='18px sans-serif';c.fillText(poseNames[name],12,24);
        c.drawImage(clean,0,0,w,h,(360-w*.46)/2,36,w*.46,h*.46);
        c.strokeStyle='#f6dca8';c.beginPath();c.moveTo(20,36+(pose.footY-y)*.46);c.lineTo(340,36+(pose.footY-y)*.46);c.stroke();
        board.append(canvas);metrics.push({pose:name,rawPixels,cleanedPixels,removed:rawPixels-cleanedPixels});
      }
      window.qaSprites={assets,board,metrics,lazyImage,PLAYER_SPRITES,PLAYER_HEAD_WIDTH,PLAYER_RUN_HEAD_WIDTH,PLAYER_HEAD_WIDTHS,PLAYER_POSE_HEAD_WIDTHS,GAMEPLAY_SPRITES,
        createPlayer,drawPlayerSprite,World:null,world:null,hold:false,drive:false,stats:{}};
      return metrics;
    }""")
    page.screenshot(path=str(out / 'toh-seis-poses.png'))
    others = page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {bakedFrame,lazyImage}=await import(loaded('/src/engine/render/artCache.ts'));
      const cases=[['Embestida de Kaimán','bosses/kaiman.webp',[522,207,520,253]],
        ['Camazotz en vuelo','bosses/camazotz.webp',[6,808,451,382]],
        ['Palapa','complementos/utileria.webp',[28,330,487,354]],
        ['Bandera','complementos/banderas.webp',[16,16,412,316]]];
      qaSprites.board.replaceChildren();qaSprites.board.style.gridTemplateColumns='repeat(2,1fr)';
      const metrics=[];
      const count=a=>{let n=0;for(let i=3;i<a.length;i+=4)if(a[i]>=40)n++;return n};
      for(const [label,file,frame]of cases){
        const im=new Image();im.src='/assets/'+file;await im.decode();
        const [x,y,w,h]=frame,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const c=canvas.getContext('2d');c.drawImage(im,x,y,w,h,0,0,w,h);
        const raw=count(c.getImageData(0,0,w,h).data),clean=bakedFrame(file,frame,1,true);
        if(!clean)throw Error('Falta el recorte '+file);
        const removed=raw-count(clean.getContext('2d').getImageData(0,0,w,h).data);
        metrics.push({file,removed});
        const card=document.createElement('canvas');card.width=500;card.height=350;const cc=card.getContext('2d');
        const scale=Math.min(450/w,270/h);cc.drawImage(clean,0,0,w,h,(500-w*scale)/2,45,w*scale,h*scale);
        cc.fillStyle='#fff';cc.font='18px sans-serif';cc.fillText(label,12,25);qaSprites.board.append(card);
      }
      const blocks=new Image();blocks.src='/assets/complementos/bloques.webp';await blocks.decode();
      if(blocks.naturalWidth!==1312)throw Error('El atlas de bloques no se ha restaurado');
      return metrics;
    }""")
    page.screenshot(path=str(out / 'otros-recortes.png'))
    players = page.evaluate("""()=>{
      const qa=qaSprites;qa.board.replaceChildren();qa.board.style.gridTemplateColumns='repeat(7,1fr)';
      const metrics=[];
      const animNames={idle:'Reposo',run:'Carrera',jump:'Salto',fall:'Caída',win:'Celebración'};
      for(const anim of ['idle','run','jump','fall','win'])for(let i=0;i<qa.PLAYER_SPRITES[anim].length;i++){
        const canvas=document.createElement('canvas');canvas.width=150;canvas.height=155;const c=canvas.getContext('2d');
        const p=qa.createPlayer(0);p.x=75-p.w/2;p.y=125-p.h;p.anim=anim;p.frame=i;
        qa.drawPlayerSprite(c,qa.assets,p,0,false,0,100);
        const data=c.getImageData(0,0,150,155).data;let top=155,bottom=0,left=150,right=0;
        for(let y=0;y<155;y++)for(let x=0;x<150;x++)if(data[(y*150+x)*4+3]>=40){
          top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
        }
        const head=(right-left+1)*qa.PLAYER_HEAD_WIDTHS[anim][i]/qa.PLAYER_SPRITES[anim][i].w;
        metrics.push({anim,frame:i,height:bottom-top+1,bottom,head,
          expectedHead:anim==='run'?qa.PLAYER_RUN_HEAD_WIDTH:qa.PLAYER_HEAD_WIDTH});
        c.strokeStyle='#f6dca8';c.beginPath();c.moveTo(0,125);c.lineTo(150,125);c.moveTo(0,43);c.lineTo(150,43);c.stroke();
        c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(`${animNames[anim]} ${i+1}`,8,20);qa.board.append(canvas);
      }
      return metrics;
    }""")
    page.locator('#qa-gallery').evaluate('e=>{e.style.inset="auto";e.style.position="absolute";e.style.top="0";e.style.left="0";e.style.width="1280px";e.style.overflow="visible"}')
    page.screenshot(path=str(out / 'temayin-todas-las-poses.png'), full_page=True)
    page.wait_for_function("qaSprites.lazyImage('personajes/jugador-mecanicas.webp')")
    poses = page.evaluate("""()=>{
      const qa=qaSprites;qa.board.replaceChildren();
      qa.board.style.gridTemplateColumns='repeat(5,1fr)';
      const cases=[['Reposo',{anim:'idle'}],['Carrera',{}],['Salto',{anim:'jump',frame:3}],['Caída',{anim:'fall'}],
        ['Nado avance',{swimming:true,animT:0}],
        ['Nado patada',{swimming:true,animT:.4}],['Brazada',{swimming:true,strokeT:.2}],
        ['Agarre',{swinging:0,vx:0}],['Balanceo',{swinging:0,vx:100}],['Pelota',{ball:true,throwT:.2}]];
      const metrics=[];
      for(const face of [1,-1])for(const [pose,state]of cases){
        const canvas=document.createElement('canvas');canvas.width=150;canvas.height=210;const c=canvas.getContext('2d');
        const p=Object.assign(qa.createPlayer(0),{anim:'run',frame:0,face},state);
        p.x=75-p.w/2;p.y=125-p.h;const before=JSON.stringify(p);
        qa.drawPlayerSprite(c,qa.assets,p,0,false,0,100);
        const data=c.getImageData(0,0,150,210).data;let top=210,bottom=0,left=150,right=0;
        for(let y=0;y<210;y++)for(let x=0;x<150;x++)if(data[(y*150+x)*4+3]>=40){
          top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
        }
        const poseIds={'Nado avance':'swimGlide','Nado patada':'swimKick','Brazada':'swimStroke',
          'Agarre':'hanging','Balanceo':'swinging','Pelota':'throwing'},id=poseIds[pose];
        const sourceWidth=id?qa.GAMEPLAY_SPRITES[id].frame[2]:qa.PLAYER_SPRITES[p.anim][p.frame].w;
        const headWidth=id?qa.PLAYER_POSE_HEAD_WIDTHS[id]:qa.PLAYER_HEAD_WIDTHS[p.anim][p.frame];
        metrics.push({pose,face,height:bottom-top+1,width:right-left+1,head:(right-left+1)*headWidth/sourceWidth,
          expectedHead:!id&&p.anim==='run'?qa.PLAYER_RUN_HEAD_WIDTH:qa.PLAYER_HEAD_WIDTH,
          simulationUnchanged:JSON.stringify(p)===before});
        c.strokeStyle='#f6dca8';c.beginPath();c.moveTo(0,top);c.lineTo(150,top);c.moveTo(0,bottom+1);c.lineTo(150,bottom+1);c.stroke();
        c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(pose,8,20);qa.board.append(canvas);
      }
      return metrics;
    }""")
    page.screenshot(path=str(out / 'temayin-nado-cuerda-pelota.png'), full_page=True)
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const [{World},{Renderer},{Input},{AudioEngine},{ALL_LEVELS}]=await Promise.all([
        import(loaded('/src/engine/World.ts')),import(loaded('/src/engine/render/Renderer.ts')),
        import(loaded('/src/engine/input.ts')),import(loaded('/src/engine/audio.ts')),import(loaded('/src/data/worlds.ts'))]);
      const qa=qaSprites;Object.assign(qa,{World,Renderer,Input,AudioEngine,ALL_LEVELS});
      qa.board.replaceChildren();qa.board.style.gridTemplateColumns='1fr';
      qa.sceneCanvas=document.createElement('canvas');qa.sceneCanvas.width=960;qa.sceneCanvas.height=560;qa.board.append(qa.sceneCanvas);
    }""")
    scenes = []
    for level, pose in [('1-2', 'avance'), ('1-2', 'patada'), ('1-2', 'brazada'),
                        ('3-4', 'agarre'), ('3-4', 'balanceo'), ('4-1', 'pelota')]:
        scene = page.evaluate("""({level,pose})=>{
          const qa=qaSprites,audio=new qa.AudioEngine();audio.muted=true;
          const w=new qa.World({def:qa.ALL_LEVELS.find(l=>l.id===level),audio,input:new qa.Input(),session:{score:0,coins:0,lives:3}});
          const p=w.player;w.phaseT=10;
          if(level==='1-2'){
            p.x=70*40;p.y=9*40;p.swimming=true;p.onGround=false;
            p.animT=pose==='patada'?.4:0;p.strokeT=pose==='brazada'?.2:0;
          }else if(level==='3-4'){
            const r=w.ropes[0];r.angle=pose==='balanceo'?.35:0;
            p.swinging=0;p.vx=pose==='balanceo'?100:0;p.onGround=false;
            p.x=r.x+Math.sin(r.angle)*r.length-p.w/2;p.y=r.y+Math.cos(r.angle)*r.length-p.h/2;
          }else{p.x=27*40;p.y=480-p.h;p.ball=true;p.throwT=.2;}
          w.camX=Math.max(0,p.x-9*40);
          const state=()=>JSON.stringify({player:p,grid:w.grid,ropes:w.ropes,session:w.session});
          const before=state();new qa.Renderer(qa.sceneCanvas,qa.assets).render(w,1000,false);
          return {level,pose,simulationUnchanged:state()===before};
        }""", {'level': level, 'pose': pose})
        scenes.append(scene)
        page.locator('#qa-gallery canvas').screenshot(path=str(out / f'{level}-{pose}.png'))
    page.evaluate('qaSprites.board.remove()')
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const qa=qaSprites;qa.store=useAppStore;
      useAppStore.setState({settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
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
      qa.store.getState().startLevel('1-1');
    }""")
    page.wait_for_function("qaSprites.world?.def.id==='1-1'")
    page.wait_for_timeout(250)
    page.evaluate("""()=>{const qa=qaSprites,w=qa.world,p=w.player;qa.hold=true;
      w.camX=(w.checkpointTile-8)*40;p.x=(w.checkpointTile-4)*40;p.y=480-p.h;p.anim='idle';p.frame=0;p.inv=0;}""")
    page.wait_for_timeout(300)
    page.screenshot(path=str(out / 'checkpoint-reposo.png'))
    page.evaluate("qaSprites.world.player.anim='run';qaSprites.world.player.frame=1")
    page.wait_for_timeout(100)
    page.screenshot(path=str(out / 'checkpoint-carrera.png'))
    for anim, frame in [('jump', 4), ('fall', 0)]:
        page.evaluate("""({anim,frame})=>{const p=qaSprites.world.player;
          p.anim=anim;p.frame=frame;p.y=360-p.h;}""", {'anim': anim, 'frame': frame})
        page.wait_for_timeout(100)
        page.screenshot(path=str(out / f'checkpoint-{anim}.png'))
    page.evaluate("""()=>{const p=qaSprites.world.player;p.anim='idle';p.frame=0;p.y=480-p.h;}""")
    page.evaluate('qaSprites.world.checkpointReached=true')
    page.wait_for_timeout(100)
    page.screenshot(path=str(out / 'toh-checkpoint-activo.png'))
    page.evaluate("qaSprites.hold=false;qaSprites.store.getState().go('levels')")
    page.wait_for_timeout(50)
    page.evaluate("qaSprites.stats={};qaSprites.store.getState().startLevel('1-1')")
    page.wait_for_function('qaSprites.world?.player.x<200')
    page.evaluate('qaSprites.drive=true')
    page.wait_for_function("qaSprites.world.phase==='done'||qaSprites.world.phase==='dying'", timeout=45000)
    page.evaluate('qaSprites.hold=true;qaSprites.drive=false')
    completion = page.evaluate('()=>({phase:qaSprites.world.phase,...qaSprites.stats})')
    page.screenshot(path=str(out / 'palenque-meta.png'))
    # Se comprueban los dos actores de la historia que usan recortes solapados.
    for label, size in [('escritorio', {'width': 1280, 'height': 900}), ('movil', {'width': 844, 'height': 390})]:
        page.set_viewport_size(size)
        page.evaluate('qaSprites.store.getState().playIntro(null)')
        page.get_by_label('Escena 1 de 6').wait_for()
        for index in range(1, 7):
            page.get_by_label(f'Escena {index} de 6').wait_for()
            if index in [4, 6]:
                page.wait_for_function("Array.from(document.querySelectorAll('.intro-sprite')).every(e=>getComputedStyle(e).backgroundImage!=='none')")
                page.wait_for_timeout(300)
                if index == 6:
                    toh = page.locator('.intro-actor').nth(1).bounding_box()
                    caption = page.locator('.intro-caption').bounding_box()
                    assert toh['y'] + toh['height'] < caption['y'] - 10, (label, toh, caption)
                page.screenshot(path=str(out / f'historia-{label}-{index}.png'))
            if index < 6:
                page.keyboard.press('Enter')
        page.get_by_role('button', name='¡A la aventura!', exact=True).click()
    browser.close()

payload = {'atlasMasks': report, 'otherMasks': others, 'playerFrames': players, 'mechanicsPoses': poses, 'mechanicsScenes': scenes,
           'completion': completion, 'mode': 'Palenque con contacto protegido; colisiones y entrada del motor activas.', 'errors': errors}
(out / 'revision-navegador.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(payload, ensure_ascii=False))
assert not errors, errors
assert all(item['removed'] > 0 for item in others), others
expected = {'perch': 61004, 'perchLook': 61007, 'perchTail': 66713, 'flyUp': 108977, 'flyDown': 86693, 'point': 85061}
assert all(item['cleanedPixels'] == expected[item['pose']] for item in report), report
assert max(item['height'] for item in players) - min(item['height'] for item in players) > 15, players
assert all(abs(item['head'] - item['expectedHead']) <= 1 for item in players), players
assert len(set(item['bottom'] for item in players)) == 1, players
assert all(abs(item['head'] - item['expectedHead']) <= 1 and item['simulationUnchanged'] for item in poses), poses
assert all(item['simulationUnchanged'] for item in scenes), scenes
assert completion['phase'] == 'done' and completion['checkpoint'], completion
