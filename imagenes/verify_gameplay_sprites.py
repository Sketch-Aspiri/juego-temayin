"""Verifica carga, anclas y escenas de los sprites jugables en Chromium sin alterar guardados reales."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'verificacion' / 'sprites-jugables'
OUTPUT.mkdir(parents=True, exist_ok=True)
errors, reports = [], []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1100, 'height': 700})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto('http://127.0.0.1:5197')
    page.wait_for_load_state('networkidle')
    page.evaluate("""async () => {
      const load = path => import(performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === path).at(-1)?.name || path);
      const [{World},{Renderer},{Input},{AudioEngine},{loadAssets},{ALL_LEVELS},cache,art,newArt,draw,projectiles,coastal,playerArt] = await Promise.all([
        load('/src/engine/World.ts'), load('/src/engine/render/Renderer.ts'), load('/src/engine/input.ts'),
        load('/src/engine/audio.ts'), load('/src/engine/assets.ts'), load('/src/data/worlds.ts'),
        load('/src/engine/render/artCache.ts'),load('/src/data/gameplaySprites.ts'),load('/src/data/newGameplaySprites.ts'),
        load('/src/engine/render/gameplaySprites.ts'),load('/src/engine/render/projectileSprites.ts'),
        load('/src/engine/render/coastalPlatforms.ts'),load('/src/engine/render/playerMechanics.ts')
      ]);
      const assets = await loadAssets();
      cache.warmArt();
      window.qa = {World,Renderer,Input,AudioEngine,ALL_LEVELS,assets,cache,art,newArt,draw,projectiles,coastal,playerArt};
      document.body.replaceChildren(); document.body.style.cssText='margin:0;background:#12382f;display:grid;place-items:center;height:100vh';
      const canvas=document.createElement('canvas'); canvas.width=960;canvas.height=560;document.body.append(canvas);qa.canvas=canvas;
    }""")
    page.wait_for_function('qa.cache.PAINTED_ART.every(file => qa.cache.lazyImage(file))')
    report = page.evaluate("""() => {
      const canvas=qa.canvas,c=canvas.getContext('2d');c.fillStyle='#203e36';c.fillRect(0,0,960,560);
      c.font='bold 18px sans-serif';c.fillStyle='#fff3ce';c.fillText('Sprites nuevos · tamaño de juego y detalle',24,32);
      const entries=Object.entries(qa.newArt.NEW_GAMEPLAY_SPRITES);
      const names={quill:'Púa',fruit:'Zapote',wisp:'Fuego fatuo',algaeBall:'Bola de sargazo',waterWave:'Ola de agua',spectralWave:'Onda espectral',awning:'Toldo'};
      entries.forEach(([id,sprite],i)=>{
        const x=90+(i%4)*225,y=130+Math.floor(i/4)*210;
        qa.draw.drawSprite(c,sprite,x,y,110,id==='quill'?25:undefined);
        c.fillStyle='#fff3ce';c.fillText(names[id],x-55,y+135);
      });
      return entries.map(([id,sprite])=>({id,file:sprite.file,ready:!!qa.cache.lazyImage(sprite.file)}));
    }""")
    page.screenshot(path=str(OUTPUT / 'sprites-nuevos.png'))
    reports.extend(report)
    scenes = [
        ('1-1', 22, 'proyectiles'), ('2-2', 57, 'escombro'), ('2-3', 82, 'canones'),
        ('3-4', 26, 'columpio'), ('3-4', 26, 'agarre'), ('4-1', 27, 'pelota'),
        ('4-4', 27, 'resina'), ('5-1', 22, 'palapas'), ('5-1', 49, 'toldos'),
        ('5-3', 36, 'sargazo'), ('5-5', 44, 'barcos'), ('5-6', 38, 'tortugas'),
        ('2-7', 74, 'ola'), ('3-5', 73, 'fatuos'), ('4-5', 77, 'ondas'), ('5-6', 88, 'algas'),
    ]
    for level, x, scene in scenes:
        result = page.evaluate("""({level,x,scene}) => {
          const def=qa.ALL_LEVELS.find(l=>l.id===level), audio=new qa.AudioEngine();audio.muted=true;
          const w=new qa.World({def,audio,input:new qa.Input(),session:{score:0,coins:0,lives:3}});
          w.camX=Math.max(0,(x-9)*40);w.phaseT=10;w.player.x=x*40;w.player.y=480-w.player.h;
          for(const e of w.enemies)e.active=true;
          if(scene==='columpio'||scene==='agarre'){
            const r=w.ropes[0];r.angle=scene==='columpio'?0.35:0;
            w.player.swinging=0;w.player.vx=scene==='columpio'?100:0;
            w.player.x=r.x+Math.sin(r.angle)*r.length-w.player.w/2;
            w.player.y=r.y+Math.cos(r.angle)*r.length-w.player.h/2;
          }
          if(scene==='pelota'){w.player.ball=true;w.player.throwT=0.15;w.hoops[0].lit=true;}
          if(scene==='proyectiles'){
            w.player.fire=true;
            w.quills.push({kind:'fruit',x:w.player.x+90,y:380,vx:100,vy:30,gone:false},{x:w.player.x+150,y:395,vx:100,vy:-30,gone:false});
            w.fireballs.push({x:w.player.x+220,y:380,vx:400,vy:0,t:0.2,gone:false});
          }
          if(w.boss&&['ola','fatuos','ondas','algas'].includes(scene)){
            const b=w.boss;b.x=(x+4)*40;
            if(scene==='ola'){b.st='tail';b.waves.push({x:x*40-100,dir:1,t:0.2});}
            if(scene==='fatuos'){b.st='warn';b.wisps.push({x:x*40-100,y:385,vx:0,age:0.2});}
            if(scene==='ondas'){b.st='bark';b.waves.push({x:x*40-100,dir:1,t:0.2});}
            if(scene==='algas'){b.st='attack';b.balls.push({x:x*40-100,y:370,vx:100,vy:0,t:0.2});b.waveX=x*40-200;}
          }
          const state=()=>JSON.stringify({player:w.player,grid:w.grid,platforms:w.platforms,ropes:w.ropes,coins:w.session.coins});
          const before=state();new qa.Renderer(qa.canvas,qa.assets).render(w,1000,false);
          return {level,scene,simulationUnchanged:state()===before};
        }""", {'level': level, 'x': x, 'scene': scene})
        reports.append(result)
        page.screenshot(path=str(OUTPUT / f'{level}-{scene}.png'))
    browser.close()

(OUTPUT / 'resultado.json').write_text(json.dumps({'reports': reports, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
assert all(report.get('ready', report.get('simulationUnchanged', False)) for report in reports), reports
print(f'{len(report)} sprites nuevos y {len(scenes)} escenas revisadas; sin errores de carga ni cambios a la simulación.')
