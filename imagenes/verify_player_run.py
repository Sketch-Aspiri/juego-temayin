"""Compara reposo y carrera de Temayin en el canvas real, sin alterar sus colisiones."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:5197')
parser.add_argument('--output', default='imagenes/.temp/temayin-carrera')
args = parser.parse_args()
out = ROOT / args.output
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(args.url)
    page.wait_for_load_state('networkidle')
    report = page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const [{PLAYER_SPRITES},{createPlayer},{loadAssets},{drawPlayerSprite},{World},{Renderer},{Input},{AudioEngine},{ALL_LEVELS}]=await Promise.all([
        import(loaded('/src/data/playerSprites.ts')),import(loaded('/src/engine/entities/player.ts')),
        import(loaded('/src/engine/assets.ts')),import(loaded('/src/engine/render/sprites.ts')),
        import(loaded('/src/engine/World.ts')),import(loaded('/src/engine/render/Renderer.ts')),
        import(loaded('/src/engine/input.ts')),import(loaded('/src/engine/audio.ts')),import(loaded('/src/data/worlds.ts'))]);
      const assets=await loadAssets();
      const board=document.createElement('div');board.id='qa-player-run';
      board.style='position:absolute;inset:0;z-index:99999;background:#193b3f;display:grid;grid-template-columns:repeat(7,1fr);gap:12px;padding:24px;align-content:start';
      document.body.append(board);
      const frames=[];
      for(const face of [1,-1])for(const anim of ['idle','run'])for(let i=0;i<PLAYER_SPRITES[anim].length;i++){
        const canvas=document.createElement('canvas');canvas.width=160;canvas.height=170;
        const c=canvas.getContext('2d'),player=createPlayer(0);
        Object.assign(player,{x:80-player.w/2,y:140-player.h,face,anim,frame:i});
        const before=JSON.stringify(player);drawPlayerSprite(c,assets,player,0,false,0,100);
        const data=c.getImageData(0,0,160,170).data;let top=170,bottom=0,left=160,right=0;
        for(let y=0;y<170;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3]>=40){
          top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
        }
        frames.push({anim,frame:i,face,height:bottom-top+1,width:right-left+1,bottom,unchanged:before===JSON.stringify(player)});
        c.strokeStyle='#e5c698';c.beginPath();c.moveTo(0,140);c.lineTo(160,140);c.moveTo(0,65);c.lineTo(160,65);c.stroke();
        c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(`${anim==='idle'?'Reposo':'Carrera'} ${i+1}`,8,24);
        c.fillText(`${bottom-top+1} px`,8,160);board.append(canvas);
      }
      window.qaPlayerRun={assets,board,createPlayer,drawPlayerSprite,World,Renderer,Input,AudioEngine,ALL_LEVELS};
      return frames;
    }""")
    page.screenshot(path=str(out / 'reposo-carrera.png'), full_page=True)
    page.evaluate("""async()=>{
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {lazyImage}=await import(loaded('/src/engine/render/artCache.ts'));
      window.qaPlayerRun.lazyImage=lazyImage;lazyImage('personajes/jugador-mecanicas.webp');
    }""")
    page.wait_for_function("qaPlayerRun.lazyImage('personajes/jugador-mecanicas.webp')")
    comparisons = page.evaluate("""()=>{
      const qa=qaPlayerRun;qa.board.replaceChildren();const metrics=[];
      const poses=[['Reposo',{anim:'idle'}],['Carrera',{anim:'run'}],['Salto',{anim:'jump',frame:3}],
        ['Caída',{anim:'fall'}],['Nado avance',{swimming:true,animT:0}],
        ['Nado patada',{swimming:true,animT:.4}],['Brazada',{swimming:true,strokeT:.2}]];
      for(const face of [1,-1])for(const [pose,state]of poses){
        const canvas=document.createElement('canvas');canvas.width=160;canvas.height=190;
        const c=canvas.getContext('2d'),player=Object.assign(qa.createPlayer(0),{frame:0,face},state);
        player.x=80-player.w/2;player.y=140-player.h;
        const before=JSON.stringify(player);qa.drawPlayerSprite(c,qa.assets,player,0,false,0,100);
        const data=c.getImageData(0,0,160,190).data;let top=190,bottom=0;
        for(let y=0;y<190;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3]>=40){
          top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
        metrics.push({pose,face,height:bottom-top+1,unchanged:before===JSON.stringify(player)});
        c.strokeStyle='#e5c698';c.beginPath();c.moveTo(0,140);c.lineTo(160,140);c.stroke();
        c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(pose,8,24);qa.board.append(canvas);
      }
      return metrics;
    }""")
    page.screenshot(path=str(out / 'carrera-salto-nado.png'), full_page=True)
    page.evaluate("""()=>{
      const qa=qaPlayerRun;qa.board.replaceChildren();qa.board.style.gridTemplateColumns='1fr';
      qa.canvas=document.createElement('canvas');qa.canvas.width=960;qa.canvas.height=560;qa.board.append(qa.canvas);
      const audio=new qa.AudioEngine();audio.muted=true;
      qa.world=new qa.World({def:qa.ALL_LEVELS.find(l=>l.id==='1-1'),audio,input:new qa.Input(),session:{score:0,coins:0,lives:3}});
      const w=qa.world,player=w.player;w.phaseT=10;w.camX=(w.checkpointTile-8)*40;
      player.x=(w.checkpointTile-4)*40;player.y=480-player.h;player.onGround=true;
      qa.renderer=new qa.Renderer(qa.canvas,qa.assets);
      qa.renderer.render(w,1000,false);
    }""")
    page.wait_for_load_state('networkidle')
    scenes = []
    for anim, frame in [('idle', 0), ('run', 0), ('run', 2), ('run', 6), ('jump', 3)]:
        state = page.evaluate("""({anim,frame})=>{
          const qa=qaPlayerRun,w=qa.world,player=w.player;
          player.anim=anim;player.frame=frame;player.y=(anim==='jump'?360:480)-player.h;
          const before=JSON.stringify(player);qa.renderer.render(w,1000,false);
          return {anim,frame,unchanged:before===JSON.stringify(player)};
        }""", {'anim': anim, 'frame': frame})
        scenes.append(state)
        page.locator('#qa-player-run canvas').screenshot(path=str(out / f'palenque-{anim}-{frame}.png'))
    browser.close()

idle = [frame['height'] for frame in report if frame['anim'] == 'idle']
run = [frame['height'] for frame in report if frame['anim'] == 'run']
payload = {'frames': report, 'comparisons': comparisons, 'scenes': scenes, 'idleRange': [min(idle), max(idle)],
           'runRange': [min(run), max(run)], 'errors': errors}
(out / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'idleRange': payload['idleRange'], 'runRange': payload['runRange'], 'errors': errors}))
assert not errors, errors
assert all(frame['unchanged'] for frame in report + comparisons + scenes), payload
assert len(set(frame['bottom'] for frame in report)) == 1, report
assert max(run) <= max(idle) + 2 and min(run) >= min(idle) - 2, payload
